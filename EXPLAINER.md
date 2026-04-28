# Playto Pay KYC Onboarding Pipeline

![Playto Pay Architecture](./architecture.png)

## Architectural Decisions & Evaluation Metrics

### 1. The State Machine
The core business logic for application states lives completely inside the `KYCSubmission` Django model (`backend/kyc/models.py`). 

Here is the exact method:

```python
    def transition_state(self, new_state, user=None, rejection_reason=None):
        valid_transitions = {
            'draft': ['submitted'],
            'submitted': ['under_review'],
            'under_review': ['approved', 'rejected', 'more_info_requested'],
            'more_info_requested': ['submitted'],
            'approved': [],
            'rejected': [],
        }

        if new_state not in valid_transitions.get(self.status, []):
            raise ValueError(f"Invalid transition from {self.status} to {new_state}")
            
        # ... logic for timestamping and notifications ...
        
        self.status = new_state
        self.save()
```

**How do I prevent an illegal transition?**
By hardcoding a `valid_transitions` dictionary mapped directly inside the model. Before any state is changed, the method checks if the `new_state` exists in the array of allowable next states for the current `self.status`. If it doesn't (for example, trying to go from `draft` straight to `approved`), it throws a strict `ValueError` which forces the API to halt and return a 400 Bad Request. Because this logic is bound directly to the database model, it is impossible for any View, Serializer, or external script to accidentally bypass these rules.

### 2. File Validation & Security
For this assessment, I utilized `URLField`s to store references to documents. This allowed for rapid integration and simulated cloud storage architecture where the frontend might upload directly to a bucket and pass the signed URL to the backend. 

**Production Edge Cases to Address:**
If I were building the direct ingestion API for these files, I would aggressively expand the validation layer:
1. **MIME-Type spoofing**: I would not rely on the file extension. I would use `python-magic` to read the file header bytes to ensure a `.pdf` is actually a PDF and not an executable.
2. **Size constraints**: Hard limits (e.g., 5MB) enforced at the Nginx reverse proxy level, not just the Django application level, to prevent Denial of Service (DoS) via memory exhaustion.

### 3. API Design
The API was designed with strict domain segregation:
- `/api/v1/merchant/...`
- `/api/v1/reviewer/...`
This ensures that the underlying QuerySets are completely isolated based on the authenticated user's role. I utilized `django-rest-framework` ViewSets to provide standard CRUD operations, and used custom `@action` decorators for specific RPC-style business logic like `/transition/`. I return standard HTTP 403s for unauthorized access, 400s for validation errors, and 200/201s for success.

### 4. Real-Time Notifications
I implemented an "In-App Notification Bell" system using a custom `NotificationEvent` model. To avoid the heavy infrastructure overhead of setting up Redis, Daphne/Channels, and WebSockets for a 72-hour assessment, the frontend uses an optimized lightweight short-polling mechanism (every 30 seconds). The state machine natively fires these notification database records whenever a status changes.

---

## 5. The Queue: Reviewer Dashboard Query & SLA Flag

Here is the exact queryset that powers the reviewer's work queue (`backend/kyc/views.py`, `ReviewerQueueViewSet.get_queryset`):

```python
def get_queryset(self):
    qs = KYCSubmission.objects.exclude(status='draft')

    status_filter = self.request.query_params.get('filter')
    if status_filter == 'queue':
        qs = qs.filter(status__in=['submitted', 'under_review']).order_by('submitted_at')
    elif status_filter == 'archive':
        qs = qs.exclude(status='draft').order_by('-submitted_at')
    else:
        qs = qs.order_by('submitted_at')

    return qs
```

And the SLA flag is a computed `@property` on the `KYCSubmission` model itself (`backend/kyc/models.py`):

```python
@property
def at_risk(self):\
    if self.status in ['submitted', 'under_review'] and self.submitted_at:
        delta = timezone.now() - self.submitted_at
        return delta.total_seconds() > 24 * 3600
    return False
```

**Why I wrote it this way:**

1. **FIFO ordering (`order_by('submitted_at')`):** The queue is sorted oldest-first. This is intentional — it ensures that no submission is starved. A reviewer always picks up the oldest unactioned case first, which is standard practice in financial compliance queues.

2. **`exclude(status='draft')` as the base filter:** Drafts are a merchant's private workspace. They should never be visible to a reviewer until the merchant explicitly clicks "Submit." This single ORM call is the entire boundary between private and shared data.

3. **The `at_risk` property is on the model, not the view:** I deliberately computed the SLA flag at the model layer rather than in a serializer annotation. This means the business rule ("24 hours") lives in one place. If the SLA changes to 48 hours, you change one line in `models.py`, and the serializer, the API, and the frontend all inherit the fix automatically. It is computed in Python on the fetched queryset — for a 72-hour assessment with a small dataset this is fine, but in production I would move this to a `Case/When` database annotation to avoid an N+1 pattern.

---

## 6. The Auth: Preventing Merchant A from Seeing Merchant B's Data

The isolation check is a single line inside `MerchantKYCViewSet.get_queryset` (`backend/kyc/views.py`):

```python
class MerchantKYCViewSet(viewsets.ModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMerchant]

    def get_queryset(self):
        # This single line is the entire data isolation boundary.
        # `self.request.user` is the authenticated JWT principal — it cannot
        # be spoofed by a request body or query parameter.
        return KYCSubmission.objects.filter(merchant=self.request.user)
```

And the `IsMerchant` permission guard that sits in front of every request on this ViewSet:

```python
class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'merchant'
        )
```

**Why this is the correct pattern:**

- The filter `merchant=self.request.user` uses the **authenticated JWT principal** from the token — not anything the client sends in the URL or body. A merchant cannot craft a request that changes this value.
- Django REST Framework calls `get_queryset()` before serializing, so even if Merchant A guesses Merchant B's submission `pk` (e.g., `GET /api/v1/merchant/submissions/42/`), the DRF `get_object()` method runs a `.get()` against the already-scoped queryset. The record simply does not exist in Merchant A's view of the world — they get a 404, not a 403, which avoids leaking the existence of the record itself (a standard IDOR mitigation).
- The `IsMerchant` guard is a class-level `permission_classes` declaration. It cannot be forgotten on individual actions because it applies to every method in the ViewSet automatically.

---

## The AI Audit: A Specific Bug Caught and Fixed

**Context:** When I asked the AI to scaffold the `mark_notification_read` endpoint, it initially generated the following:

**What the AI gave me:**
```python
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, pk):
    notification = NotificationEvent.objects.get(pk=pk)  # <-- BUG
    notification.is_read = True
    notification.save()
    return Response({"success": True})
```

**What I caught:**

The `.get(pk=pk)` call fetches the notification by its primary key with **no ownership check**. This is a classic **Insecure Direct Object Reference (IDOR)**. Any authenticated user — whether a merchant or a reviewer — could call `POST /api/v1/notifications/999/read/` with any `pk` and mark another user's notification as read. Since notification IDs are sequential integers, a bad actor could trivially enumerate and silently clear another reviewer's unread work queue.

**What I replaced it with:**
```python
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        # recipient=request.user is the ownership check.
        # If the notification exists but belongs to someone else,
        # this raises DoesNotExist and we return a 404 — not a 403 —
        # so we don't leak whether the record exists at all.
        notification = NotificationEvent.objects.get(pk=pk, recipient=request.user)
    except NotificationEvent.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return Response({"success": True})
```

The fix adds `recipient=request.user` to the `.get()` call, scoping the lookup to only records owned by the requesting user — identical in spirit to the `get_queryset` filter on the merchant ViewSet. I also added `update_fields=['is_read']` as a minor hardening measure, which tells Django to issue a single-column `UPDATE` rather than a full-row write, reducing the blast radius of any accidental field mutation.

---

## AI Audit & Usage

**How AI was used:**
I heavily leveraged an Agentic Coding Assistant (Google Deepmind) to accelerate the development of this pipeline.
- **Frontend & Styling**: The AI generated the vast majority of the React, Tailwind CSS, and shadcn/ui boilerplate. It was exceptionally useful for building out the visual layouts (Merchant Dashboard, Reviewer Details) rapidly.
- **Dockerization**: The AI configured the multi-stage Dockerfiles and `docker-compose.yml`, helping navigate a tricky Node.js versioning requirement for Vite and ensuring Gunicorn was properly bound for deployment.
- **Boilerplate generation**: The AI was used to quickly scaffold standard Django boilerplate (serializers, urls, viewsets) based on my structural instructions.

**Where AI fell short / required human intervention:**
- **Deployment Networking**: When deploying to Render, the AI initially assumed standard IPv4 outbound behavior. I had to manually configure and troubleshoot the Supabase Connection Pooling (Session Pooler) to bypass Render's lack of IPv6 outbound support.
- **Routing Edge Cases**: The AI built a fast SPA frontend, but initially missed the Vercel-specific routing configuration. I had to explicitly catch the `404 Not Found` error upon manual browser refresh and direct the AI to create the `vercel.json` rewrite rule to fix React Router behavior on static hosting.
- **Security Nuances**: The AI suggested using `ALLOWED_HOSTS = ['*']` and `CORS_ALLOW_ALL_ORIGINS = True` to guarantee successful deployment in the 72-hour window. While effective for getting the app live, I am fully aware that in a real production environment, these must be strictly locked down to the specific Vercel frontend domain to prevent CSRF and unauthorized API usage.
