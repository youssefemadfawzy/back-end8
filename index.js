const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ إنشاء فولدر uploads لو مش موجود
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Route رفع الفيديو
app.post("/uploadVideo", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `https://back-end8-production.up.railway.app/uploads/${req.file.filename}`;
  res.json({ message: "Video uploaded successfully", url: fileUrl });
});

// ✅ السيرفر يخلي الفيديوهات متاحة للعرض
app.use("/uploads", express.static("uploads"));

// ✅ Route افتراضي للتجربة
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
