// page.tsx - AI Book Recommendations Frontend

"use client";

import { useState } from "react";
import { getBookRecommendations } from "../utils/api";

type Book = {
  title: string;
  authors: string[];
  thumbnail: string;
  description: string;
  // Add other fields as necessary
};

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🎯 User Preferences State
  const [genres, setGenres] = useState("");
  const [mood, setMood] = useState("");
  const [favoriteBooks, setFavoriteBooks] = useState("");
  const [length, setLength] = useState("");
  const [releasePreference, setReleasePreference] = useState("new");

  async function fetchBooks() {
    setLoading(true);
    setError("");

    try {
      console.log("Fetching recommendations...");

      // 🎯 Build user preferences object
      const userPreferences = {
        user_id: 2,
        genres,
        mood,
        favorite_books: favoriteBooks.split(",").map((b) => b.trim()), // Convert comma-separated to array
        length,
        release_preference: releasePreference,
      };

      const data = await getBookRecommendations(userPreferences);
      console.log("Received data:", data); // Debugging

      // ✅ Ensure `recommendations` is accessed correctly
      if (!data || !data.recommendations || !Array.isArray(data.recommendations)) {
        console.error("Invalid API response format", data);
        setError("Invalid API response format.");
        return;
      }

      // ✅ Process API Response Correctly
      const booksArray = data.recommendations.map((book: any) => ({
        title: book.title || "Unknown Title",
        authors: book.authors || ["Unknown Author"],
        description: book.description || "No description available.",
        thumbnail: book.thumbnail || ""
      }));

      console.log("Processed books:", booksArray);
      setBooks(booksArray);
    } catch (err) {
      setError("Failed to fetch book recommendations.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">📚 AI Book Recommendations</h1>

      {/* 🎯 User Input Form */}
      <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
        <label className="block mb-2 text-white">Genres:</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3 focus:ring focus:ring-blue-500"
          placeholder="e.g. Sci-Fi, Mystery"
          value={genres}
          onChange={(e) => setGenres(e.target.value)}
        />

        <label className="block mb-2 text-white">Preferred Mood:</label>
        <select
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3 focus:ring focus:ring-blue-500"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        >
          <option value="">Select Mood</option>
          <option value="relaxing">Relaxing</option>
          <option value="thrilling">Thrilling</option>
          <option value="intellectual">Intellectual</option>
        </select>

        <label className="block mb-2 text-white">Favorite Books:</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3 focus:ring focus:ring-blue-500"
          placeholder="e.g. Dune, The Hobbit"
          value={favoriteBooks}
          onChange={(e) => setFavoriteBooks(e.target.value)}
        />

        <label className="block mb-2 text-white">Preferred Book Length:</label>
        <select
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3 focus:ring focus:ring-blue-500"
          value={length}
          onChange={(e) => setLength(e.target.value)}
        >
          <option value="">Select Length</option>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>

        <label className="block mb-2 text-white">New vs Classic:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="releasePreference"
              value="new"
              checked={releasePreference === "new"}
              onChange={() => setReleasePreference("new")}
              className="mr-2"
            />
            New Releases
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="releasePreference"
              value="classic"
              checked={releasePreference === "classic"}
              onChange={() => setReleasePreference("classic")}
              className="mr-2"
            />
            Classic Books
          </label>
        </div>

        <button
          onClick={fetchBooks}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:ring focus:ring-blue-300"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Get Recommendations"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {!loading && !error && books.length > 0 && (
        <ul className="book-list bg-gray-800 p-4 rounded-lg shadow-md mt-4">
          {books.map((book, index) => (
            <li key={index} className="book-card">
              <img src={book.thumbnail} alt={book.title} className="book-thumbnail" />
              <div className="book-info">
                <h3>{book.title}</h3>
                <p><strong>by {book.authors.join(", ")}</strong></p>
                <p>{book.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="text-gray-400 mt-4">No recommendations found.</p>
      )}
    </main>
  );
}
