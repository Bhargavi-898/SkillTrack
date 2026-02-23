document.addEventListener("DOMContentLoaded", async () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileBigPhoto = document.getElementById("profileBigPhoto");
  const videoList = document.getElementById("videoList");
  const searchBar = document.getElementById("searchBar");
  const baseUrl = "http://localhost:3000/";
const viewedVideos = new Set(); 
const isLiked = video.likes.includes(userData._id);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (!storedUser?.email) {
    alert("You are not logged in.");
    window.location.href = "login.html";
    return;
  }

  let userId = "";

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function setText(id, label, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${label}: ${value || "N/A"}`;
  }

  try {
    const response = await fetch(`${baseUrl}user/${encodeURIComponent(storedUser.email)}`);
    if (!response.ok) throw new Error("Failed to fetch user data");
    const user = await response.json();

    if (!user?._id) throw new Error("Invalid user data");

    userId = user._id;

    setText("profileName", "Name", user.name);
    setText("profileEmail", "Email", user.email);
    setText("profileBranch", "Branch", user.branch);
    setText("profileYear", "Year", user.year);

    let photoSrc = "";
    if (user.profilePhoto) {
      photoSrc = user.profilePhoto.startsWith("http")
        ? user.profilePhoto
        : baseUrl + user.profilePhoto.replace(/^\/+/, "");
    } else {
      const initials = user.name
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
        : "U";
      photoSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&rounded=true&size=64`;
    }

    // Fix: load profile photo into img inside button
    const profileImg = profileBtn?.querySelector("img");
    if (profileImg) profileImg.src = photoSrc;
    if (profileBigPhoto && "src" in profileBigPhoto) profileBigPhoto.src = photoSrc;

  } catch (err) {
    console.error("Error loading user data:", err);
    alert("Unable to load your profile info.");
  }

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });
  }

  document.addEventListener("click", (e) => {
    if (profileMenu && !profileMenu.contains(e.target) && e.target !== profileBtn) {
      profileMenu.classList.remove("show");
    }
  });

  let videos = [];
  try {
    const res = await fetch(baseUrl + "api/videos");
    if (!res.ok) throw new Error("Failed to fetch videos");
    videos = await res.json();
    console.log("Fetched videos:", videos);
    if (Array.isArray(videos) && videos.length > 0) {
      videos = shuffleArray(videos);
    }
  } catch (err) {
    console.error("Error fetching videos:", err);
    alert("Could not load videos.");
  }
function incrementView(videoId, videoElement) {
  if (viewedVideos.has(videoId)) return; // avoid double-count
  viewedVideos.add(videoId);

  fetch(`http://localhost:3000/api/videos/view/${videoId}`, {
    method: "POST",
  })
    .then(res => res.json())
    .then(data => {
      const viewSpan = videoElement.parentElement.querySelector(".view-count");
      if (viewSpan) viewSpan.textContent = data.views;
    })
    .catch(err => console.error("Error updating view count:", err));
}

  function displayVideos(list) {
    if (!videoList) return;
    videoList.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      videoList.innerHTML = "<p>No videos found.</p>";
      return;
    }

    list.forEach((video) => {
      const card = document.createElement("div");
      card.className = "video-card";

      const videoUrl = video.url?.startsWith("http") ? video.url : baseUrl + video.url?.replace(/^\/+/, "");

      const uploader = video.uploadedBy || {};
      const uploaderName = uploader.name || "Unknown";
      const category = video.category || "Uncategorized";

      let uploaderPhoto = "";
      if (uploader.profilePhoto) {
        uploaderPhoto = uploader.profilePhoto.startsWith("http")
          ? uploader.profilePhoto
          : baseUrl + uploader.profilePhoto.replace(/^\/+/, "");
      } else {
        const initials = uploaderName
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase();
        uploaderPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&rounded=true&size=32`;
      }

      card.innerHTML = `
        <h3>${video.title}</h3>
        <video width="320" height="240" controls preload="metadata">
          <source src="${videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <p>${video.description || "No description provided"}</p>
        <div class="uploader-info" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
          <img src="${uploaderPhoto}" alt="Uploader Photo" style="width: 32px; height: 32px; border-radius: 50%;" />
          <span><strong>${uploaderName}</strong></span>
          <span style="margin-left: auto; background: #eee; padding: 2px 6px; border-radius: 5px;">${category}</span>
        </div>
      `;

      videoList.appendChild(card);
    });
  }

  if (searchBar) {
    searchBar.addEventListener("input", () => {
      const query = searchBar.value.trim().toLowerCase();
      const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(query)
      );
      displayVideos(filtered);
    });
  }

  displayVideos(videos);

  // Upload/show section
  window.showUploadSection = function () {
    document.getElementById("uploadSection")?.classList.remove("hidden");
    document.getElementById("videoListSection")?.classList.add("hidden");
  };

  window.showVideoList = function () {
    document.getElementById("uploadSection")?.classList.add("hidden");
    document.getElementById("videoListSection")?.classList.remove("hidden");
    displayVideos(videos);
  };

  // Logout
  window.logout = function () {
    localStorage.clear();
    window.location.href = "login.html";
  };

  // Expose user ID for uploads
  window.getLoggedInUserId = () => userId;
});
