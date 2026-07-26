from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Vos applications
    path('api/accounts/', include('accounts.urls')),
    path('api/personnel/', include('personnel.urls')),
    path('api/materiaux/', include('materiaux.urls')),
]