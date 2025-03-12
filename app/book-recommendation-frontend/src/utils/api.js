const API_BASE_URL = "http://127.0.0.1:8000/recommendations";

export async function getBookRecommendations(userPreferences) {
    console.log("📤 Sending API Request with Data:", userPreferences);

    try {
        const response = await fetch("http://127.0.0.1:8000/recommendations/ai/", {
            method: "POST",  // ✅ MUST be POST
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                user_id: userPreferences.user_id, // ✅ Ensure correct key
                genres: userPreferences.genres,
                mood: userPreferences.mood,
                favorite_books: userPreferences.favorite_books,
                length: userPreferences.length,
                release_preference: userPreferences.release_preference
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Server responded with error:", response.status, errorData);
            throw new Error(errorData.error || "Failed to fetch recommendations");
        }

        const data = await response.json();
        console.log("✅ Received API Response:", data);
        return data;
    } catch (error) {
        console.error("🔥 Error fetching recommendations:", error);
        return { recommendations: [] };
    }
}

export async function searchBooks(query) {  // ✅ Re-adding missing function
    try {
        const response = await fetch(`${API_BASE_URL}/search/?q=${query}`);
        if (!response.ok) throw new Error("Failed to fetch books");
        return await response.json();
    } catch (error) {
        console.error("Error searching books:", error);
        return { results: [] };
    }
}
