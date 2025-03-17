-- Database: ecommerce

-- Storing the data of users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Storing data of offers made by users
CREATE TABLE offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(70) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    weight DECIMAL(10,2) DEFAULT NOT NULL,
    length DECIMAL(10,2) DEFAULT NOT NULL,
    width DECIMAL(10,2) DEFAULT NOT NULL,
    height DECIMAL(10,2) DEFAULT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Storing data of offer images
CREATE TABLE offer_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_id INT NOT NULL,
    image_data MEDIUMBLOB NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

-- Storing the data of offers added to cart
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    offer_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    UNIQUE (user_id, offer_id)  -- Prevents duplicate entries of the same product for the same user
);