from django.core.management.base import BaseCommand
from recommendations.services.google_books import fetch_books
from recommendations.models import Book

class Command(BaseCommand):
    help = "Fetch books from Google Books API and store them in the database"

    def add_arguments(self, parser):
        parser.add_argument('--query', type=str, help="Search query (genre, author, or keyword)", required=True)

    def handle(self, *args, **kwargs):
        query = kwargs['query']
        self.stdout.write(f"Fetching books for query: {query}")

        books_data = fetch_books(query)  # ✅ Use service function
        if not books_data:
            self.stdout.write("No books found.")
            return

        for book_info in books_data:
            if Book.objects.filter(google_books_id=book_info["google_books_id"]).exists():
                self.stdout.write(f"Skipping duplicate: {book_info['title']}")
                continue

            Book.objects.create(**book_info)  # ✅ Save book
            self.stdout.write(f"Saved: {book_info['title']}")

        self.stdout.write("Book fetching complete.")