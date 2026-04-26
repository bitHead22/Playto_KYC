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

        self.stdout.write(self.style.SUCCESS('Database seeding complete.'))
