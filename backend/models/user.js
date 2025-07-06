const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // ✅ You forgot this

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@svecw\.edu\.in$/,
  },
  password: { type: String, required: true, minlength: 3 },
  profilePhoto: { type: String, default: "uploads/default-avatar.png" }
}, { timestamps: true });

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Method to compare plain password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
