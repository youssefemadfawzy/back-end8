const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const https = require("https");
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

// إنشاء فولدر uploads لو مش موجود
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// إعداد Multer لتخزين الفيديوهات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// API لرفع الفيديو
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const { grade, subject, teacher, center } = req.body;

    if (!grade || !subject || !teacher || !center) {
      return res
        .status(400)
        .json({ error: "Please provide grade, subject, teacher, and center" });
    }

    // 📌 تحديد الرابط (http أو https حسب تشغيل السيرفر)
    const protocol = req.protocol; 
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

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
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API لتحميل الفيديوهات (لينك مباشر)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API تجريبي
app.get("/", (req, res) => {
  res.send("🚀 Video Upload Server is running!");
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 5000;

// نحاول نقرأ شهادات SSL
const sslPath = "/etc/letsencrypt/live/yourdomain.com";
try {
  if (fs.existsSync(sslPath)) {
    const privateKey = fs.readFileSync(path.join(sslPath, "privkey.pem"), "utf8");
    const certificate = fs.readFileSync(path.join(sslPath, "cert.pem"), "utf8");
    const ca = fs.readFileSync(path.join(sslPath, "chain.pem"), "utf8");

    const credentials = { key: privateKey, cert: certificate, ca: ca };

    https.createServer(credentials, app).listen(443, () => {
      console.log(`🔥 HTTPS Server running on https://yourdomain.com`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`🔥 HTTP Server running on http://localhost:${PORT}`);
    });
  }
} catch (err) {
  console.error("SSL not found, falling back to HTTP:", err.message);
  app.listen(PORT, () => {
    console.log(`🔥 HTTP Server running on http://localhost:${PORT}`);
  });
}
