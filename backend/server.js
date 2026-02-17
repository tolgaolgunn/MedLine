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
const { appendErrors } = require('react-hook-form');
    const app = express();

    const allowedOrigins = [
    'http://localhost:5173',
    'https://med-line-dmze.vercel.app'
];

    const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
    app.use(express.json()); 
   const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));


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
            console.log(`Signal from ${socket.id} (User: ${socket.userId}) to ${to} type:${data.type}`);
            // "from" field now carries the DB ID (socket.userId) if available, otherwise fallback to socket.id or handle error
            // However, existing frontend might expect socket.id or just an ID. 
            // The constraint is: The Receiver needs to know "Who called me" efficiently.
            // For the rating system, the Patient needs the Doctor's DB ID. 
            // When Doctor calls Patient: socket.userId is Doctor's DB ID.
            io.to(String(to)).emit('signal', { from: socket.userId || socket.id, data }); 
        });

        // For direct messaging: join a room by userId
        socket.on('join', (userId) => {
            const id = String(userId); 
            socket.join(id);
            socket.userId = id;
            console.log(`Socket ${socket.id} joined room ${id}`);
        });    

        socket.on('rateDoctor',async ({ doctorId, rating }) => {
          if(rating<1 || rating>5) return;
            
          const allowed =await canRateDoctor(appointmentId,doctorId,socket.userId);
          if(!allowed) return;
           await saveDoctorRating({ doctorId, rating, appointmentId });
            io.to(String(doctorId)).emit('doctorRated', {
            appointmentId,
            rating
            });
        });

        socket.on('ratePatient', ({ patientId, rating }) => {
            console.log(`Patient ${patientId} rated with ${rating}`);
            io.to(String(patientId)).emit('patientRated', { patientId, rating });
        });
        socket.on('send-message', ({sender,roomId,message})=>{
            socket.join(String(roomId));
            io.to(String(roomId)).emit('receive-message', { sender, message,time:new Date() });
        })

            socket.on('disconnect', () => {
                console.log('Socket disconnected:', socket.id);
                const userId = socket.userId;
                if (userId) {
                    socket.leave(userId);
                    console.log('Socket', socket.id, 'left room', userId);
                }
            });
        });

        // Test Email Endpoint
        app.get('/test-email', async (req, res) => {
            const { sendResetMail } = require('./services/mailService');
            try {
                // Send to self or a hardcoded email for testing
                // Assuming process.env.MY_GMAIL is set
                if (!process.env.MY_GMAIL) {
                    throw new Error('MY_GMAIL environment variable is not set');
                }
                
                await sendResetMail(process.env.MY_GMAIL, 'Test Email from Backend', '<h1>It Works!</h1><p>This is a test email from the backend.</p>');
                res.send(`Email sent successfully to ${process.env.MY_GMAIL}`);
            } catch (error) {
                console.error('Test email error:', error);
                res.status(500).send(`Failed to send email: ${error.message}`);
            }
        });

        // Export io if needed in other modules
        module.exports.io = io;
    });
