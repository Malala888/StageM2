from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, MeView

router = DefaultRouter()
router.register(r'users', UtilisateurViewSet)

urlpatterns = [
    path('users/me/', MeView.as_view(), name='me'),
    path('change-password/', UtilisateurViewSet.as_view({'post': 'change_password'}), name='change-password'),
    path('', include(router.urls)),
]