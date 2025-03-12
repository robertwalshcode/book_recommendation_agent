# urls.py
from django.urls import path
from .views import get_ai_book_recommendations

urlpatterns = [
    path("ai/", get_ai_book_recommendations, name="ai_book_recommendations"),
]
