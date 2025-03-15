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
// app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '..', 'index.html'));
});

app.get('/index', (req, res) => {
    // Some lines of code
});

app.get('/api/products', async (req, res) => {
    // Some lines of code
});

app.post('/api/offers', upload.array('photos', 12), async (req, res) => {
    // Some lines of code
});

app.get('/api/image/:imageId', async (req, res) => {
    // Some lines of code
});

app.post('/api/signup', async (req, res) => {
    // Some lines of code
});

app.post('/api/login', async (req, res) => {
    // Some lines of code
});

app.post('/api/logout', (req, res) => {
    // Some lines of code
});

app.get('/api/user', async (req, res) => {
    // Some lines of code
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});