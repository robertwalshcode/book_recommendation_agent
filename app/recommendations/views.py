# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from recommendations.services.google_books import fetch_books
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
def get_ai_book_recommendations(request):
    """
    API endpoint to fetch AI-generated book recommendations and augment them with Google Books API.
    """

    try:
        if request.method == "POST":
            if request.content_type != "application/json":
                return JsonResponse({"error": "Content-Type must be application/json"}, status=400)

            data = json.loads(request.body)
        
        elif request.method == "GET":
            data = request.GET.dict()

        else:
            return JsonResponse({"error": "Invalid request method"}, status=405)

        if not data.get("user_id"):
            return JsonResponse({"error": "User ID is required"}, status=400)

        # Fetch AI + Google Books recommendations
        recommendations = fetch_books(data)
        return JsonResponse({"recommendations": recommendations})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    
    except Exception as e:
        print(f"🔥 Error: {str(e)}")
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)


# 🔹 Register API
@api_view(['POST'])
def register_user(request):
    """
    Register a new user and return JWT tokens.
    """
    data = request.data
    if User.objects.filter(username=data.get('username')).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        username=data['username'],
        email=data['email'],
        password=make_password(data['password'])
    )

    refresh = RefreshToken.for_user(user)
    return Response({
        "message": "User created successfully",
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh)
    }, status=status.HTTP_201_CREATED)


# 🔹 Login API
@api_view(['POST'])
def login_user(request):
    """
    Authenticate user and return JWT token.
    """
    data = request.data
    user = authenticate(username=data.get('username'), password=data.get('password'))

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh)
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# 🔹 Logout API
@api_view(['POST'])
def logout_user(request):
    """
    Invalidate the refresh token for logout.
    """
    try:
        refresh_token = request.data.get("refresh_token")
        token = RefreshToken(refresh_token)
        token.blacklist()  # Ensure token cannot be used again (requires Django Simple JWT setup)
        return Response({"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


# 🔹 Protected Route Example (Profile)
@api_view(['GET'])
def get_user_profile(request):
    """
    Return user profile details (protected route).
    """
    user = request.user
    if user.is_authenticated:
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)