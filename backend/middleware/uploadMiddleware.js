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
    params: async (req, file) => {
        let originalName = file.originalname;
        try {
            originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {
        }

        const sanitize = (name) => {
            return name.split('.')[0]
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                .replace(/ş/g, 's').replace(/Ş/g, 'S')
                .replace(/ı/g, 'i').replace(/İ/g, 'I')
                .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                .replace(/ç/g, 'c').replace(/Ç/g, 'C')
                .replace(/[^a-zA-Z0-9-_]/g, '_');
        };

        const safePublicId = sanitize(originalName) + '_' + Date.now();

        if (file.mimetype === 'application/pdf') {
            return {
                folder: 'MedLine',
                resource_type: 'raw', 
                public_id:safePublicId
            };
        }
        
        return {
            folder: 'MedLine',
            resource_type: 'image', 
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: safePublicId
        };
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