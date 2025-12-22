from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from knox.auth import TokenAuthentication
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta

from .permissions import IsCustomAdmin
from documents.models import Document, ClassificationLog

User = get_user_model()


class AdminUserViewSet(viewsets.ViewSet):
    """
    ViewSet pour la gestion complète des utilisateurs par l'admin.
    - list : liste des utilisateurs
    - retrieve : détail d'un utilisateur
    - create : ajouter un utilisateur avec image
    - update : modifier infos, image ou mot de passe
    - partial_update : activer/désactiver
    - destroy : supprimer un utilisateur
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsCustomAdmin]

    def list(self, request):
        """
        GET /api/admin/users/
        Liste tous les utilisateurs
        """
        users = User.objects.all()
        data = [{
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
            "date_joined": u.date_joined,
            "last_login": u.last_login,
            "document_count": u.documents.count(),
            "image": request.build_absolute_uri(u.image.url) if u.image else None
        } for u in users]
        return Response(data)

    def retrieve(self, request, pk=None):
        """
        GET /api/admin/users/{id}/
        Détail d'un utilisateur
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        data = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "date_joined": user.date_joined,
            "last_login": user.last_login,
            "birthday": user.birthday,
            "document_count": user.documents.count(),
            "image": request.build_absolute_uri(user.image.url) if user.image else None
        }
        return Response(data)

    def create(self, request):
        """
        POST /api/admin/users/
        Ajouter un utilisateur (avec image)
        """
        email = request.data.get("email")
        password = request.data.get("password")
        username = request.data.get("username")
        role = request.data.get("role", "user")
        image = request.FILES.get("image")

        if not email or not password:
            return Response(
                {"error": "Email et mot de passe sont requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in ["admin", "user"]:
            return Response(
                {"error": "Le rôle doit être 'admin' ou 'user'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Cet email est déjà utilisé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            email=email,
            password=password,
            username=username,
            role=role
        )

        if image:
            user.image = image
            user.save()

        return Response({
            "message": "Utilisateur ajouté avec succès",
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "image": request.build_absolute_uri(user.image.url) if user.image else None
        }, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """
        PUT /api/admin/users/{id}/
        Modifier un utilisateur (infos + image + mot de passe)
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        user.username = request.data.get("username", user.username)
        user.email = request.data.get("email", user.email)
        user.role = request.data.get("role", user.role)

        # Conversion du champ is_active (string → bool)
        is_active = request.data.get("is_active")
        if is_active is not None:
            if str(is_active).lower() in ["true", "1", "yes"]:
                user.is_active = True
            elif str(is_active).lower() in ["false", "0", "no"]:
                user.is_active = False

        # Changement du mot de passe (si fourni)
        password = request.data.get("password")
        if password:
            user.set_password(password)

        # Mise à jour de l'image
        image = request.FILES.get("image")
        if image:
            user.image = image

        user.save()

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "image": request.build_absolute_uri(user.image.url) if user.image else None
        })

    def partial_update(self, request, pk=None):
        """
        PATCH /api/admin/users/{id}/
        Activer / Désactiver un utilisateur
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        is_active = request.data.get("is_active")
        if is_active is None:
            return Response(
                {"error": "Champ 'is_active' requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if str(is_active).lower() in ["true", "1", "yes"]:
            user.is_active = True
        elif str(is_active).lower() in ["false", "0", "no"]:
            user.is_active = False

        user.save()

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "image": request.build_absolute_uri(user.image.url) if user.image else None
        })

    def destroy(self, request, pk=None):
        """
        DELETE /api/admin/users/{id}/
        Supprimer un utilisateur
        """
        try:
            user = User.objects.get(pk=pk)
            
            # Empêcher de se supprimer soi-même
            if user == request.user:
                return Response(
                    {"error": "Vous ne pouvez pas vous supprimer vous-même"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.delete()
            return Response({"message": "Utilisateur supprimé avec succès"})
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        GET /api/admin/users/statistics/
        Statistiques détaillées des utilisateurs
        """
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        admins = User.objects.filter(role='admin').count()
        regular_users = User.objects.filter(role='user').count()
        
        # Utilisateurs créés cette semaine
        week_ago = timezone.now() - timedelta(days=7)
        new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
        
        # Utilisateurs actifs (connectés dans les 30 derniers jours)
        month_ago = timezone.now() - timedelta(days=30)
        active_last_month = User.objects.filter(
            last_login__gte=month_ago
        ).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'admins': admins,
            'regular_users': regular_users,
            'new_users_this_week': new_users_week,
            'active_last_month': active_last_month
        })


class AdminDocumentViewSet(viewsets.ViewSet):
    """
    ViewSet pour la gestion avancée des documents par l'admin
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsCustomAdmin]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        GET /api/admin/documents/overview/
        Vue d'ensemble des documents
        """
        total_docs = Document.objects.count()
        processed_docs = Document.objects.filter(processed=True).count()
        failed_docs = Document.objects.filter(processed=False).exclude(error_message__isnull=True).count()
        
        # Documents par classe
        by_class = Document.objects.values('predicted_class').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Documents récents (7 derniers jours)
        week_ago = timezone.now() - timedelta(days=7)
        recent_docs = Document.objects.filter(uploaded_at__gte=week_ago).count()
        
        # Confiance moyenne
        avg_confidence = Document.objects.filter(
            processed=True
        ).aggregate(avg=Avg('confidence'))['avg']
        
        return Response({
            'total_documents': total_docs,
            'processed_documents': processed_docs,
            'failed_documents': failed_docs,
            'documents_by_class': list(by_class),
            'recent_documents_week': recent_docs,
            'average_confidence': round(avg_confidence * 100, 2) if avg_confidence else 0
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        GET /api/admin/documents/pending/
        Liste des documents en attente de traitement ou en erreur
        """
        pending = Document.objects.filter(processed=False)
        
        data = [{
            'id': doc.id,
            'original_filename': doc.original_filename,
            'owner_email': doc.owner.email if doc.owner else None,
            'uploaded_at': doc.uploaded_at,
            'error_message': doc.error_message
        } for doc in pending]
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        POST /api/admin/documents/bulk_delete/
        Body: { "document_ids": [1, 2, 3] }
        Suppression en masse de documents
        """
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response(
                {'error': 'Liste de document_ids requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = Document.objects.filter(id__in=document_ids).delete()[0]
        
        return Response({
            'message': f'{deleted_count} documents supprimés avec succès',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['post'])
    def reprocess(self, request):
        """
        POST /api/admin/documents/reprocess/
        Body: { "document_id": 1 }
        Relancer le traitement d'un document
        """
        document_id = request.data.get('document_id')
        
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Réinitialiser le statut
        document.processed = False
        document.error_message = None
        document.save()
        
        # Relancer le traitement
        try:
            from ml_models.ml_service import get_classifier
            from ml_models.document_parser import DocumentParser
            
            classifier = get_classifier()
            result = classifier.process_document(document.file.path)
            
            if result['success']:
                document.predicted_class = result['predicted_class']
                document.confidence = result['confidence']
                document.extracted_text = result['extracted_text']
                document.extracted_text_raw = result['extracted_text_raw']
                document.text_length = result['text_length']
                document.processing_time = result['processing_time']
                document.processed = True
                document.processed_at = timezone.now()
                
                probs = result['all_probabilities']
                document.probability_factures = probs.get('factures', 0)
                document.probability_contrats = probs.get('contrats', 0)
                document.probability_cartes_identite = probs.get('cartes_identite', 0)
                
                parser = DocumentParser()
                structured = parser.parse_document(
                    result['extracted_text'],
                    result['predicted_class']
                )
                document.structured_data = structured
                document.save()
                
                return Response({
                    'message': 'Document retraité avec succès',
                    'document_id': document.id,
                    'predicted_class': document.predicted_class,
                    'confidence': document.confidence_percentage
                })
            else:
                document.error_message = result['error']
                document.save()
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            document.error_message = str(e)
            document.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def logs(self, request):
        """
        GET /api/admin/documents/logs/
        Logs d'activité récents
        """
        logs = ClassificationLog.objects.select_related('document', 'user').all()[:100]
        
        data = [{
            'id': log.id,
            'document_id': log.document.id,
            'document_name': log.document.original_filename,
            'user_email': log.user.email if log.user else None,
            'action': log.action,
            'success': log.success,
            'timestamp': log.timestamp
        } for log in logs]
        
        return Response(data)