const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./inventory.db');

// Initialize database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0.0,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        type TEXT NOT NULL, -- 'in' or 'out'
        quantity INTEGER NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);
});

// Routes

// Get all products
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products ORDER BY name';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get product by ID - Fixed: Added ID validation
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const query = 'SELECT * FROM products WHERE id = ?';
    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    });
});

// Add new product - Fixed: Added comprehensive validation
app.post('/api/products', (req, res) => {
    const { name, description, quantity, price, category } = req.body;
    
    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Product name is required and must be a valid string' });
    }
    
    if (quantity === undefined || quantity === null || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    
    if (price === undefined || price === null || isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
    }
    
    const parsedQuantity = parseInt(quantity);
    const parsedPrice = parseFloat(price);
    
    if (parsedQuantity < 0 || parsedPrice < 0) {
        return res.status(400).json({ error: 'Quantity and price cannot be negative' });
    }
    
    const query = `INSERT INTO products (name, description, quantity, price, category) 
                   VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [name.trim(), description || '', parsedQuantity, parsedPrice, category || ''], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            id: this.lastID,
            name: name.trim(),
            description: description || '',
            quantity: parsedQuantity,
            price: parsedPrice,
            category: category || ''
        });
    });
});

// Update product - Fixed: Added validation and proper ID handling
app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, quantity, price, category } = req.body;
    
    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Product name is required and must be a valid string' });
    }
    
    if (quantity === undefined || quantity === null || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    
    if (price === undefined || price === null || isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
    }
    
    const parsedQuantity = parseInt(quantity);
    const parsedPrice = parseFloat(price);
    
    if (parsedQuantity < 0 || parsedPrice < 0) {
        return res.status(400).json({ error: 'Quantity and price cannot be negative' });
    }
    
    const query = `UPDATE products 
                   SET name = ?, description = ?, quantity = ?, price = ?, category = ?
                   WHERE id = ?`;
    
    db.run(query, [name.trim(), description || '', parsedQuantity, parsedPrice, category || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.json({ 
                message: 'Product updated successfully',
                id: id,
                name: name.trim(),
                description: description || '',
                quantity: parsedQuantity,
                price: parsedPrice,
                category: category || ''
            });
        }
    });
});

// Delete product - Fixed: Added ID validation and cascade delete
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Use database transaction to ensure data consistency
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // First delete related transactions
        db.run('DELETE FROM transactions WHERE product_id = ?', [id], function(err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Failed to delete related transactions: ' + err.message });
                return;
            }
            
            // Then delete the product
            db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: 'Failed to delete product: ' + err.message });
                    return;
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    res.status(404).json({ error: 'Product not found' });
                } else {
                    db.run('COMMIT');
                    res.json({ message: 'Product and related transactions deleted successfully' });
                }
            });
        });
    });
});

// Record stock transaction - Fixed: Added validation and proper transaction handling
app.post('/api/transactions', (req, res) => {
    const { product_id, type, quantity, reason } = req.body;
    
    // Input validation
    const parsedProductId = parseInt(product_id);
    const parsedQuantity = parseInt(quantity);
    
    if (isNaN(parsedProductId) || parsedProductId <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    if (!type || (type !== 'in' && type !== 'out')) {
        return res.status(400).json({ error: 'Transaction type must be either "in" or "out"' });
    }
    
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
    }
    
    // Use database transaction to ensure data consistency
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // First check if product exists and get current quantity
        db.get('SELECT quantity FROM products WHERE id = ?', [parsedProductId], function(err, row) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Database error: ' + err.message });
                return;
            }
            
            if (!row) {
                db.run('ROLLBACK');
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            
            const currentQuantity = row.quantity;
            const multiplier = type === 'in' ? 1 : -1;
            const newQuantity = currentQuantity + (parsedQuantity * multiplier);
            
            // Prevent negative stock for 'out' transactions
            if (type === 'out' && newQuantity < 0) {
                db.run('ROLLBACK');
                res.status(400).json({ 
                    error: `Insufficient stock. Current quantity: ${currentQuantity}, requested: ${parsedQuantity}` 
                });
                return;
            }
            
            // Insert transaction record
            const transactionQuery = `INSERT INTO transactions (product_id, type, quantity, reason) 
                                     VALUES (?, ?, ?, ?)`;
            
            db.run(transactionQuery, [parsedProductId, type, parsedQuantity, reason || ''], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: 'Failed to record transaction: ' + err.message });
                    return;
                }
                
                const transactionId = this.lastID;
                
                // Update product quantity
                const updateQuery = `UPDATE products SET quantity = ? WHERE id = ?`;
                
                db.run(updateQuery, [newQuantity, parsedProductId], function(updateErr) {
                    if (updateErr) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: 'Failed to update product quantity: ' + updateErr.message });
                        return;
                    }
                    
                    db.run('COMMIT');
                    res.status(201).json({
                        id: transactionId,
                        product_id: parsedProductId,
                        type,
                        quantity: parsedQuantity,
                        reason: reason || '',
                        new_product_quantity: newQuantity
                    });
                });
            });
        });
    });
});

// Get transaction history - BUG: No pagination, could cause performance issues
app.get('/api/transactions', (req, res) => {
    const query = `SELECT t.*, p.name as product_name 
                   FROM transactions t 
                   JOIN products p ON t.product_id = p.id 
                   ORDER BY t.created_at DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Low stock alert - Fixed: Made threshold configurable with query parameter
app.get('/api/low-stock', (req, res) => {
    // Allow threshold to be configured via query parameter, default to 5
    const threshold = parseInt(req.query.threshold) || 5;
    
    // Validate threshold
    if (threshold < 0) {
        return res.status(400).json({ error: 'Threshold must be a non-negative number' });
    }
    
    const query = 'SELECT * FROM products WHERE quantity <= ? ORDER BY quantity ASC';
    
    db.all(query, [threshold], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            threshold: threshold,
            count: rows.length,
            products: rows
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Inventory tracking server running on port ${PORT}`);
});

// BUG: No graceful shutdown handling
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});