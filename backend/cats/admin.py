from django.contrib import admin

from .models import Achievement, AchievementCat, Cat, FosterContract, OwnershipStatus


@admin.register(Cat)
class CatAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'color', 'birth_year')
    search_fields = ('name', 'owner__username')


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(OwnershipStatus)
class OwnershipStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'cat', 'status', 'assigned_by', 'updated_at')
    list_filter = ('status',)
    search_fields = ('cat__name', 'assigned_by__username')


@admin.register(FosterContract)
class FosterContractAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'cat', 'status', 'start_date', 'end_date', 'closed_at',
        'created_by',
    )
    list_filter = ('status',)
    search_fields = ('cat__name', 'created_by__username')


@admin.register(AchievementCat)
class AchievementCatAdmin(admin.ModelAdmin):
    list_display = ('id', 'cat', 'achievement')
