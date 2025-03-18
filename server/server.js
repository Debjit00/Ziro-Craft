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
    host: 'sql12.freesqldatabase.com',
    user: 'sql12768257',
    password: 'eYutR4Kd36',
    database: 'sql12768257'
});

console.log('Connected to database');

app.use(cors());
app.use(express.static(join(__dirname, '..')));
app.use(express.static(join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage requests
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '..', 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.redirect('/');
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
            userName: user.name,
            email: email
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


// Products page request
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
    res.sendFile(join(__dirname, '..', 'public/pages/item.html'));
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

        // Get images for this offer - similar to how it's done in /api/products
        const [images] = await db.query(
            'SELECT id FROM offer_images WHERE offer_id = ?',
            [offer.id]
        );
        offer.image_ids = images.map(img => img.id);
        offer.image_url = images.length > 0 ? `/api/image/${images[0].id}` : 'https://example.com/images/placeholder.jpg';

        return res.json({
            offer,
            image_url: offer.image_url,
            imageIds: offer.image_ids
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


// Signup page requests
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


// Attributes page request
app.post('/api/offers', upload.array('photos', 12), async (req, res) => {
    try {
        const { title, description, price, category, email, weight, length, width, height } = req.body;
        
        // Validate required fields
        if (!title || !description || !price || !category || !email || !weight || !length || !width || !height) {
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
            'INSERT INTO offers (user_id, title, description, price, category, weight, length, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, description, price, category, weight, length, width, height]
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


// Cart page requests
app.post('/api/cart/add', async (req, res) => {
    try {
        const { email, offerId, quantity } = req.body;

        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = users[0].id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        // Check if the item is already in the cart
        const [existingItem] = await db.query(
            'SELECT * FROM cart WHERE user_id = ? AND offer_id = ?',
            [userId, offerId]
        );

        if (existingItem.length > 0) {
            // Update quantity if already in cart
            await db.query(
                'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND offer_id = ?',
                [quantity, userId, offerId]
            );
        } else {
            // Add new item to cart
            await db.query(
                'INSERT INTO cart (user_id, offer_id, quantity) VALUES (?, ?, ?)',
                [userId, offerId, quantity]
            );
        }
        
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.post('/api/cart', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = users[0].id;
        
        // Get cart items with offer details
        const [cartItems] = await db.query(`
            SELECT c.id, c.quantity, o.id as offer_id, o.title, o.description, o.price, o.category,
                   (SELECT CONCAT('/api/image/', i.id) FROM offer_images i WHERE i.offer_id = o.id LIMIT 1) as image_url,
                   u.name as seller_name
            FROM cart c
            JOIN offers o ON c.offer_id = o.id
            JOIN users u ON o.user_id = u.id
            WHERE c.user_id = ?
        `, [userId]);
        
        res.json({ success: true, cartItems });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.put('/api/cart/update', async (req, res) => {
    try {
        const { offerId, quantity } = req.body;
        const userId = req.session?.userId; // Adjust based on your authentication system
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        await db.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND offer_id = ?',
            [quantity, userId, offerId]
        );
        
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.post('/api/cart/remove/:offerId', async (req, res) => {
    const { email }= req.body;
    try {
        const offerId  = req.params.offerId;
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = users[0].id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        await db.query(
            'DELETE FROM cart WHERE user_id = ? AND offer_id = ?',
            [userId, offerId]
        );
        
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Connection to localhost
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

async function keepDatabaseRunning() {
    setTimeout(async function() {
        try {
            const query = await db.query('SHOW TABLES');
        } catch (error) {
            console.log("Restarted connection to database");
            const db = await mysql.createConnection({
                host: 'sql12.freesqldatabase.com',
                user: 'sql12768257',
                password: 'eYutR4Kd36',
                database: 'sql12768257'
            });
        }
        keepDatabaseRunning();
    }, 1/6 * 60 * 1000);
}
keepDatabaseRunning();
