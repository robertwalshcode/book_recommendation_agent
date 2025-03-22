from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Extends Django's User model to store user preferences."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_genres = models.TextField(help_text="Comma-separated list of genres")
    favorite_authors = models.TextField(help_text="Comma-separated list of authors")
    mood_preferences = models.TextField(help_text="Comma-separated list of moods")
    book_length_preference = models.CharField(
        max_length=10, choices=[('short', 'Short'), ('medium', 'Medium'), ('long', 'Long')], default='medium'
    )

    def __str__(self):
        return self.user.username

class Book(models.Model):
    """Stores book details fetched from Google Books API."""
    google_books_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    genre = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    page_count = models.IntegerField(blank=True, null=True)
    cover_image = models.URLField(blank=True, null=True)
    average_rating = models.FloatField(blank=True, null=True)

    def __str__(self):
        return self.title

class UserBookFeedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book_title = models.CharField(max_length=255, default="Book Title")
    feedback = models.CharField(max_length=10, choices=[("like", "Like"), ("dislike", "Dislike")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book_title')  # Prevent duplicate feedback at DB level

    def __str__(self):
        return f"{self.user.username} - {self.book_title} - {self.feedback}"