from django.core.management.base import BaseCommand
from django.utils import timezone
from materiaux.models import MouvementMateriel


class Command(BaseCommand):
    help = "Passe en EN_RETARD tous les emprunts EN_COURS dont la date de retour prévue est dépassée."

    def handle(self, *args, **options):
        count = MouvementMateriel.objects.filter(
            type='EMPRUNT',
            statut='EN_COURS',
            date_retour_prevue__lt=timezone.now().date(),
        ).update(statut='EN_RETARD')
        self.stdout.write(self.style.SUCCESS(f"{count} mouvement(s) passé(s) en EN_RETARD."))