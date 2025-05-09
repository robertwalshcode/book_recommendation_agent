# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from recommendations.services.google_books import fetch_books
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticated
from .models import UserBookFeedback

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

        user = None
        user_id = data.get("user_id")
        print(f"👉 Received user_id: {user_id}")

        if user_id:
            user = User.objects.filter(id=user_id).first()
            print(f"👉 Resolved user: {user}")
            if not user:
                return JsonResponse({"error": "User not found"}, status=404)
        else:
            return JsonResponse({"error": "User ID is required"}, status=400)

        # ⚙️ Fetch AI + Google Books recommendations with resolved user object
        recommendations = fetch_books(data, user=user)

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
    

@api_view(["POST"])
def submit_feedback(request):
    """
    Handle user feedback for book recommendations.
    Supports create, toggle, and update behavior.
    """
    user_id = request.data.get("user_id")
    book_title = request.data.get("book_title")
    feedback = request.data.get("feedback")
    feedback = feedback.lower() if feedback else None

    if not user_id or not book_title:
        return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    existing = UserBookFeedback.objects.filter(user=user, book_title=book_title).first()

    if feedback not in ["like", "dislike"]:
        # ❌ Undo feedback (delete)
        if existing:
            existing.delete()
            return Response({"message": "Feedback removed"}, status=status.HTTP_200_OK)
        return Response({"message": "No feedback to remove"}, status=status.HTTP_200_OK)

    if existing:
        if existing.feedback == feedback:
            # ✅ Same feedback clicked again = undo
            existing.delete()
            return Response({"message": "Feedback undone"}, status=status.HTTP_200_OK)
        else:
            # 🔄 Change from like → dislike or vice versa
            existing.feedback = feedback
            existing.save()
            return Response({"message": "Feedback updated"}, status=status.HTTP_200_OK)

    # ➕ New feedback
    UserBookFeedback.objects.create(user=user, book_title=book_title, feedback=feedback)
    return Response({"message": "Feedback submitted"}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_feedback(request):
    """
    Return all feedback by the logged-in user.
    Used to pre-populate like/dislike buttons.
    """
    user = request.user
    feedback = UserBookFeedback.objects.filter(user=user).values("book_title", "feedback")
    return Response(list(feedback), status=200)