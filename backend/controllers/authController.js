const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, branch, year, password } = req.body;

    if (!name || !email || !branch || !year || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      branch,
      year,
      password: hashedPassword,
      profilePhoto: "uploads/default-avatar.png", // optional or from req.file if using multer
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        branch: newUser.branch,
        year: newUser.year,
        profilePhoto: newUser.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed", message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const userData = user.toObject();
    delete userData.password;

    res.json({ message: "Login successful", token, user: userData });
  } catch (error) {
    res.status(500).json({ error: "Login failed", message: error.message });
  }
};
