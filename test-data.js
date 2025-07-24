// Test data script to populate the inventory with sample products
// Run this after starting the server to add demo data

const API_BASE = 'http://localhost:3000/api';

const sampleProducts = [
    {
        name: 'Laptop Computer',
        description: 'High-performance business laptop',
        quantity: 15,
        price: 899.99,
        category: 'Electronics'
    },
    {
        name: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        quantity: 8,
        price: 199.99,
        category: 'Furniture'
    },
    {
        name: 'Wireless Mouse',
        description: 'Bluetooth wireless mouse',
        quantity: 3, // Low stock item
        price: 29.99,
        category: 'Electronics'
    },
    {
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness',
        quantity: 12,
        price: 45.99,
        category: 'Office Supplies'
    },
    {
        name: 'Notebook',
        description: 'A4 lined notebook',
        quantity: 2, // Low stock item
        price: 4.99,
        category: 'Stationery'
    },
    {
        name: 'Monitor',
        description: '24-inch Full HD monitor',
        quantity: 6,
        price: 199.99,
        category: 'Electronics'
    },
    {
        name: 'Keyboard',
        description: 'Mechanical keyboard with backlight',
        quantity: 10,
        price: 79.99,
        category: 'Electronics'
    },
    {
        name: 'Printer Paper',
        description: 'A4 white printer paper (500 sheets)',
        quantity: 25,
        price: 8.99,
        category: 'Office Supplies'
    }
];

async function addSampleData() {
    console.log('Adding sample data...');
    
    for (const product of sampleProducts) {
        try {
            const response = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Added: ${product.name} (ID: ${result.id})`);
            } else {
                const error = await response.json();
                console.error(`❌ Failed to add ${product.name}:`, error.error);
            }
        } catch (error) {
            console.error(`❌ Network error adding ${product.name}:`, error.message);
        }
    }
    
    console.log('Sample data addition complete!');
}

// Function to add sample transactions
async function addSampleTransactions() {
    console.log('Adding sample transactions...');
    
    const sampleTransactions = [
        { product_id: 1, type: 'out', quantity: 2, reason: 'Laptop assignment to new employee' },
        { product_id: 3, type: 'out', quantity: 1, reason: 'Mouse replacement' },
        { product_id: 4, type: 'in', quantity: 5, reason: 'Restocking desk lamps' },
        { product_id: 6, type: 'out', quantity: 3, reason: 'Monitor setup for conference room' },
        { product_id: 8, type: 'out', quantity: 10, reason: 'Office supplies distribution' }
    ];
    
    for (const transaction of sampleTransactions) {
        try {
            const response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Added transaction: Product ${transaction.product_id}, ${transaction.type}, ${transaction.quantity} units`);
            } else {
                const error = await response.json();
                console.error(`❌ Failed to add transaction:`, error.error);
            }
        } catch (error) {
            console.error(`❌ Network error adding transaction:`, error.message);
        }
    }
    
    console.log('Sample transactions addition complete!');
}

// If running in Node.js environment
if (typeof require !== 'undefined') {
    const fetch = require('node-fetch');
    
    // Wait a moment for server to start, then add data
    setTimeout(async () => {
        await addSampleData();
        await addSampleTransactions();
    }, 2000);
}

// If running in browser environment
if (typeof window !== 'undefined') {
    window.addSampleData = addSampleData;
    window.addSampleTransactions = addSampleTransactions;
    
    console.log('Demo data functions available:');
    console.log('- addSampleData() - Add sample products');
    console.log('- addSampleTransactions() - Add sample transactions');
}