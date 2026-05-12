const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/google-login", async (req, res) => {

  const { googleId, name, email, profilePicture } = req.body;

  let user = await User.findOne({ googleId });

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