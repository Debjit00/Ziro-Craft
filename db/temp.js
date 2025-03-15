import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Configure multer for file uploads
const uploadsDir = join(__dirname, '..', 'public', 'uploads');

// Ensure uploads directory exists
try {
    await fs.access(uploadsDir);
} catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `${uniqueSuffix}.${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Database connection
const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'whotfru?',
    database: 'ecommerce'
});

console.log('Connected to database');

// Middleware
app.use(cors());
app.use(express.static(join(__dirname, '..')));
app.use(express.static(join(__dirname, '..', 'public')));
app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route to serve index.html
app.get('/index.html', (req, res) => {
    res.sendFile(join(__dirname, '..', 'index.html'));
});

// Fetch products
app.get('/api/products', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM products');
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR name = ?', [email, name]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword]);
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not registered. Please sign up first.' });
        }
        
        // Compare passwords
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Return user name along with success message
        res.status(200).json({
            message: 'Login successful',
            userName: user.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    try {
        // In a more complete implementation with sessions, you would destroy the session here
        
        // Send success response
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
app.get('/api/user', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});