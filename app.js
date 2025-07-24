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

// Database setup with error handling
const db = new sqlite3.Database('./inventory.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode = WAL');

// Set busy timeout for concurrent access
db.run('PRAGMA busy_timeout = 3000');

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
    )`, (err) => {
        if (err) {
            console.error('Error creating products table:', err.message);
        } else {
            console.log('Products table ready');
        }
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        type TEXT NOT NULL CHECK (type IN ('in', 'out')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Error creating transactions table:', err.message);
        } else {
            console.log('Transactions table ready');
        }
    });
});

// Helper function for database transactions
function runTransaction(operations, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', function(beginErr) {
            if (beginErr) {
                return callback(beginErr);
            }
            
            let completed = 0;
            let hasError = false;
            
            const checkComplete = (err) => {
                if (hasError) return;
                
                if (err) {
                    hasError = true;
                    db.run('ROLLBACK', () => {
                        callback(err);
                    });
                    return;
                }
                
                completed++;
                if (completed === operations.length) {
                    db.run('COMMIT', (commitErr) => {
                        callback(commitErr);
                    });
                }
            };
            
            operations.forEach((operation, index) => {
                operation((err) => checkComplete(err));
            });
        });
    });
}

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

// Delete product - Fixed: Proper transaction handling without nesting
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Check if product exists first
    db.get('SELECT id FROM products WHERE id = ?', [id], function(err, row) {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Use database transaction to ensure data consistency
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', function(beginErr) {
                if (beginErr) {
                    return res.status(500).json({ error: 'Failed to start transaction: ' + beginErr.message });
                }
                
                // First delete related transactions
                db.run('DELETE FROM transactions WHERE product_id = ?', [id], function(deleteTransErr) {
                    if (deleteTransErr) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to delete related transactions: ' + deleteTransErr.message });
                    }
                    
                    // Then delete the product
                    db.run('DELETE FROM products WHERE id = ?', [id], function(deleteProductErr) {
                        if (deleteProductErr) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to delete product: ' + deleteProductErr.message });
                        }
                        
                        // Commit the transaction
                        db.run('COMMIT', function(commitErr) {
                            if (commitErr) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Failed to commit transaction: ' + commitErr.message });
                            }
                            
                            res.json({ message: 'Product and related transactions deleted successfully' });
                        });
                    });
                });
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
        db.run('BEGIN TRANSACTION', function(beginErr) {
            if (beginErr) {
                return res.status(500).json({ error: 'Failed to start transaction: ' + beginErr.message });
            }
            
            // First check if product exists and get current quantity
            db.get('SELECT quantity FROM products WHERE id = ?', [parsedProductId], function(err, row) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }
                
                if (!row) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Product not found' });
                }
                
                const currentQuantity = row.quantity;
                const multiplier = type === 'in' ? 1 : -1;
                const newQuantity = currentQuantity + (parsedQuantity * multiplier);
                
                // Prevent negative stock for 'out' transactions
                if (type === 'out' && newQuantity < 0) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ 
                        error: `Insufficient stock. Current quantity: ${currentQuantity}, requested: ${parsedQuantity}` 
                    });
                }
                
                // Insert transaction record
                const transactionQuery = `INSERT INTO transactions (product_id, type, quantity, reason) 
                                         VALUES (?, ?, ?, ?)`;
                
                db.run(transactionQuery, [parsedProductId, type, parsedQuantity, reason || ''], function(insertErr) {
                    if (insertErr) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to record transaction: ' + insertErr.message });
                    }
                    
                    const transactionId = this.lastID;
                    
                    // Update product quantity
                    const updateQuery = `UPDATE products SET quantity = ? WHERE id = ?`;
                    
                    db.run(updateQuery, [newQuantity, parsedProductId], function(updateErr) {
                        if (updateErr) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to update product quantity: ' + updateErr.message });
                        }
                        
                        // Commit the transaction
                        db.run('COMMIT', function(commitErr) {
                            if (commitErr) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Failed to commit transaction: ' + commitErr.message });
                            }
                            
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
    });
});

// Get transaction history - Fixed: Added pagination support
app.get('/api/transactions', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100' });
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM transactions`;
    
    db.get(countQuery, [], (countErr, countResult) => {
        if (countErr) {
            return res.status(500).json({ error: countErr.message });
        }
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        // Get paginated results
        const query = `SELECT t.*, p.name as product_name 
                       FROM transactions t 
                       JOIN products p ON t.product_id = p.id 
                       ORDER BY t.created_at DESC
                       LIMIT ? OFFSET ?`;
        
        db.all(query, [limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                transactions: rows,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        });
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

// Improved graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    
    // Close database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            process.exit(1);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            process.exit(1);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    db.close(() => {
        process.exit(1);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    db.close(() => {
        process.exit(1);
    });
});