const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./data/createUserTable');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json()); 

app.use('/api', userRoutes);

initializeDatabase().then(() => {
    const PORT = process.env.PORT || 3005;
    app.listen(3005, () => {
        console.log('Server is running on port 3005');
        console.log('http://localhost:3005');
    });
});
