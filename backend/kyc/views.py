from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Case, When, Value, BooleanField, Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import KYCSubmission, NotificationEvent
from .serializers import KYCSubmissionSerializer, NotificationEventSerializer, UserSerializer

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Account created successfully.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'merchant')

class IsReviewer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'reviewer')

class MerchantKYCViewSet(viewsets.ModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMerchant]

    def get_queryset(self):
        return KYCSubmission.objects.filter(merchant=self.request.user)

    def perform_create(self, serializer):
        submission = serializer.save(merchant=self.request.user)
        target_status = self.request.data.get('status')
        if target_status == 'submitted':
            submission.transition_state('submitted')

    def perform_update(self, serializer):
        submission = serializer.save()
        target_status = self.request.data.get('status')
        if target_status == 'submitted' and submission.status != 'submitted':
            submission.transition_state('submitted')


class ReviewerQueueViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewer]

    def get_queryset(self):
        qs = KYCSubmission.objects.exclude(status='draft')
        
        status_filter = self.request.query_params.get('filter')
        if status_filter == 'queue':
            qs = qs.filter(status__in=['submitted', 'under_review']).order_by('submitted_at')
        elif status_filter == 'archive':
            # For archives, show what reviewer has done (approved, rejected)
            # or all non-draft for simplicity
            qs = qs.exclude(status='draft').order_by('-submitted_at')
        else:
            qs = qs.order_by('submitted_at')

        return qs

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        submission = self.get_object()
        target_state = request.data.get('status')
        reason = request.data.get('rejection_reason')

        if not target_state:
            return Response({"error": {"code": "MISSING_STATUS", "message": "Target status is required."}}, status=status.HTTP_400_BAD_REQUEST)

        # The state machine logic runs in the model and raises Django ValidationError if invalid
        submission.transition_state(target_state, reviewer=request.user, reason=reason)
        
        # Re-fetch with at_risk annotation just in case
        updated_submission = self.get_queryset().get(pk=submission.pk)
        return Response(self.get_serializer(updated_submission).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsReviewer])
def dashboard_metrics(request):
    # Total submissions in queue (submitted + under_review)
    in_queue = KYCSubmission.objects.filter(status__in=['submitted', 'under_review'])
    total_in_queue = in_queue.count()

    # Average time-in-queue (for those currently in queue)
    # or historically (reviewed_at - submitted_at)
    # Let's compute average time to review for historical accuracy
    reviewed_submissions = KYCSubmission.objects.filter(
        status__in=['approved', 'rejected'],
        reviewed_at__isnull=False,
        submitted_at__isnull=False
    )
    
    # We can use Django ORM to compute duration
    avg_time = reviewed_submissions.annotate(
        duration=F('reviewed_at') - F('submitted_at')
    ).aggregate(avg_duration=Avg('duration'))['avg_duration']

    avg_time_str = str(avg_time) if avg_time else "N/A"

    # Approval rate over the last 7 days
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_reviews = KYCSubmission.objects.filter(
        status__in=['approved', 'rejected'],
        reviewed_at__gte=seven_days_ago
    )
    
    total_recent = recent_reviews.count()
    approved_recent = recent_reviews.filter(status='approved').count()
    
    approval_rate = (approved_recent / total_recent * 100) if total_recent > 0 else 0

    return Response({
        "total_in_queue": total_in_queue,
        "avg_time_in_queue": avg_time_str,
        "approval_rate_7d_percent": round(approval_rate, 2)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_me(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "role": request.user.role
    })
