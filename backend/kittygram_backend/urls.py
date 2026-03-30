from cats.views import (
    AchievementViewSet,
    CatViewSet,
    FosterContractViewSet,
    OwnershipStatusViewSet,
)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions, routers

router = routers.DefaultRouter()
router.register(r'cats', CatViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'ownership-statuses', OwnershipStatusViewSet)
router.register(r'foster-contracts', FosterContractViewSet)

schema_view = get_schema_view(
    openapi.Info(
        title='Kittygram API',
        default_version='v1',
        description='Документация API проекта Kittygram.',
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('djoser.urls')),
    path('api/', include('djoser.urls.authtoken')),
    path(
        'swagger/',
        schema_view.with_ui('swagger', cache_timeout=0),
        name='schema-swagger-ui',
    ),
    path(
        'redoc/',
        schema_view.with_ui('redoc', cache_timeout=0),
        name='schema-redoc',
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
