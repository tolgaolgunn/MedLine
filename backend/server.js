    const express = require('express');
    const path = require('path');
    const cors = require('cors');
    require('dotenv').config();

    const initializeDatabase = require('./data/createUserTable');
    const userRoutes = require('./routes/userRoutes');
    const patientRoutes = require('./routes/patientRoute');
    const doctorRoutes = require('./routes/doctorRoute');
    const adminRoutes = require('./routes/adminRoute');
    const aiRoutes = require('./routes/aiRoute');
    const app = express();

    app.use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));
    app.use(express.json()); 

    app.use('/api', userRoutes);
    app.use('/api', patientRoutes);
    app.use('/api/doctor', doctorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/ai', aiRoutes);

    initializeDatabase().then(() => {
        const PORT = process.env.PORT || 3005;
        const server = app.listen(PORT, () => {
            console.log("Server is starting...");
            console.log('Server is running on port ' + PORT);
            console.log('http://localhost:' + PORT);
        });

        
        const { Server } = require('socket.io');
        const io = new Server(server, {
            cors: {
                origin: 'http://localhost:5173',
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
