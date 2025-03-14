// page.tsx - AI Book Recommendations Frontend

"use client";

import { useState } from "react";
import { getBookRecommendations } from "../utils/api";

type Book = {
  title: string;
  authors: string[];
  thumbnail: string;
  description: string;
};

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStates, setExpandedStates] = useState<{ [key: number]: boolean }>({});

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
        favorite_books: favoriteBooks.split(",").map((b) => b.trim()),
        length,
        release_preference: releasePreference,
      };

      const data = await getBookRecommendations(userPreferences);
      console.log("Received data:", data);

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
        thumbnail: book.thumbnail || "",
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

  const toggleExpand = (index: number) => {
    setExpandedStates((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">📚 Book Recommendation Agent</h1>

      {/* 🎯 Layout Container - Ensures Inputs Appear ABOVE Books */}
      <div className="content-container w-full max-w-5xl flex flex-col">

        {/* 🎯 User Input Form */}
        <div className="input-field bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
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

          <div className="filter-section block mb-2 text-white">
            <label>New vs Classic:</label>
            <div className="radio-group">
                <label>
                    <input
                        type="radio"
                        name="releasePreference"
                        value="new"
                        checked={releasePreference === "new"}
                        onChange={() => setReleasePreference("new")}
                    />
                    📚 Latest Releases
                </label>
                <label>
                    <input
                        type="radio"
                        name="releasePreference"
                        value="classic"
                        checked={releasePreference === "classic"}
                        onChange={() => setReleasePreference("classic")}
                    />
                    📖 Classics & Older Titles
                </label>
                <label>
                    <input
                        type="radio"
                        name="releasePreference"
                        value="any release date"
                        checked={releasePreference === "any release date"}
                        onChange={() => setReleasePreference("any release date")}
                    />
                    🌍 All Eras
                </label>
            </div>
        </div>



          <button
            onClick={fetchBooks}
            className="get-recommendations-button mt-4 bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Get Recommendations"}
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>

        {/* 🎯 Books List */}
        {!loading && !error && books.length > 0 && (
          <ul className="book-list bg-gray-800 p-4 rounded-lg shadow-md w-full mx-auto">
            {books.map((book, index) => (
              <li key={index} className="book-card flex items-start space-x-4 p-4 rounded-lg bg-gray-700">
                <img src={book.thumbnail} alt={book.title} className="book-thumbnail w-36 h-48 object-cover rounded-md" />
                
                <div className="book-info flex-1">
                  <h3 className="text-lg font-bold text-white">{book.title}</h3>
                  <p className="text-gray-400"><strong>by {book.authors.join(", ")}</strong></p>
                  
                  <p className={`book-description ${expandedStates[index] ? "expanded" : "line-clamp-3"} text-gray-300`}>
                    {book.description}
                  </p>

                  <button
                    className="show-more-btn mt-2 text-blue-400 hover:text-blue-300 underline block"
                    onClick={() => toggleExpand(index)}
                  >
                    {expandedStates[index] ? "Show Less" : "Show More"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
