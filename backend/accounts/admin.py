from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    model = Utilisateur
    list_display = ('email', 'nom', 'prenom', 'role', 'statut', 'section', 'brigade', 'is_staff', 'is_superuser')
    list_filter = ('role', 'statut', 'section', 'brigade')
    search_fields = ('email', 'nom', 'prenom')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('nom', 'prenom')}),
        ('Rôle & affectation', {'fields': ('role', 'poste', 'statut', 'section', 'brigade')}),
        ('Dates', {'fields': ('date_inscription', 'date_validation')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nom', 'prenom', 'role', 'section', 'brigade', 'password1', 'password2'),
        }),
    )
    readonly_fields = ('date_inscription',)
    filter_horizontal = ('groups', 'user_permissions')