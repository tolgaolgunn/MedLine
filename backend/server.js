const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./data/createUserTable');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoute');
const doctorRoutes = require('./routes/doctorRoute');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json()); 

app.use('/api', userRoutes);
app.use('/api', patientRoutes);
app.use('/api/doctor', doctorRoutes);

initializeDatabase().then(() => {
    const PORT = process.env.PORT || 3005;
    const server = app.listen(PORT, () => {
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
            io.to(to).emit('signal', { from: socket.id, data });
        });

        // For direct messaging: join a room by userId
        socket.on('join', (userId) => {
            socket.join(userId);
            socket.userId = userId;
            console.log('Socket', socket.id, 'joined room', userId);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });

    // Export io if needed in other modules
    module.exports.io = io;
});
