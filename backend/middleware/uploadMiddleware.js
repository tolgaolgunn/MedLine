const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    // Resimler (jpg, jpeg, png, webp) ve PDF dosyalarına izin ver
    const imageTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();

    const isImage = imageTypes.test(ext) && imageTypes.test(file.mimetype);
    const isPdf = ext === '.pdf' && file.mimetype === 'application/pdf';

    if (isImage || isPdf) {
        return cb(null, true);
    } else {
        cb(new Error('Hata: Sadece resim dosyaları (jpg, jpeg, png, webp) ve PDF yüklenebilir!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { upload };