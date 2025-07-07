// Preview profile photo
document.getElementById("profilePhoto").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("previewImage").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Form submission
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch("http://localhost:3000/api/users/register", {

            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById("successPopup").classList.add("show");
            e.target.reset();
            document.getElementById("previewImage").src = "images/default-avatar.png";
        } else {
            alert(result.message || "Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error in registration. Please try again.");
    }
});

function closePopup() {
    document.getElementById("successPopup").classList.remove("show");
}
