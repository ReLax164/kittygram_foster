from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

User = get_user_model()


class Achievement(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class Cat(models.Model):
    name = models.CharField(max_length=16)
    color = models.CharField(max_length=16)
    birth_year = models.IntegerField()
    owner = models.ForeignKey(
        User,
        related_name='cats',
        on_delete=models.CASCADE,
    )
    achievements = models.ManyToManyField(
        Achievement,
        through='AchievementCat',
    )
    image = models.ImageField(
        upload_to='cats/images/',
        null=True,
        default=None,
    )

    def __str__(self):
        return self.name


class OwnershipStatus(models.Model):
    class OwnershipType(models.TextChoices):
        HOME = 'home', 'Домашний'
        FOSTER = 'foster', 'На передержке'

    cat = models.OneToOneField(
        Cat,
        related_name='ownership_status',
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=10,
        choices=OwnershipType.choices,
        default=OwnershipType.HOME,
    )
    assigned_by = models.ForeignKey(
        User,
        related_name='ownership_statuses',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-updated_at',)
        verbose_name = 'Статус владения'
        verbose_name_plural = 'Статусы владения'

    def __str__(self):
        return f'{self.cat} - {self.get_status_display()}'


class FosterContract(models.Model):
    class ContractStatus(models.TextChoices):
        ACTIVE = 'active', 'Активен'
        CLOSED = 'closed', 'Закрыт'

    cat = models.ForeignKey(
        Cat,
        related_name='foster_contracts',
        on_delete=models.CASCADE,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    closed_at = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=ContractStatus.choices,
        default=ContractStatus.ACTIVE,
    )
    created_by = models.ForeignKey(
        User,
        related_name='foster_contracts',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Договор передержки'
        verbose_name_plural = 'Договоры передержки'
        constraints = [
            models.UniqueConstraint(
                fields=('cat',),
                condition=Q(status='active'),
                name='unique_active_foster_contract_per_cat',
            ),
        ]

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError(
                {'end_date': 'Дата окончания не может быть раньше даты начала.'}
            )
        if (
            self.status == self.ContractStatus.CLOSED
            and self.closed_at
            and self.closed_at < self.start_date
        ):
            raise ValidationError(
                {'closed_at': 'Дата закрытия не может быть раньше даты начала.'}
            )

    def __str__(self):
        return f'Договор передержки для {self.cat}'


class AchievementCat(models.Model):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    cat = models.ForeignKey(Cat, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.achievement} {self.cat}'
