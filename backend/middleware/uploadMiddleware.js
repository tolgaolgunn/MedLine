const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'MedLine',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        resource_type: 'auto',
    },
});

const fileFilter = (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();

    const isImage = imageTypes.test(ext) || imageTypes.test(file.mimetype);
    const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';

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
})  ;

module.exports = { upload };