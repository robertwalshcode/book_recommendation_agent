# AI Unit Test

import os
import openai
from django.test import TestCase
from recommendations.services.ai_recommender import get_ai_book_recommendations
from unittest.mock import patch

class AIRecommendationTests(TestCase):
    @patch("recommendations.services.ai_recommender.openai.ChatCompletion.create")
    def test_ai_recommendations(self, mock_openai):
        """Test GPT-3.5 returns book recommendations for a given genre."""
        # Mock OpenAI response
        mock_openai.return_value = {
            "choices": [{"message": {"content": "1. Dune by Frank Herbert\n2. Neuromancer by William Gibson"}}]
        }

        # Run the AI book recommendation function
        response = get_ai_book_recommendations({
            "genres": "science fiction",
            "favorite_books": ["Dune", "Neuromancer"],
            "mood": "adventurous"
        })

        # Expected books
        expected_books = ["Dune by Frank Herbert", "Neuromancer by William Gibson"]
        
        # Assert the response contains expected books
        self.assertEqual(response, expected_books)