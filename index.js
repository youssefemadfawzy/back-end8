const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");

// ========== Firebase Init ==========
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-firebase-bucket.appspot.com", // عدل اسم البكت بتاعك
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ========== Express Init ==========
const app = express();
app.use(bodyParser.json());

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ========== Routes ==========

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ Backend is running on Railway & Local");
});

// Upload video route
app.post("/uploadVideo", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Upload to Firebase Storage
    const filePath = path.join(__dirname, req.file.path);
    const storageFile = bucket.file(req.file.filename);

    await bucket.upload(filePath, {
      destination: req.file.filename,
      metadata: { contentType: req.file.mimetype },
    });

    // Get download URL
    const [url] = await storageFile.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    // Save video info to Firestore
    await db.collection("videos").add({
      name: req.file.originalname,
      url: url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      message: "✅ File uploaded successfully",
      url: url,
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).send("Error uploading file.");
  }
});

// ========== Server ==========
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  if (process.env.PORT) {
    console.log(`🌐 Server running on Railway: https://back-end8-production.up.railway.app`);
  } else {
    console.log(`🌐 Server running locally: http://localhost:${PORT}`);
  }
});
