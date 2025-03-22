// page.tsx - AI Book Recommendations Frontend

"use client"; // Ensure this runs only on the client side

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for app router
import { jwtDecode } from "jwt-decode"; // ✅ Import JWT decoding library
import { getBookRecommendations } from "@/utils/api";
import { refreshAccessToken, authFetch } from "../utils/token";

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
  const [feedbackState, setFeedbackState] = useState<{ [title: string]: "like" | "dislike" | null }>({});
  const router = useRouter(); // Router for navigation

  // 🎯 User Preferences State
  const [genres, setGenres] = useState("");
  const [mood, setMood] = useState("");
  const [favoriteBooks, setFavoriteBooks] = useState("");
  const [length, setLength] = useState("");
  const [releasePreference, setReleasePreference] = useState("new");

  // 🔐 Ensure user is authenticated before showing content
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login"); // Redirect to login if no token
    }
  }, [router]);

  // Tracks state of user feedback buttons
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
  
    authFetch("http://127.0.0.1:8000/recommendations/get-feedback/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      if (!res.ok) {
        return res.text().then(text => {
          throw new Error(`Failed to fetch user feedback: ${text}`);
        });
      }
      return res.json();
    })
      .then((data) => {
        const state: { [title: string]: "like" | "dislike" } = {};
        data.forEach((entry: { book_title: string; feedback: "like" | "dislike" }) => {
          state[entry.book_title] = entry.feedback;
        });
        setFeedbackState(state); // ✅ updates your existing state
      })
      .catch((err) => {
        console.error("❌ Could not load user feedback", err);
      });
  }, []);

  // 🔴 **Logout Function**
  const handleLogout = () => {
    localStorage.removeItem("accessToken"); // Remove token
    router.push("/login"); // Redirect to login page
  };

  // Function to extract user_id from JWT token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token); // Decode JWT
      return decodedToken.user_id || null; // Extract user_id
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };


  const sendFeedback = async (bookTitle: string, feedback: "like" | "dislike") => {
    let token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("No token found.");
      return;
    }

    try {
      let response = await authFetch("http://127.0.0.1:8000/recommendations/submit-feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: getUserIdFromToken(),
          book_title: bookTitle,
          feedback,
        }),
      });

      // 🔁 Try refreshing token if it's expired
      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await authFetch("http://127.0.0.1:8000/recommendations/submit-feedback/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: getUserIdFromToken(),
            book_title: bookTitle,
            feedback,
          }),
        });
      }

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("Feedback failed:", errorDetails);
        throw new Error("Failed to submit feedback.");
      }

      const result = await response.json();
      console.log(`✅ Feedback '${feedback}' sent for book: '${bookTitle}'`, result);
    } catch (error) {
      console.error("❌ Feedback Error:", error);
    }
  };


  async function fetchBooks() {
    setLoading(true);
    setError("");

    try {
      console.log("Fetching recommendations...");
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("User not authenticated. Please log in.");
        router.push("/login");
        return;
      }

      const userId = getUserIdFromToken(); // 🔥 Extract user ID from token
      if (!userId) {
        setError("Invalid user session. Please log in again.");
        router.push("/login");
        return;
      }

      // 🎯 Build user preferences object
      const userPreferences = {
        user_id: userId, 
        genres,
        mood,
        favorite_books: favoriteBooks.split(",").map((b) => b.trim()),
        length,
        release_preference: releasePreference,
      };

      // 🔥 Use the updated getBookRecommendations function
      const data = await getBookRecommendations(userPreferences, token);
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
        description: book.description?.trim() || "No description available.",
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
      {/* 🔴 Logout Button (Top Right) */}
      <div className="w-full flex justify-end px-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

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

          <label className="block mb-2 text-white">Your Mood:</label>
          <select
            className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3 focus:ring focus:ring-blue-500"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            <option value="">Select Mood</option>
            <option value="relaxed">Relaxed</option>
            <option value="thrilling">Thrilling</option>
            <option value="intellectual">Intellectual</option>
            <option value="romantic">Romantic</option>
            <option value="melancholic">Melancholic</option>
            <option value="dark">Dark</option>
            <option value="playful">Playful</option>
            <option value="curious ">Curious</option>
            <option value="happy">Happy</option>
            <option value="adventurous ">Adventurous</option>
            <option value="philosophical ">Philosophical</option>
            
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
                <img
                  src={book.thumbnail || "/placeholder.jpg"}
                  alt={book.title || "Book cover placeholder"}
                  className="book-thumbnail w-36 h-48 object-cover rounded-md"
                />

                <div className="book-info flex-1 relative">
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

                  <div className="book-feedback-buttons">
                    <button 
                      className={`like-btn border border-green-500 text-green-500 px-2 py-1 rounded text-sm transition-colors duration-200
                        ${feedbackState[book.title] === "like" ? "bg-green-500 text-white" : "hover:bg-green-500 hover:bg-opacity-20"}`}
                      onClick={() => {
                        const alreadyLiked = feedbackState[book.title] === "like";
                        setFeedbackState(prev => ({
                          ...prev,
                          [book.title]: alreadyLiked ? null : "like"
                        }));
                        if (!alreadyLiked) sendFeedback(book.title, "like");
                      }}
                    >
                      👍
                    </button>

                    <button 
                      className={`dislike-btn border border-red-500 text-red-500 px-2 py-1 rounded text-sm transition-colors duration-200
                        ${feedbackState[book.title] === "dislike" ? "bg-red-500 text-white" : "hover:bg-red-500 hover:bg-opacity-20"}`}
                      onClick={() => {
                        const alreadyDisliked = feedbackState[book.title] === "dislike";
                        setFeedbackState(prev => ({
                          ...prev,
                          [book.title]: alreadyDisliked ? null : "dislike"
                        }));
                        if (!alreadyDisliked) sendFeedback(book.title, "dislike");
                      }}
                    >
                      👎
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}