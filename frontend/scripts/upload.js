document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const fileInput = document.getElementById("videoFile");

    const token = localStorage.getItem("token");
    let uploadedBy = null;

    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      uploadedBy = userData && userData._id;
    } catch (err) {
      console.error("❌ Failed to parse user data:", err);
    }

    if (!token || !uploadedBy) {
      popupMessage.textContent = "❌ Please log in to upload.";
      popup.style.display = "flex";
      return;
    }

    if (!fileInput.files.length) {
      popupMessage.textContent = "❌ Please select a video file.";
      popup.style.display = "flex";
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("uploadedBy", uploadedBy);
    formData.append("video", fileInput.files[0]);

    try {
      const res = await fetch("http://localhost:3000/api/videos/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Auth token
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        popupMessage.textContent = "✅ Video uploaded successfully!";
        uploadForm.reset();
      } else {
        popupMessage.textContent = "❌ Upload failed: " + (data.error || data.message);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      popupMessage.textContent = "❌ Network or server error.";
    }

    popup.style.display = "flex";
  });
});
