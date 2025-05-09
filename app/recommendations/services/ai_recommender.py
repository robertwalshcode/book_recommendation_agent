# ai_recommender.py

import openai
from django.conf import settings
from recommendations.models import UserBookFeedback, UserSearchHistory
import numpy as np


def fetch_ai_book_recommendations(user_preferences, user=None):
    """
    Queries GPT-3.5 to get book recommendations based on user preferences
    and enriches it with the user’s past search history.
    Returns a list of strings formatted as "Title by Author".
    """

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    def cosine_similarity(vec1, vec2):
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

    # 🧠 Retrieve most similar past user history (RAG style)
    history_summary = ""
    top_histories = []
    if user:
        try:
            # ✅ Compute embedding for current preferences
            current_text = f"Prefs: {user_preferences}"
            current_embedding = compute_embedding(current_text)

            # ✅ Retrieve all past histories with embeddings
            histories = UserSearchHistory.objects.filter(user=user).exclude(embedding=None)

            # ✅ Compute similarity scores
            scored_histories = [
                (h, cosine_similarity(current_embedding, h.embedding))
                for h in histories
            ]

            # ✅ Print similarity scores
            for (h, score) in scored_histories:
                print(f"🔍 Similarity with history {h.id}: {score:.4f}")



            # ✅ Sort and get top 5 similar
            top_histories = sorted(scored_histories, key=lambda x: x[1], reverse=True)[:5]

            # ✅ Build summary string
            history_summary = "\n".join([
                f"Prefs: {h.preferences}, Recs: {[r['title'] for r in h.recommendations]}"
                for (h, score) in top_histories
            ])

            print(f"🔍 Retrieved {len(top_histories)} most similar past histories for {user.username}")
            # print(f"History Summary:\n{history_summary}")

        except Exception as e:
            print(f"⚠️ Failed to retrieve similar histories: {str(e)}")
    else:
        print("📖 No user provided — skipping history retrieval.")

    # 📖 Retrieve disliked books      
    disliked_books = []
    if user:
        disliked_books = list(UserBookFeedback.objects.filter(user=user, feedback="dislike")
                            .values_list("book_title", flat=True))
        # print(f"❌ Disliked books for {user.username}: {disliked_books}")
    else:
        disliked_books = []
        print("❌ No user provided — skipping disliked books check.")  

    # 📢 Build GPT prompt
    prompt = f"""
    The user has previously received the following recommendations:
    {history_summary}

    The user has also explicitly disliked these books:
    {', '.join(disliked_books) if disliked_books else 'None'}

    Please suggest 10 **new and diverse** books that:
    - Match the current preferences:
        - Genres: {user_preferences.get('genres', 'any')}
        - Favorite Books: {', '.join(user_preferences.get('favorite_books', []))}
        - Mood: {user_preferences.get('mood', 'any mood')}
        - Preferred Length: {user_preferences.get('length', 'any length')}
        - Release Preference: {user_preferences.get('release_preference', 'any')}
    - Avoid repetition of titles or authors from past recommendations.
    - **Avoid recommending any of the explicitly disliked books.**
    - Introduce variety in themes, settings, or writing styles.

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

        # 🧠 Optional: Validate reasoning of recommendations
        try:
            validation_summary = validate_recommendations_with_reasoning(
                [f"{book['title']} by {book['author']}" for book in parsed],
                user_preferences
            )
            # print("🔎 AI Reasoning Summary:\n", validation_summary)
        except Exception as ve:
            print(f"⚠️ Reasoning validation failed: {str(ve)}")

        # 💾 Save search + recommendations to DB (with embedding)
        if user:
            try:
                summary_text = f"Prefs: {user_preferences}, Recs: {[book['title'] for book in parsed]}"
                embedding = compute_embedding(summary_text)

                UserSearchHistory.objects.create(
                    user=user,
                    preferences=user_preferences,
                    recommendations=parsed,
                    embedding=embedding
                )
                print(f"📖 Saved search history with embedding for {user.username}.")
            except Exception as e:
                print(f"⚠️ Failed to compute or save embedding: {str(e)}")

            # ✅ Optional: print retrieved history for debug
            print(f"📖 Loaded user history for {user.username}:")
            for (h, score) in top_histories:
                print(f"- Prefs: {h.preferences}, Recs: {[r['title'] for r in h.recommendations]}, Similarity: {score:.4f}")
        else:
            print("📖 No user provided — skipping history logging.")


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

def validate_recommendations_with_reasoning(recommendations, user_preferences):
    """
    Use GPT to reason about whether the book recommendations align with the user's preferences.
    Returns a summary message indicating validation status.
    """

    # Build the validation prompt
    validation_prompt = f"""
    A user gave these preferences:
    - Genres: {user_preferences.get('genres', 'any')}
    - Favorite Books: {', '.join(user_preferences.get('favorite_books', []))}
    - Mood: {user_preferences.get('mood', 'any mood')}
    - Preferred Length: {user_preferences.get('length', 'any length')}
    - Release Preference: {user_preferences.get('release_preference', 'any')}

    These book recommendations were generated:
    {chr(10).join([f"- {r}" for r in recommendations])}

    Do these recommendations seem aligned with the preferences? Flag any major issues (genre mismatch, repetition, disliked books, etc.) and rate their usefulness.
    """

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": validation_prompt}]
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"⚠️ Error during validation: {str(e)}")
        return "Validation failed due to an error."

def compute_embedding(text):
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding