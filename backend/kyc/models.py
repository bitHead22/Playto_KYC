from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('merchant', 'Merchant'),
        ('reviewer', 'Reviewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='merchant')


class KYCSubmission(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    )

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Personal Details
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Business Details
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    expected_monthly_volume_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Documents
    pan_file = models.FileField(upload_to='kyc_docs/pan/', null=True, blank=True)
    aadhaar_file = models.FileField(upload_to='kyc_docs/aadhaar/', null=True, blank=True)
    bank_statement_file = models.FileField(upload_to='kyc_docs/bank/', null=True, blank=True)
    
    # System Fields
    rejection_reason = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    @property
    def at_risk(self):
        if self.status in ['submitted', 'under_review'] and self.submitted_at:
            delta = timezone.now() - self.submitted_at
            return delta.total_seconds() > 24 * 3600
        return False

    ALLOWED_TRANSITIONS = {
        'draft': ['submitted'],
        'submitted': ['under_review'],
        'under_review': ['approved', 'rejected', 'more_info_requested'],
        'more_info_requested': ['submitted'],
        'approved': [],
        'rejected': [],
    }

    def transition_state(self, target_state, reviewer=None, reason=None):
        if target_state not in self.ALLOWED_TRANSITIONS.get(self.status, []):
            raise ValidationError({
                "code": "INVALID_TRANSITION",
                "message": f"Cannot transition from {self.status} to {target_state}"
            })

        if target_state in ['rejected', 'more_info_requested'] and not reason:
            raise ValidationError({
                "code": "MISSING_REASON",
                "message": f"Reason is required when transitioning to {target_state}"
            })

        old_status = self.status
        self.status = target_state

        if target_state == 'submitted':
            self.submitted_at = timezone.now()
        elif target_state in ['approved', 'rejected', 'more_info_requested']:
            if target_state in ['approved', 'rejected']:
                self.reviewed_at = timezone.now()
            if target_state in ['rejected', 'more_info_requested']:
                self.rejection_reason = reason

        self.save()

        # Create notification event
        NotificationEvent.objects.create(
            merchant=self.merchant,
            event_type=f'STATUS_CHANGED_TO_{target_state.upper()}',
            payload={
                'old_status': old_status,
                'new_status': target_state,
                'reviewer_id': reviewer.id if reviewer else None,
                'reason': reason
            }
        )

    def __str__(self):
        return f"KYC {self.id} - {self.merchant.username} ({self.status})"


class NotificationEvent(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.event_type} for {self.merchant.username}"
