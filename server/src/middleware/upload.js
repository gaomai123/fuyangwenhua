const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '../../uploads');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createStorage(folder) {
  const destination = path.join(uploadRoot, folder);
  ensureDir(destination);

  return multer.diskStorage({
    destination,
    filename(req, file, callback) {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      callback(null, filename);
    }
  });
}

function imageFilter(req, file, callback) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    callback(new Error('Only image files are allowed'));
    return;
  }

  callback(null, true);
}

function videoFilter(req, file, callback) {
  if (!file.mimetype || !file.mimetype.startsWith('video/')) {
    callback(new Error('Only video files are allowed'));
    return;
  }

  callback(null, true);
}

function createImageUploader(folder) {
  return multer({
    storage: createStorage(folder),
    fileFilter: imageFilter,
    limits: {
      fileSize: 20 * 1024 * 1024
    }
  });
}

function createVideoUploader(folder) {
  return multer({
    storage: createStorage(folder),
    fileFilter: videoFilter,
    limits: {
      fileSize: 200 * 1024 * 1024
    }
  });
}

module.exports = {
  createImageUploader,
  createVideoUploader
};
