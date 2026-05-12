const express = require("express");
const router = express.Router();
const User = require("../models/user");


// GET profile
router.get("/:googleId", async (req, res) => {
  try {

    const user = await User.findOne({
      googleId: req.params.googleId
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(user);

  } catch (err) {

    console.error("PROFILE FETCH ERROR:", err);

    res.status(500).json({
      error: "Failed to load profile"
    });

  }
});



// UPDATE profile
router.put("/:googleId", async (req, res) => {

  try {

    const { username, location, profilePicture } = req.body;

    const user = await User.findOneAndUpdate(

      { googleId: req.params.googleId },

      {
        username,
        location,
        profilePicture
      },

      { new: true }

    );

    res.json(user);

  } catch (err) {

    console.error("PROFILE UPDATE ERROR:", err);

    res.status(500).json({
      error: "Failed to update profile"
    });

  }

});


module.exports = router;