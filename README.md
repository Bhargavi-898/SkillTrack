🎓 Skill Track – Skill Sharing Web Application

Skill Track is a web platform for SVECW students to share and explore skills through videos and study resources.
Students can upload skill videos, interact with posts, receive notifications, and access shared notes.

The platform works similar to YouTube / LinkedIn Learning, but specifically designed for engineering students to share knowledge within the college community.

🌟 Features

👤 User Authentication

Student registration and login

Only SVECW email IDs (@svecw.edu.in) allowed

Secure password storage using bcrypt

Authentication using JWT tokens


🧑‍💻 Profile Management

Students can manage their profile with:

Name

Email

Branch

Year

Profile photo

Users can also:

Edit profile details

Update profile photo


🎥 Video Sharing

Students can upload and share skill videos.

Features include:

Upload videos with title and description

Categorize videos as technical or non-technical

View uploaded videos from other students

Search videos by title

Watch videos directly from dashboard

Download videos to personal device


❤️ Video Interaction

Users can interact with videos using:

👍 Like videos

👎 Dislike videos

👁 Track video views

💬 Comment on videos

Likes and comments are updated in real time using Socket.IO.


💬 Comment System

Students can comment on videos

Comments are visible to all users

New comments appear in real time

Each comment shows the user name


🔔 Notification System

Users receive notifications when:

Someone likes their video

Someone comments on their video

Features:

Notification bell icon

Real-time notification updates

Unread notification counter

Notification panel showing activity


📚 Knowledge Hub (Notes Sharing)

Students can also upload study resources and notes.

Features include:

Upload PDF or documents

Title and description for notes

View or download shared notes

Organized notes display in grid format

This feature allows students to share important study materials with others.

🛠 Tech Stack

Frontend:

HTML

CSS

JavaScript

Font Awesome icons

Backend:

Node.js

Express.js

Database:

MongoDB

Mongoose ODM

Authentication & Security:

JSON Web Token (JWT)

bcryptjs

File Upload:

Multer (for video and file uploads)

Real-Time Features:

Socket.IO

Used for:

Live notifications

Real-time like updates

Real-time comments

📂 Project Structure

SkillTrack/
│
├── frontend/
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── upload.html
│   ├── edit-profile.html
│   └── view.html
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes.js
│   ├── videoroutes.js
│   ├── user.js
│   └── video.js
│
├── uploads/
│   ├── videos
│   ├── profile photos
│   └── notes
│
└── README.md

🚀 How to Run the Project
1️⃣ Clone the repository
git clone https://github.com/Bhargavi-898/SkillTrack.git
2️⃣ Navigate to project
cd SkillTrack
3️⃣ Install backend dependencies
npm install
4️⃣ Start the server
node server.js

Server runs on:

http://localhost:3000
5️⃣ Open the frontend

Open the HTML files in your browser:

frontend/login.html
📊 Key Functionalities
Feature	Description
User Login	Secure authentication using JWT
Video Upload	Students upload skill videos
Search Videos	Find videos by title
Likes/Dislikes	Interact with videos
Views	Tracks video popularity
Comments	Discussion on videos
Notifications	Real-time updates
Notes Upload	Share study resources
Download	Save videos to personal device
🎯 Project Goal

The goal of Skill Track is to build a collaborative learning platform where students can:

Share technical knowledge

Learn new skills

Help peers through educational content

Access shared study resources

This platform encourages peer learning and knowledge sharing within the engineering community.