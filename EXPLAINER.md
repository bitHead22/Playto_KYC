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
