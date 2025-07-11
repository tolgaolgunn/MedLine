const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./data/createUserTable');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors(
    {
        origin: 'http://localhost:3005',
        credentials: true
    }
));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/MedLine')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/register.html'));
});


app.use('/api', userRoutes);

initializeDatabase().then(() => {
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
