from django.core.management.base import BaseCommand
from kyc.models import User, KYCSubmission

class Command(BaseCommand):
    help = 'Seed the database with initial users'

    def handle(self, *args, **options):
        # Create Reviewer
        reviewer, created = User.objects.get_or_create(username='reviewer1', defaults={'email': 'reviewer1@playtopay.com', 'role': 'reviewer'})
        if created:
            reviewer.set_password('password123')
            reviewer.save()
            self.stdout.write(self.style.SUCCESS('Successfully created reviewer1'))

        # Create Merchants
        merchant_1, created = User.objects.get_or_create(username='merchant_1', defaults={'email': 'merchant_1@playtopay.com', 'role': 'merchant'})
        if created:
            merchant_1.set_password('password123')
            merchant_1.save()
            self.stdout.write(self.style.SUCCESS('Successfully created merchant_1'))

        merchant_2, created = User.objects.get_or_create(username='merchant_2', defaults={'email': 'merchant_2@playtopay.com', 'role': 'merchant'})
        if created:
            merchant_2.set_password('password123')
            merchant_2.save()
            self.stdout.write(self.style.SUCCESS('Successfully created merchant_2'))

        # Create Submissions
        sub1, created1 = KYCSubmission.objects.get_or_create(
            merchant=merchant_1,
            defaults={
                'business_name': 'Alpha Corp',
                'status': 'draft'
            }
        )
        if created1:
            self.stdout.write(self.style.SUCCESS('Created draft submission for merchant_1'))

        sub2, created2 = KYCSubmission.objects.get_or_create(
            merchant=merchant_2,
            defaults={
                'business_name': 'Beta Tech',
                'status': 'draft'
            }
        )
        if created2:
            # Transition to under_review to ensure timestamps and notifications are fired
            sub2.transition_state('submitted')
            sub2.transition_state('under_review')
            self.stdout.write(self.style.SUCCESS('Created under_review submission for merchant_2'))

        self.stdout.write(self.style.SUCCESS('Database seeding complete.'))
