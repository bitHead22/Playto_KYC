from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MerchantKYCViewSet, ReviewerQueueViewSet, dashboard_metrics,
    get_me, register_user,
    list_notifications, mark_notification_read, mark_all_notifications_read
)

router = DefaultRouter()
router.register(r'merchant/submissions', MerchantKYCViewSet, basename='merchant-kyc')
router.register(r'reviewer/queue', ReviewerQueueViewSet, basename='reviewer-queue')

urlpatterns = [
    path('', include(router.urls)),
    path('reviewer/metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('auth/me/', get_me, name='get_me'),
    path('auth/register/', register_user, name='register'),
    # Notification endpoints
    path('notifications/', list_notifications, name='list-notifications'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='mark-notification-read'),
    path('notifications/read-all/', mark_all_notifications_read, name='mark-all-notifications-read'),
]
