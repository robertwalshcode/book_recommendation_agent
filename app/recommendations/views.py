# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from recommendations.services.google_books import fetch_books

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
