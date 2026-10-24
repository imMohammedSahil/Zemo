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
const Notification = require("../models/Notification");
const { sendWelcomeEmail, sendVerificationCodeEmail } = require("../services/emailService");

/* REAL-TIME EMAIL DELIVERABILITY CHECKER (AbstractAPI) */
async function verifyEmailDeliverability(email) {
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
  if (!apiKey) return { valid: true };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[AbstractAPI] HTTP ${response.status}. Falling open to not block user.`);
      return { valid: true };
    }

    const data = await response.json();

    // Verify if mailbox exists and domain accepts mail
    if (data?.email_deliverability?.status === "undeliverable") {
      let reason = "This email does not seem to exist. Please double-check your spelling.";
      if (data.email_deliverability.status_detail === "dns_record_not_found") {
        reason = "Domain not found. Please check for typos (e.g. @gmail.com).";
      } else if (data.email_deliverability.status_detail === "invalid_mailbox") {
        reason = "This mailbox does not exist. Please check your username.";
      }
      return {
        valid: false,
        reason,
        suggestion: data.suggested_correction
      };
    }

    return {
      valid: true,
      senderName: data?.email_sender?.first_name
        ? `${data.email_sender.first_name} ${data.email_sender.last_name || ''}`.trim()
        : null
    };
  } catch (err) {
    console.warn("[AbstractAPI] Verification skipped (timeout/network):", err.message);
    // Fail-open: Never block user on network glitch
    return { valid: true };
  }
}

const Otp = require("../models/Otp");

/* SEND OTP TO GMAIL */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid Gmail address." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify email deliverability
    const verification = await verifyEmailDeliverability(cleanEmail);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.reason });
    }

    // Rate limiting: allow at most 1 OTP request every 15 seconds
    const recentOtp = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (recentOtp && Date.now() - new Date(recentOtp.createdAt).getTime() < 15 * 1000) {
      const waitSec = Math.ceil((15 * 1000 - (Date.now() - new Date(recentOtp.createdAt).getTime())) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec}s before requesting a new code.` });
    }

    // Generate 6-digit numeric OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await Otp.create({
      email: cleanEmail,
      code,
      senderName: verification.senderName
    });

    console.log(`[OTP] Generated verification code ${code} for ${cleanEmail}`);

    // Dispatch verification code email
    const dispatchResult = await sendVerificationCodeEmail({ to: cleanEmail, code });
    if (dispatchResult && dispatchResult.error) {
      console.warn("[OTP] Email dispatch warning:", dispatchResult.error);
    }

    res.json({
      success: true,
      email: cleanEmail,
      message: `Verification code sent to ${cleanEmail}`
    });
  } catch (error) {
    console.error("Error in /send-otp:", error);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

/* VERIFY OTP */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/\s+/g, "");

    console.log(`[Verify OTP] Checking code: "${cleanCode}" for "${cleanEmail}"`);

    // Look for matching active OTP for this email
    const match = await Otp.findOne({ email: cleanEmail, code: cleanCode });
    if (!match) {
      // Check if any active OTP exists for this email
      const anyOtp = await Otp.find({ email: cleanEmail }).sort({ createdAt: -1 });
      if (anyOtp.length === 0) {
        return res.status(400).json({ error: "No active verification code found or it has expired. Please request a new code." });
      }
      return res.status(400).json({ error: "Incorrect verification code. Please check your Gmail." });
    }

    const senderName = match.senderName;

    // Code verified successfully! Delete all OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Find or create User
    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = new User({
        googleId: "guest-" + Date.now(),
        name: senderName || cleanEmail.split("@")[0],
        username: cleanEmail.split("@")[0],
        email: cleanEmail
      });
      await user.save();
    }

    // Dispatch welcome notification strictly ONCE for brand new users
    if (isNewUser && !user.hasReceivedWelcomeEmail) {
      user.hasReceivedWelcomeEmail = true;
      await user.save();

      await Notification.create({
        email: cleanEmail,
        title: "Connected with Care",
        message: `Your inbox (${cleanEmail}) is now tuned in for gentle price drop alerts — sent a warm welcome note to your Gmail.`,
        sentAt: new Date()
      });

      sendWelcomeEmail({ to: cleanEmail })
        .catch(err => console.warn("[EmailService] Welcome email error:", err.message));
    }

    res.json({
      success: true,
      verified: true,
      email: cleanEmail,
      isNewUser,
      message: "Gmail successfully verified"
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/* ENTER EMAIL & DISPATCH NOTIFICATION */
router.post("/enter-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists or create new user
    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;
    if (!user) {
      // Verify email actually exists before creating user or dispatching email
      const verification = await verifyEmailDeliverability(cleanEmail);
      if (!verification.valid) {
        return res.status(400).json({ error: verification.reason });
      }

      isNewUser = true;
      user = new User({
        googleId: "guest-" + Date.now(),
        name: verification.senderName || cleanEmail.split("@")[0],
        username: cleanEmail.split("@")[0],
        email: cleanEmail
      });
      await user.save();
    }

    // Dispatch welcome notification email strictly ONCE for brand new users
    if (isNewUser) {
      user.hasReceivedWelcomeEmail = true;
      await user.save();

      // Record in-app notification for the Wish Bell
      await Notification.create({
        email: cleanEmail,
        title: "Connected with Care",
        message: `Your inbox (${cleanEmail}) is now tuned in for gentle price drop alerts — sent a warm welcome note to your Gmail.`,
        sentAt: new Date()
      });

      sendWelcomeEmail({ to: cleanEmail })
        .catch(err => console.warn("[EmailService] Welcome email error:", err.message));
    }

    res.json({
      success: true,
      email: cleanEmail,
      isNewUser,
      welcomeSent: isNewUser,
      message: isNewUser ? `Welcome notification dispatched to ${cleanEmail}` : "Welcome back"
    });
  } catch (error) {
    console.error("Error in /enter-email:", error);
    res.status(500).json({ error: "Failed to register email" });
  }
});

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