const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin'); // Firebase Admin SDK

// ✅ استدعاء ملف الـ service account
const serviceAccount = require('./serviceAccountKey.json');

// ✅ تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "el-patool-c5476.appspot.com" // ← غيّرها بالـ Project ID بتاعك
});

// Firestore Database
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// 📂 Multer config لتخزين الفيديوهات في VPS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'videos/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ Test route
app.get('/', (req, res) => {
  res.send('🔥 Firebase + VPS Video server is running ✅');
});

// 🔑 Middleware للتحقق من توكن Firebase Auth
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
}

// 🎥 رفع فيديو مع حفظ بياناته في Firestore
app.post('/uploadVideo', verifyToken, upload.single('video'), async (req, res) => {
  try {
    const filePath = `/videos/${req.file.filename}`;
    const fullURL = `${req.protocol}://${req.get('host')}${filePath}`;

    // 📝 حفظ بيانات الفيديو في Firestore
    await db.collection('videos').add({
      userId: req.user.uid,
      fileName: req.file.filename,
      url: fullURL,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send({ success: true, url: fullURL });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// 🎥 عرض كل الفيديوهات من Firestore
app.get('/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('videos').orderBy('uploadedAt', 'desc').get();
    const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.send(videos);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 🎥 جعل الفيديوهات متاحة من VPS
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// 🚀 Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
