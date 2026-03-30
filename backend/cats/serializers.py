import base64
import datetime as dt

import webcolors
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework import serializers

from .models import (
    Achievement,
    AchievementCat,
    Cat,
    FosterContract,
    OwnershipStatus,
)


class Hex2NameColor(serializers.Field):
    def to_representation(self, value):
        return value

    def to_internal_value(self, data):
        try:
            data = webcolors.hex_to_name(data)
        except ValueError as error:
            raise serializers.ValidationError(
                'Для этого цвета нет имени.'
            ) from error
        return data


class AchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source='name')

    class Meta:
        model = Achievement
        fields = ('id', 'achievement_name')


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            format_name, imgstr = data.split(';base64,')
            ext = format_name.split('/')[-1]
            data = ContentFile(base64.b64decode(imgstr), name='temp.' + ext)
        return super().to_internal_value(data)


class CatSerializer(serializers.ModelSerializer):
    achievements = AchievementSerializer(required=False, many=True)
    color = Hex2NameColor()
    age = serializers.SerializerMethodField()
    ownership_status = serializers.SerializerMethodField()
    ownership_status_id = serializers.SerializerMethodField()
    active_foster_contract_id = serializers.SerializerMethodField()
    active_foster_contract = serializers.SerializerMethodField()
    image = Base64ImageField(required=False, allow_null=True)
    ownership_status_value = serializers.ChoiceField(
        choices=OwnershipStatus.OwnershipType.choices,
        write_only=True,
        required=False,
    )
    foster_start_date = serializers.DateField(write_only=True, required=False)
    foster_end_date = serializers.DateField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField(
        'get_image_url',
        read_only=True,
    )

    class Meta:
        model = Cat
        fields = (
            'id',
            'name',
            'color',
            'birth_year',
            'achievements',
            'owner',
            'age',
            'ownership_status',
            'ownership_status_id',
            'active_foster_contract_id',
            'active_foster_contract',
            'ownership_status_value',
            'foster_start_date',
            'foster_end_date',
            'image',
            'image_url',
        )
        read_only_fields = ('owner',)

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_ownership_status(self, obj):
        ownership = getattr(obj, 'ownership_status', None)
        if ownership is None:
            return None
        return ownership.status

    def get_active_foster_contract_id(self, obj):
        active_contract = obj.foster_contracts.filter(status='active').first()
        if active_contract is None:
            return None
        return active_contract.id

    def get_ownership_status_id(self, obj):
        ownership = getattr(obj, 'ownership_status', None)
        if ownership is None:
            return None
        return ownership.id

    def get_active_foster_contract(self, obj):
        active_contract = obj.foster_contracts.filter(status='active').first()
        if active_contract is None:
            return None
        return {
            'id': active_contract.id,
            'start_date': active_contract.start_date,
            'end_date': active_contract.end_date,
            'status': active_contract.status,
        }

    def get_age(self, obj):
        return dt.datetime.now().year - obj.birth_year

    def validate(self, attrs):
        attrs = super().validate(attrs)
        ownership_status_value = attrs.get('ownership_status_value')
        foster_start_date = attrs.get('foster_start_date')
        foster_end_date = attrs.get('foster_end_date')

        if ownership_status_value == OwnershipStatus.OwnershipType.FOSTER:
            if not foster_start_date or not foster_end_date:
                raise serializers.ValidationError(
                    {
                        'foster_end_date': (
                            'Для передержки нужно указать даты договора.'
                        )
                    }
                )
            if foster_end_date < foster_start_date:
                raise serializers.ValidationError(
                    {
                        'foster_end_date': (
                            'Дата окончания не может быть раньше даты начала.'
                        )
                    }
                )

        return attrs

    def _sync_ownership_and_contract(
        self,
        cat,
        ownership_status_value,
        foster_start_date,
        foster_end_date,
    ):
        request = self.context['request']

        if ownership_status_value is None:
            return

        ownership, _ = OwnershipStatus.objects.get_or_create(
            cat=cat,
            defaults={
                'status': ownership_status_value,
                'assigned_by': request.user,
            },
        )
        ownership.status = ownership_status_value
        ownership.assigned_by = request.user
        ownership.save()

        active_contract = cat.foster_contracts.filter(
            status=FosterContract.ContractStatus.ACTIVE
        ).first()

        if ownership_status_value == OwnershipStatus.OwnershipType.HOME:
            if active_contract is not None:
                active_contract.status = FosterContract.ContractStatus.CLOSED
                active_contract.closed_at = dt.date.today()
                active_contract.save(update_fields=('status', 'closed_at'))
            return

        if active_contract is None:
            FosterContract.objects.create(
                cat=cat,
                start_date=foster_start_date,
                end_date=foster_end_date,
                created_by=request.user,
            )
            return

        active_contract.start_date = foster_start_date
        active_contract.end_date = foster_end_date
        active_contract.full_clean()
        active_contract.save(update_fields=('start_date', 'end_date'))

    def create(self, validated_data):
        ownership_status_value = validated_data.pop('ownership_status_value', None)
        foster_start_date = validated_data.pop('foster_start_date', None)
        foster_end_date = validated_data.pop('foster_end_date', None)

        with transaction.atomic():
            if 'achievements' not in self.initial_data:
                cat = Cat.objects.create(**validated_data)
                self._sync_ownership_and_contract(
                    cat,
                    ownership_status_value,
                    foster_start_date,
                    foster_end_date,
                )
                return cat
            achievements = validated_data.pop('achievements')
            cat = Cat.objects.create(**validated_data)
            for achievement in achievements:
                current_achievement, status = Achievement.objects.get_or_create(
                    **achievement
                )
                AchievementCat.objects.create(
                    achievement=current_achievement,
                    cat=cat,
                )
            self._sync_ownership_and_contract(
                cat,
                ownership_status_value,
                foster_start_date,
                foster_end_date,
            )
            return cat

    def update(self, instance, validated_data):
        ownership_status_value = validated_data.pop('ownership_status_value', None)
        foster_start_date = validated_data.pop('foster_start_date', None)
        foster_end_date = validated_data.pop('foster_end_date', None)

        with transaction.atomic():
            instance.name = validated_data.get('name', instance.name)
            instance.color = validated_data.get('color', instance.color)
            instance.birth_year = validated_data.get(
                'birth_year',
                instance.birth_year,
            )
            instance.image = validated_data.get('image', instance.image)

            if 'achievements' in validated_data:
                achievements_data = validated_data.pop('achievements')
                achievement_objects = []
                for achievement in achievements_data:
                    current_achievement, status = Achievement.objects.get_or_create(
                        **achievement
                    )
                    achievement_objects.append(current_achievement)
                instance.achievements.set(achievement_objects)

            instance.save()
            self._sync_ownership_and_contract(
                instance,
                ownership_status_value,
                foster_start_date,
                foster_end_date,
            )
            return instance


class OwnershipStatusSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True)
    assigned_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = OwnershipStatus
        fields = (
            'id',
            'cat',
            'cat_name',
            'status',
            'assigned_by',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('assigned_by', 'created_at', 'updated_at')

    def validate_cat(self, cat):
        request = self.context['request']
        if cat.owner != request.user:
            raise serializers.ValidationError(
                'Изменять статус владения можно только для своих котов.'
            )
        if (
            self.instance is None
            and OwnershipStatus.objects.filter(cat=cat).exists()
        ):
            raise serializers.ValidationError(
                'Для этого кота статус владения уже создан.'
            )
        return cat

    def validate(self, attrs):
        cat = attrs.get('cat', getattr(self.instance, 'cat', None))
        status_value = attrs.get(
            'status',
            getattr(self.instance, 'status', None),
        )

        if (
            cat is not None
            and status_value == OwnershipStatus.OwnershipType.HOME
            and FosterContract.objects.filter(
                cat=cat,
                status=FosterContract.ContractStatus.ACTIVE,
            ).exists()
        ):
            raise serializers.ValidationError(
                {
                    'status': (
                        'Нельзя перевести кота в домашний статус, '
                        'пока договор передержки активен.'
                    )
                }
            )

        return attrs


class FosterContractSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = FosterContract
        fields = (
            'id',
            'cat',
            'cat_name',
            'start_date',
            'end_date',
            'closed_at',
            'status',
            'created_by',
            'created_at',
        )
        read_only_fields = (
            'closed_at',
            'status',
            'created_by',
            'created_at',
        )

    def validate_cat(self, cat):
        request = self.context['request']
        if cat.owner != request.user:
            raise serializers.ValidationError(
                'Создавать договор передержки можно только для своих котов.'
            )
        ownership = getattr(cat, 'ownership_status', None)
        if ownership is None:
            raise serializers.ValidationError(
                'Сначала назначьте коту статус владения.'
            )
        if ownership.status != OwnershipStatus.OwnershipType.FOSTER:
            raise serializers.ValidationError(
                'Договор передержки можно создать только для кота со статусом foster.'
            )
        return cat

    def validate(self, attrs):
        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None),
        )
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        cat = attrs.get('cat', getattr(self.instance, 'cat', None))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    'end_date': (
                        'Дата окончания не может быть раньше даты начала.'
                    )
                }
            )

        if (
            self.instance is None
            and cat is not None
            and FosterContract.objects.filter(
                cat=cat,
                status=FosterContract.ContractStatus.ACTIVE,
            ).exists()
        ):
            raise serializers.ValidationError(
                {
                    'cat': (
                        'Для этого кота уже существует активный договор '
                        'передержки.'
                    )
                }
            )

        return attrs
