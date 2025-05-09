# google_books.py
import requests
import hashlib
import json
from django.core.cache import cache
from django.conf import settings
from recommendations.services.ai_recommender import fetch_ai_book_recommendations

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

def fetch_books(user_preferences, user=None):
    """
    Uses GPT-3.5 to suggest books and retrieves details from Google Books API.
    Implements caching using Django's cache framework.
    """

    if not isinstance(user_preferences, dict):
        print("⚠️ Invalid user preferences format.")
        return []

    # Create a cache key based on user preferences
    cache_key = make_cache_key(user_preferences)

    # Check if cached data exists
    cached_books = cache.get(cache_key)
    if cached_books:
        return cached_books  # Return cached results

    # AI-generated book recommendations
    ai_books = fetch_ai_book_recommendations(user_preferences, user=user)

    book_details = []
    for title in ai_books:
        params = {"q": title, "key": settings.GOOGLE_BOOKS_API_KEY, "maxResults": 1}
        response = requests.get(GOOGLE_BOOKS_API_URL, params=params)

        if response.status_code == 200:
            data = response.json()
            if "items" in data:
                book = data["items"][0]
                book_details.append({
                    "title": book["volumeInfo"].get("title", "Unknown Title"),
                    "authors": book["volumeInfo"].get("authors", ["Unknown Author"]),
                    "description": book["volumeInfo"].get("description", "No description available."),
                    "thumbnail": book["volumeInfo"].get("imageLinks", {}).get("thumbnail", ""),
                    "info_link": book["volumeInfo"].get("infoLink", "#"),
                })

    # If no books are found, return a default message
    if not book_details:
        book_details.append({"title": "No books found", "authors": ["N/A"], "description": "No matching books found.", "thumbnail": "", "info_link": "#"})

    # Store results in Django cache (expires in 6 hours)
    cache.set(cache_key, book_details, timeout=21600)

    return book_details


def make_cache_key(user_preferences):
    key_string = json.dumps(user_preferences, sort_keys=True)
    hashed = hashlib.md5(key_string.encode('utf-8')).hexdigest()
    return f"books:{hashed}"
