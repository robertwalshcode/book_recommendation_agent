export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
  
    if (!refreshToken) {
      throw new Error("No refresh token found.");
    }
  
    const response = await fetch("http://127.0.0.1:8000/auth/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  
    if (!response.ok) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Failed to refresh token.");
    }
  
    const data = await response.json();
    localStorage.setItem("accessToken", data.access); // 🔄 Update token
    return data.access;
  }


  export async function authFetch(url, options = {}) {
    let token = localStorage.getItem("accessToken");
  
    const makeRequest = async (accessToken) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
  
    let response = await makeRequest(token);
  
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        response = await makeRequest(newToken);
      } catch (err) {
        console.error("🔁 Failed to refresh token:", err);
        throw new Error("Unauthorized");
      }
    }
  
    return response;
  }  
  