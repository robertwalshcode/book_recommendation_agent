# ai_recommender.py
import openai
import json
from django.conf import settings

def fetch_ai_book_recommendations(user_preferences):
    """
    Queries GPT-3.5 to get book recommendations based on user preferences.
    Returns a list of formatted book recommendations.
    """

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    # Construct the prompt for GPT-3.5
    prompt = f"""
    Suggest 3 books based on the following preferences:
    - Genres: {user_preferences.get('genres', 'any')}
    - Favorite Books: {', '.join(user_preferences.get('favorite_books', []))}
    - Mood: {user_preferences.get('mood', 'any mood')}
    - Preferred Length: {user_preferences.get('length', 'any length')}
    - Release Preference: {user_preferences.get('release_preference', 'any')}
    
    Format the response as:
    - "Title by Author"
    - "Title by Author"
    - "Title by Author"
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        recommendations_text = response.choices[0].message.content.strip()
        recommendations = recommendations_text.split("\n")

        # Remove any empty recommendations
        return [book.strip() for book in recommendations if book.strip()]
    
    except Exception as e:
        print(f"🔥 Error in AI Recommendation: {str(e)}")
        return ["No AI recommendations available due to an error."]
