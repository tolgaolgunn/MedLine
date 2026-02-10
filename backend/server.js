    const express = require('express');
    const path = require('path');
    const cors = require('cors');
    const net = require('net');
    require('dotenv').config();

    const initializeDatabase = require('./data/createUserTable');
    const userRoutes = require('./routes/userRoutes');
    const patientRoutes = require('./routes/patientRoute');
    const doctorRoutes = require('./routes/doctorRoute');
    const notificationRoutes = require('./routes/notificationRoute');
    const adminRoutes = require('./routes/adminRoute');
    const aiRoutes = require('./routes/aiRoute');
    const app = express();

    const allowedOrigins = [
    'http://localhost:5173',
    'https://med-line-dmze.vercel.app'
];
   app.use(cors({
    origin: function (origin, callback) {
        // origin boşsa (örneğin mobil uygulamalar veya postman) izin ver
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
    app.use(express.json()); 
    // Yüklenen dosyaları statik olarak servis et
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


    // Socket.io middleware to make io accessible in routes - MUST BE BEFORE ROUTES
    let io;
    app.use((req, res, next) => {
        req.io = io;
        next();
    });

    app.use('/api', userRoutes);
    app.use('/api', patientRoutes);
    app.use('/api/doctor', doctorRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/ai', aiRoutes);

    // Port kontrolü fonksiyonu
    function isPortInUse(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.once('close', () => resolve(false));
                server.close();
            });
            server.on('error', () => resolve(true));
        });
    }

    // Kullanılabilir port bulma fonksiyonu
    async function findAvailablePort(startPort = 3005, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            const port = startPort + i;
            const inUse = await isPortInUse(port);
            if (!inUse) {
                return port;
            }
        }
        return null;
    }

    initializeDatabase().then(async () => {
        let PORT = parseInt(process.env.PORT) || 3005;
        
        // Port kontrolü
        if (await isPortInUse(PORT)) {
            console.log(`>>> [UYARI] Port ${PORT} kullanımda! Alternatif port aranıyor...`);
            const availablePort = await findAvailablePort(PORT);
            if (availablePort) {
                PORT = availablePort;
                console.log(`>>> [BİLGİ] Port ${PORT} kullanılacak.`);
            } else {
                console.error('>>> [HATA] Uygun port bulunamadı!');
                process.exit(1);
            }
        }
        
        const server = app.listen(PORT, () => {
            console.log("Server is starting...");
            console.log('Server is running on port ' + PORT);
            console.log('http://localhost:' + PORT);
        });
        const cron = require('node-cron');

cron.schedule('0 9 * * *', () => {
  console.log('Günlük randevu kontrolleri yapılıyor...');
  // Buraya veritabanı işlemlerini yazabilirsin
});

// Her 10 dakikada bir çalışan test görevi
cron.schedule('*/10 * * * *', () => {
  console.log('Sistem sağlığı kontrol edildi.');
});
    
        const { Server } = require('socket.io');
        // Assign to the outer 'io' variable
       io = new Server(server, {
    cors: {
        origin: allowedOrigins, // Yukarıdaki listeye göre izin ver
        methods: ['GET', 'POST'],
        credentials: true   
    }
});

        io.on('connection', (socket) => {
            console.log('Socket connected:', socket.id);

            // Forward signaling messages (doctor <-> patient)
        socket.on('signal', ({ to, data }) => {
            console.log(`Signal from ${socket.id} to ${to} type:${data.type}`);
            io.to(String(to)).emit('signal', { from: socket.id, data }); // Ensure 'to' is string
        });

        // For direct messaging: join a room by userId
        socket.on('join', (userId) => {
            const id = String(userId); 
            socket.join(id);
            socket.userId = id;
            console.log(`Socket ${socket.id} joined room ${id}`);
        });    

            socket.on('disconnect', () => {
                console.log('Socket disconnected:', socket.id);
                const userId = socket.userId;
                if (userId) {
                    socket.leave(userId);
                    console.log('Socket', socket.id, 'left room', userId);
                }
            });
        });

        // Export io if needed in other modules
        module.exports.io = io;
    });
