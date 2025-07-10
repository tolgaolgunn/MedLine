const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

app.use(cors());
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

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/script.js'));
});

app.get('/register.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/MedLine/register.js'));
});

const users = [];

const initializeDefaultUser = async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    users.push({
        id: 1,
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin',
        surname: 'User'
    });
};

initializeDefaultUser();

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Password mismatch for user:', user.id);
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const { password: _, ...userData } = user;
        res.json({
            success: true,
            user: userData
        });
        console.log('Login successful for user:', user.id);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, surname, email, password } = req.body;

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: users.length + 1,
            name,
            surname,
            email,
            password: hashedPassword
        };

        users.push(newUser);

        const { password: _, ...userData } = newUser;
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
        }
    });

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
