const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const User = require("../models/user");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authLimiter);

router.post("/google-login", async (req, res) => {

  const { googleId, name, email, profilePicture } = req.body;
  if (!googleId || typeof googleId !== "string") {
    return res.status(400).json({ error: "Invalid googleId" });
  }

  let user = await User.findOne({ googleId: String(googleId) });

  if (!user) {

    user = new User({
      googleId,
      name,
      email,
      profilePicture,
      username: email.split("@")[0]
    });

    await user.save();
  }

  res.json(user);
});

module.exports = router;