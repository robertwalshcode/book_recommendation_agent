const API_BASE_URL = "http://127.0.0.1:8000/recommendations";

export async function getBookRecommendations(userPreferences, token) {
    try {
        if (!token) {
            throw new Error("User not authenticated. Please log in.");
        }

        const response = await fetch("http://127.0.0.1:8000/recommendations/ai/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // 🔐 Send token with request
            },
            body: JSON.stringify(userPreferences),
          });
    
        if (!response.ok) {
            throw new Error("Failed to fetch book recommendations.");
        }
    
        const data = await response.json();
        // console.log("Received data:", data);

        return data; // 🔥 Ensure function returns the fetched data ✅
    } catch (error) {
        console.error("API Error:", error);
        throw error;
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
