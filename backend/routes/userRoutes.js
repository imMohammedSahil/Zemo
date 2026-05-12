const express = require("express");
const router = express.Router();
const User = require("../models/user");
const mongoose = require("mongoose");

const multer = require("multer");
const path = require("path");

/* MULTER STORAGE (keeps file extensions) */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });


/* GET CURRENT USER */

router.get("/me", async (req, res) => {

  try {

    const user = await User.findOne({ googleId: "demo-user-1" });

    console.log("USER FROM DB:", user);

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    res.json(user);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Server error" });

  }

});

/* UPDATE PROFILE */

router.put("/update-profile", async (req, res) => {

  try {

    const { name, location, email } = req.body;

    const user = await User.findOneAndUpdate(
      { email: email },
      {
        name: name,
        location: location
      },
      { new: true }
    );

    res.json(user);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });

  }

});

function normalizeAmazonUrl(url) {

  const match = url.match(/\/dp\/([A-Z0-9]{10})/);

  if (match) {
    return `https://www.amazon.in/dp/${match[1]}`;
  }

  return url;

}


/* ADD TO WISHLIST */

router.post("/add-wishlist", async (req, res) => {

  try {

    let { productUrl, title, image, source } = req.body;

    /* CLEAN AMAZON URL */

    productUrl = normalizeAmazonUrl(productUrl);

    /* VALIDATE PRODUCT URL */

    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/);

if (!asinMatch) {
  return res.status(400).json({
    message: "Please paste a valid Amazon product page link"
  });
}

productUrl = `https://www.amazon.in/dp/${asinMatch[1]}`;


productUrl = normalizeAmazonUrl(productUrl);

    const user = await User.findOne();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* prevent duplicates */

    const exists = user.wishlist.find(
      item => item.productUrl === productUrl
    );

    if (exists) {
      return res.json(exists);
    }

    /* If metadata missing → fetch it */

    if (!title || !image) {

      const user = await User.findOne({ googleId: "demo-user-1" });

      const product = await Product.findOne({ productUrl });

      if (product) {
        title = product.title;
        image = product.image;
        source = product.source;
      }

    }

    const wishlistItem = {
      _id: new mongoose.Types.ObjectId(),
      productUrl: productUrl || "",
      title: title ? title.trim() : "Unknown Product",
      image: image ? image.trim() : "",
      source: source || "unknown"
    };

    console.log("Saving wishlist item:", wishlistItem);

    user.wishlist.push(wishlistItem);

    await user.save();

    res.json(wishlistItem);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to add wishlist item" });

  }

});


/* REMOVE FROM WISHLIST */

router.delete("/wishlist/:id", async (req, res) => {

  try {

    const user = await User.findOne();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = user.wishlist.filter(
      item => String(item._id) !== String(req.params.id)
    );

    await user.save();

    res.json({ message: "Wishlist item removed" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to remove wishlist item" });

  }

});


/* UPLOAD PROFILE PICTURE */

router.post("/upload-pfp", upload.single("pfp"), async (req, res) => {

  try {

    console.log("UPLOAD REQUEST BODY:", req.body);
    console.log("UPLOAD FILE:", req.file);

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* normalize Windows paths */

    const cleanPath = req.file.path.replace(/\\/g, "/");

    user.profilePicture = cleanPath;

    await user.save();

    console.log("SAVED PFP PATH:", cleanPath);

    res.json({
      profilePicture: cleanPath
    });

  } catch (err) {

    console.error("PFP upload error:", err);

    res.status(500).json({ message: "Upload failed" });

  }

});


module.exports = router;