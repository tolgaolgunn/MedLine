const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || (req.cookies && req.cookies.token) || req.headers["Authorization"];
  if(!authHeader){
    return res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası: Token bulunamadı'
    });
  }


  
  console.log('Auth Header:', authHeader);
  const token=authHeader.startsWith("Bearer ")?authHeader.split(" ")[1]:authHeader;
  console.log('Extracted Token:', token);

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Yetkilendirme hatası: Token bulunamadı' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ 
      success: false,
      message: 'Yetkilendirme hatası: Geçersiz token'
    });
  }
};

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