const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// routes
app.get("/", (req, res) => {
  res.json({ message: "Server is running ✅" });
});

// upload video route
app.post("/uploadVideo", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "Video uploaded successfully ✅",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
  });
});

// serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
