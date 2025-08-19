const jwt = require('jsonwebtoken');

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Yetkilendirme hatası: Token bulunamadı' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false,
      message: 'Yetkilendirme hatası: Geçersiz token'
    });
  }
};

// Role-based authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir'
    });
  }
};

// Doctor authorization middleware
const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Bu işlem için doktor yetkisi gereklidir'
    });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isDoctor
};