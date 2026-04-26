import os
from rest_framework import serializers
from .models import User, KYCSubmission, NotificationEvent

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class FileValidationMixin:
    def validate_file(self, file_obj):
        if not file_obj:
            return file_obj
            
        # 5 MB limit
        if file_obj.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 5MB.")
            
        # Extension validation
        ext = os.path.splitext(file_obj.name)[1].lower()
        valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
        if ext not in valid_extensions:
            raise serializers.ValidationError(f"Invalid file type {ext}. Only PDF, JPG, and PNG are allowed.")
            
        return file_obj

class KYCSubmissionSerializer(serializers.ModelSerializer, FileValidationMixin):
    at_risk = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = KYCSubmission
        fields = '__all__'
        read_only_fields = ('merchant', 'status', 'rejection_reason', 'created_at', 'updated_at', 'submitted_at', 'reviewed_at')

    def validate_pan_file(self, value):
        return self.validate_file(value)

    def validate_aadhaar_file(self, value):
        return self.validate_file(value)

    def validate_bank_statement_file(self, value):
        return self.validate_file(value)


class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = '__all__'
