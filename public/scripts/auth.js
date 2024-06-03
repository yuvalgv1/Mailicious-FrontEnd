// Function to check if the user is logged in
function checkAuth() {
  // Get the token from localStorage (or cookies)
  const token = localStorage.getItem("accessToken");
  const currentPath = window.location.pathname;

  // Check if the token exists and is valid
  if (
    (!token || !isValidToken(token)) &&
    currentPath != "/" &&
    !currentPath.endsWith("login.html") &&
    !currentPath.endsWith("index.html")
  ) {
    // If no token or invalid token, redirect to login page
    window.location.href = "login.html";
  }
  // If the user has a valid token and is trying to access the login page or the root, redirect to home
  else if (token && isValidToken(token)) {
    if (
      currentPath === "/" ||
      currentPath.endsWith("login.html") ||
      currentPath.endsWith("index.html")
    ) {
      window.location.href = "home.html";
    }
  }
}

// Function to simulate token validation
function isValidToken(token) {
  // For simplicity, let's assume the token is valid if it exists
  // In a real application, you would verify the token (e.g., decode it, check expiry)

  // Change for API check
  return token === "valid-token";
}

// Run the auth check on page load
checkAuth();
