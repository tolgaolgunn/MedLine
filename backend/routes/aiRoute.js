const express = require('express');
const { chatWithAI, analyzeImage } = require('../controllers/aiController.js');
const { upload } = require('../middleware/uploadMiddleware.js');

const router = express.Router();

router.post('/chat', chatWithAI);
router.post('/analyze', upload.single('image'), analyzeImage);

module.exports = router;