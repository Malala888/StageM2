from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SectionViewSet, BrigadeViewSet, GareViewSet

router = DefaultRouter()
router.register(r'sections', SectionViewSet)
router.register(r'brigades', BrigadeViewSet)
router.register(r'gares', GareViewSet)

urlpatterns = router.urls