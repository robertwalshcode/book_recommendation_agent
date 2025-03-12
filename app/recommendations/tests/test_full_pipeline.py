# Full Integration Test

import os
import openai
from django.test import TestCase
from recommendations.services.ai_recommender import get_ai_book_recommendations
from recommendations.services.google_books import fetch_books
from unittest.mock import patch

class FullPipelineTests(TestCase):
    @patch("recommendations.services.ai_recommender.openai.ChatCompletion.create")
    @patch("recommendations.services.google_books.requests.get")
    def test_full_pipeline(self, mock_google_books, mock_openai):
        """Test AI-generated book recommendations with Google Books API details."""
        
        # Mock OpenAI response
        mock_openai.return_value = {
            "choices": [{"message": {"content": "1. Dune by Frank Herbert"}}]
        }

        # Mock Google Books API response
        mock_google_books.return_value.status_code = 200
        mock_google_books.return_value.json.return_value = {
            "items": [
                {
                    "volumeInfo": {
                        "title": "Dune",
                        "authors": ["Frank Herbert"],
                        "description": "A science fiction novel set in a desert world.",
                        "pageCount": 412,
                        "imageLinks": {"thumbnail": "http://example.com/dune.jpg"},
                    }
                }
            ]
        }

        # AI recommends books
        ai_books = get_ai_book_recommendations({
            "genres": "science fiction",
            "favorite_books": ["Dune"],
            "mood": "adventurous"
        })
        self.assertEqual(ai_books, ["Dune by Frank Herbert"])

        # Fetch details from Google Books API
        book_details = fetch_books({
            "genres": "science fiction", 
            "favorite_books": ["Dune"], 
            "mood": "adventurous"
        })

        # Check that we correctly got the book "Dune" and its author
        self.assertGreater(len(book_details), 0, "Google Books API returned no results.")
        self.assertIn("title", book_details[0])
        self.assertEqual(book_details[0]["authors"], ["Frank Herbert"])