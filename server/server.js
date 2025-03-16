import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import cors from 'cors';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const upload = multer({
    storage: multer.memoryStorage(),
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
    res.redirect('/');
    // res.sendFile(join(__dirname, '..', 'index.html'));
});

app.get('/api/products', async (req, res) => {
    try {
        const [offers] = await db.query(`
            SELECT o.*, u.name as seller_name 
            FROM offers o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        for (let offer of offers) {
            const [images] = await db.query(
                'SELECT id FROM offer_images WHERE offer_id = ?',
                [offer.id]
            );
            offer.image_ids = images.map(img => img.id);
            offer.image_url = images.length > 0 ? `/api/image/${images[0].id}` : 'https://example.com/images/placeholder.jpg';
        }
        
        res.json({ offers });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/item/:itemId', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public/item.html'));
});

app.get('/api/image/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;
        const [images] = await db.query(
            'SELECT image_data, image_type FROM offer_images WHERE id = ?',
            [imageId]
        );
        
        if (images.length === 0) {
            return res.status(404).send('Image not found');
        }
        
        const image = images[0];
        res.setHeader('Content-Type', image.image_type);
        res.send(image.image_data);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Server error');
    }
});

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

app.get('/api/product/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const [offerRows] = await db.execute(
            'SELECT o.*, u.name as seller_name FROM offers o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
            [itemId]
        );
        
        if (offerRows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const offer = offerRows[0];
        
        // Get images for this offer
        const [imageRows] = await db.execute(
            'SELECT id FROM offer_images WHERE offer_id = ?',
            [itemId]
        );
        
        const imageIds = imageRows.map(row => row.id);
        
        return res.json({
            offer,
            imageIds
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/offers', upload.array('photos', 12), async (req, res) => {
    try {
        const { title, description, price, category, email } = req.body;
        
        // Validate required fields
        if (!title || !description || !price || !category || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Get user ID from email
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = users[0].id;
        
        // Insert offer into the database
        const [result] = await db.query(
            'INSERT INTO offers (user_id, title, description, price, category) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, price, category]
        );
        
        const offerId = result.insertId;
        
        // Process uploaded images
        if (req.files && req.files.length > 0) {
            const imageInsertPromises = req.files.map(async file => {
                // Insert image data into database
                await db.query(
                    'INSERT INTO offer_images (offer_id, image_data, image_type, image_name) VALUES (?, ?, ?, ?)',
                    [offerId, file.buffer, file.mimetype, file.originalname]
                );
            });
            
            await Promise.all(imageInsertPromises);
        }
        
        res.status(201).json({ message: 'Offer created successfully', offerId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});