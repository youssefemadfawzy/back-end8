const express = require("express");
const multer = require("multer");
const firebaseAdmin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Firebase Service Account
const serviceAccount = require("./serviceAccountKey.json");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  storageBucket: "your-bucket-name.appspot.com" // ✨ غيرها باسم الباكت بتاعك من Firebase
});

const bucket = firebaseAdmin.storage().bucket();
const app = express();

// Multer لتخزين الفيديو مؤقتًا
const upload = multer({ dest: "uploads/" });

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running on Railway!");
});

// رفع الفيديو
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("❌ مفيش فيديو مرفوع");
    }

    const filePath = path.join(__dirname, req.file.path);
    const destination = `videos/${Date.now()}_${req.file.originalname}`;

    await bucket.upload(filePath, {
      destination,
      metadata: { contentType: req.file.mimetype },
    });

    fs.unlinkSync(filePath); // حذف الملف من السيرفر بعد الرفع

    res.status(200).send(`✅ الفيديو اترفع: ${destination}`);
  } catch (err) {
    console.error("Error uploading video:", err);
    res.status(500).send("❌ حصل خطأ أثناء الرفع");
  }
});

// 📌 لازم Railway يختار البورت من process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
