# urls.py
from django.urls import path
from .views import get_ai_book_recommendations, register_user, login_user, logout_user, get_user_profile

urlpatterns = [
    path("ai/", get_ai_book_recommendations, name="ai_book_recommendations"),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('logout/', logout_user, name='logout'),
    path('profile/', get_user_profile, name='profile'),
]
