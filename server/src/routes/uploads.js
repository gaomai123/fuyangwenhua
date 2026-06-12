const express = require('express');
const { createImageUploader, createVideoUploader } = require('../middleware/upload');

const router = express.Router();

const avatarUpload = createImageUploader('avatars');
const caseCoverUpload = createImageUploader('case-covers');
const photoUpload = createImageUploader('photos');
const videoUpload = createVideoUploader('videos');

function buildFileUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}

router.post('/avatar', avatarUpload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      url: buildFileUrl('avatars', req.file.filename)
    }
  });
});

router.post('/case-cover', caseCoverUpload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      url: buildFileUrl('case-covers', req.file.filename)
    }
  });
});

router.post('/photos', photoUpload.array('files', 9), (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      urls: req.files.map((file) => buildFileUrl('photos', file.filename))
    }
  });
});

router.post('/video', videoUpload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      url: buildFileUrl('videos', req.file.filename)
    }
  });
});

router.use((error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: '文件太大，请重新选择符合大小限制的文件'
    });
    return;
  }

  res.status(400).json({
    success: false,
    message: error.message || 'Upload failed'
  });
});

module.exports = router;
