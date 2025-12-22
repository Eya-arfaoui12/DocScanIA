"""
Factories pour créer des objets de test facilement
"""
import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model
from documents.models import Document

User = get_user_model()


class UserFactory(DjangoModelFactory):
    """
    Factory pour créer des utilisateurs
    Usage: user = UserFactory()
    """
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        """Définir le mot de passe après création"""
        if not create:
            return
        if extracted:
            self.set_password(extracted)
        else:
            self.set_password('DefaultPassword123!')


class DocumentFactory(DjangoModelFactory):
    """
    Factory pour créer des documents
    Usage: doc = DocumentFactory(uploaded_by=user)
    """
    class Meta:
        model = Document
    
    title = factory.Faker('sentence', nb_words=4)
    uploaded_by = factory.SubFactory(UserFactory)
    status = 'pending'
    
    @factory.lazy_attribute
    def file(self):
        """Générer un fichier fake"""
        return factory.django.FileField(filename='test_doc.pdf')