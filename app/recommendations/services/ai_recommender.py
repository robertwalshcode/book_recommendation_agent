# ai_recommender.py

import openai
from django.conf import settings
from recommendations.models import UserBookFeedback


def fetch_ai_book_recommendations(user_preferences, user=None):
    """
    Queries GPT-3.5 to get book recommendations based on user preferences.
    Returns a list of strings formatted as "Title by Author".
    """

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""
    Suggest 10 books based on the following preferences:
    - Genres: {user_preferences.get('genres', 'any')}
    - Favorite Books: {', '.join(user_preferences.get('favorite_books', []))}
    - Mood: {user_preferences.get('mood', 'any mood')}
    - Preferred Length: {user_preferences.get('length', 'any length')}
    - Release Preference: {user_preferences.get('release_preference', 'any')}
    
    Format each recommendation as: "Title by Author"
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip().split("\n")
        parsed = []

        for line in raw:
            if " by " in line:
                title, author = line.strip().split(" by ", 1)
                parsed.append({
                    "title": title.strip(),
                    "author": author.strip()
                })

        # ✅ Apply feedback filter if user is logged in
        if user:
            parsed = improve_recommendations(user, parsed)

        # ✅ Return clean format: "Title by Author"
        return [f"{book['title']} by {book['author']}" for book in parsed]

    except Exception as e:
        print(f"🔥 Error in AI Recommendation: {str(e)}")
        return ["No AI recommendations available due to an error."]


def improve_recommendations(user, recommendations):
    """
    Adjust recommendations based on user feedback.
    Prioritize liked books and remove disliked ones.
    """
    liked = UserBookFeedback.objects.filter(user=user, feedback="like").values_list("book_title", flat=True)
    disliked = UserBookFeedback.objects.filter(user=user, feedback="dislike").values_list("book_title", flat=True)

    recommendations.sort(key=lambda book: book["title"] in liked, reverse=True) # comment out this line to disable like functionality
    return [book for book in recommendations if book["title"] not in disliked]
