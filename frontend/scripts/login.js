document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("emailLogin");
  const passwordInput = document.getElementById("passwordLogin");
  const errorMessage = document.getElementById("loginError");

  // ===== LOGIN =====
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorMessage.textContent = "Please enter both email and password.";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.textContent = data.message || "Login failed.";
        return;
      }

      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("userData", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("token", data.token);

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("❌ Login Error:", err);
      errorMessage.textContent = "Server error. Try again.";
    }
  });
});
