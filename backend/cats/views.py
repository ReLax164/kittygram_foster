from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Achievement, Cat, FosterContract, OwnershipStatus
from .permissions import IsCatOwnerOrReadOnly
from .serializers import (
    AchievementSerializer,
    CatSerializer,
    FosterContractSerializer,
    OwnershipStatusSerializer,
)


class CatViewSet(viewsets.ModelViewSet):
    """Управление карточками котов."""

    queryset = Cat.objects.all().select_related('owner').prefetch_related(
        'foster_contracts'
    ).order_by('id')
    serializer_class = CatSerializer
    permission_classes = (IsCatOwnerOrReadOnly,)
    pagination_class = PageNumberPagination

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=('get',), url_path='foster')
    def foster(self, request):
        queryset = self.get_queryset().filter(
            ownership_status__status=OwnershipStatus.OwnershipType.FOSTER
        )

        owner_id = request.query_params.get('owner')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        active_contract = request.query_params.get('active_contract')
        if active_contract == 'true':
            queryset = queryset.filter(
                foster_contracts__status=FosterContract.ContractStatus.ACTIVE
            )
        elif active_contract == 'false':
            queryset = queryset.exclude(
                foster_contracts__status=FosterContract.ContractStatus.ACTIVE
            )

        queryset = queryset.distinct().order_by('id')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AchievementViewSet(viewsets.ModelViewSet):
    """Управление достижениями котов."""

    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    pagination_class = None


class OwnershipStatusViewSet(viewsets.ModelViewSet):
    """Управление статусами владения котами."""

    queryset = OwnershipStatus.objects.select_related('cat', 'assigned_by')
    serializer_class = OwnershipStatusSerializer
    permission_classes = (IsCatOwnerOrReadOnly,)
    http_method_names = ('get', 'post', 'patch', 'head', 'options')

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        cat_id = self.request.query_params.get('cat')
        if status_param:
            queryset = queryset.filter(status=status_param)
        if cat_id:
            queryset = queryset.filter(cat_id=cat_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class FosterContractViewSet(viewsets.ModelViewSet):
    """Управление договорами передержки."""

    queryset = FosterContract.objects.select_related('cat', 'created_by')
    serializer_class = FosterContractSerializer
    permission_classes = (IsCatOwnerOrReadOnly,)
    http_method_names = ('get', 'post', 'patch', 'head', 'options')

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        cat_id = self.request.query_params.get('cat')
        owner_id = self.request.query_params.get('owner')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if cat_id:
            queryset = queryset.filter(cat_id=cat_id)
        if owner_id:
            queryset = queryset.filter(cat__owner_id=owner_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=('post',), url_path='close')
    def close(self, request, pk=None):
        contract = self.get_object()
        if contract.status == FosterContract.ContractStatus.CLOSED:
            return Response(
                {'detail': 'Договор уже закрыт.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contract.status = FosterContract.ContractStatus.CLOSED
        contract.closed_at = timezone.localdate()
        contract.save(update_fields=('status', 'closed_at'))

        ownership = getattr(contract.cat, 'ownership_status', None)
        if ownership is not None:
            ownership.status = OwnershipStatus.OwnershipType.HOME
            ownership.assigned_by = request.user
            ownership.save(update_fields=('status', 'assigned_by', 'updated_at'))

        serializer = self.get_serializer(contract)
        return Response(serializer.data, status=status.HTTP_200_OK)
