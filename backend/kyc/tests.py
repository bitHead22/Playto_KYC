from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from kyc.models import User, KYCSubmission, NotificationEvent
from django.core.exceptions import ValidationError

class KYCAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = User.objects.create_user(username='merchant', password='password', email='m@example.com', role='merchant')
        self.reviewer = User.objects.create_user(username='reviewer', password='password', email='r@example.com', role='reviewer')

    def test_merchant_can_access_own_submissions(self):
        self.client.force_authenticate(user=self.merchant)
        response = self.client.get('/api/v1/merchant/submissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_merchant_cannot_access_reviewer_queue(self):
        self.client.force_authenticate(user=self.merchant)
        response = self.client.get('/api/v1/reviewer/queue/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_can_access_queue(self):
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.get('/api/v1/reviewer/queue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class KYCStateMachineTests(TestCase):
    def setUp(self):
        self.merchant = User.objects.create_user(username='merchant', password='password', role='merchant')
        self.reviewer = User.objects.create_user(username='reviewer', password='password', role='reviewer')
        self.submission = KYCSubmission.objects.create(
            merchant=self.merchant,
            business_name="Test Business",
            status="draft"
        )

    def test_transition_draft_to_submitted(self):
        self.submission.transition_state('submitted')
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'submitted')

        # Check if notification was created for reviewer
        reviewer_notification = NotificationEvent.objects.filter(recipient__role='reviewer').exists()
        self.assertTrue(reviewer_notification)

    def test_invalid_transition(self):
        with self.assertRaises(ValidationError):
            # Cannot jump directly from draft to approved
            self.submission.transition_state('approved')

    def test_transition_submitted_to_under_review_to_approved(self):
        # Move to submitted first
        self.submission.transition_state('submitted')
        
        # Move to under review
        self.submission.transition_state('under_review')
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'under_review')

        # Approve
        self.submission.transition_state('approved')
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'approved')

        # Check if merchant was notified of approval via event_type
        merchant_notification = NotificationEvent.objects.filter(recipient=self.merchant, event_type='STATUS_CHANGED_TO_APPROVED').exists()
        self.assertTrue(merchant_notification)

class KYCValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = User.objects.create_user(username='merchant', password='password', role='merchant')
        self.client.force_authenticate(user=self.merchant)

    def test_create_valid_draft_submission(self):
        data = {
            "business_name": "Valid Business LLC"
        }
        response = self.client.post('/api/v1/merchant/submissions/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'draft')
