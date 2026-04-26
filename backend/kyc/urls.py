from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MerchantKYCViewSet, ReviewerQueueViewSet, dashboard_metrics, get_me

router = DefaultRouter()
router.register(r'merchant/submissions', MerchantKYCViewSet, basename='merchant-kyc')
router.register(r'reviewer/queue', ReviewerQueueViewSet, basename='reviewer-queue')

urlpatterns = [
    path('', include(router.urls)),
    path('reviewer/metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('auth/me/', get_me, name='get_me'),
]
