from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, MeView

router = DefaultRouter()
router.register(r'users', UtilisateurViewSet)

urlpatterns = [
    # La route /users/me/ doit être définie AVANT l'inclusion des routes du routeur
    path('users/me/', MeView.as_view(), name='me'),
    path('', include(router.urls)),
]