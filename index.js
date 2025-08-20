const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Firebase
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { grade, subject, teacher, center } = req.body;
    if (!req.file || !grade || !subject || !teacher || !center) {
      return res.status(400).json({ error: "Missing fields or video" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const videoData = {
      grade,
      subject,
      teacher,
      center,
      videoUrl: fileUrl,
      uploadedAt: new Date(),
    };

    await db.collection("videos").add(videoData);
    res.json({ success: true, data: videoData });
  } catch (err) {
    console.error("Error uploading:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Video Upload Server is running on Railway!");
});

// تشغيل HTTP فقط
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
