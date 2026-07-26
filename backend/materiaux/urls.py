from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterielViewSet, StockViewSet, MouvementMaterielViewSet

router = DefaultRouter()
router.register(r'materiels', MaterielViewSet)
router.register(r'stock', StockViewSet)
router.register(r'mouvements', MouvementMaterielViewSet)

urlpatterns = router.urls