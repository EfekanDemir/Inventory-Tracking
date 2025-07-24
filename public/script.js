// Global variables
let products = [];
let transactions = [];

// BUG: No error handling for API calls
const API_BASE = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadTransactions();
    loadLowStock();
    populateProductSelect();
});

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load data for specific sections
    if (sectionId === 'products') {
        loadProducts();
    } else if (sectionId === 'transactions') {
        loadTransactions();
    } else if (sectionId === 'low-stock') {
        loadLowStock();
    }
}

// Load products from API - BUG: No error handling
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        products = await response.json();
        displayProducts(products);
        populateProductSelect();
    } catch (error) {
        // BUG: Poor error handling
        console.error('Error loading products:', error);
    }
}

// Display products in the grid - BUG: No null checking
function displayProducts(productsToShow) {
    const productsList = document.getElementById('products-list');
    
    if (productsToShow.length === 0) {
        productsList.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    productsList.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}">
            <h3>${product.name}</h3>
            <p class="description">${product.description || 'No description'}</p>
            <div class="product-details">
                <span class="quantity ${product.quantity <= 5 ? 'low-stock' : ''}">${product.quantity} in stock</span>
                <span class="price">$${product.price}</span>
                <span class="category">${product.category || 'Uncategorized'}</span>
            </div>
            <div class="product-actions">
                <button onclick="editProduct(${product.id})" class="btn-edit">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="btn-delete">Delete</button>
            </div>
        </div>
    `).join('');
}

// Filter products - Fixed: Case insensitive search
function filterProducts() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
    );
    displayProducts(filteredProducts);
}

// Add new product - Fixed: Added client-side validation and better error handling
async function addProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name').trim();
    const quantity = parseInt(formData.get('quantity'));
    const price = parseFloat(formData.get('price'));
    
    // Client-side validation
    if (!name) {
        alert('Product name is required');
        return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
        alert('Quantity must be a non-negative number');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        alert('Price must be a non-negative number');
        return;
    }
    
    const productData = {
        name: name,
        description: formData.get('description'),
        quantity: quantity,
        price: price,
        category: formData.get('category')
    };
    
    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            event.target.reset(); // Fixed: Properly reset form
            loadProducts();
            showSection('products');
            alert('Product added successfully!');
        } else {
            const errorData = await response.json();
            alert('Error adding product: ' + errorData.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: Unable to connect to server');
    }
}

// Edit product - Fixed: Added validation for product existence
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    
    // Fixed: Added null check
    if (!product) {
        alert('Product not found');
        return;
    }
    
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name || '';
    document.getElementById('edit-description').value = product.description || '';
    document.getElementById('edit-quantity').value = product.quantity || 0;
    document.getElementById('edit-price').value = product.price || 0;
    document.getElementById('edit-category').value = product.category || '';
    
    document.getElementById('edit-modal').style.display = 'block';
}

// Update product
async function updateProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('edit-id').value;
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        category: formData.get('category')
    };
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            closeEditModal();
            loadProducts();
            alert('Product updated successfully!');
        } else {
            alert('Error updating product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error');
    }
}

// Delete product - Fixed: Added confirmation dialog
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    const productName = product ? product.name : 'this product';
    
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone and will also delete all related transactions.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadProducts();
            alert('Product deleted successfully!');
        } else {
            const errorData = await response.json();
            alert('Error deleting product: ' + errorData.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: Unable to connect to server');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Populate product select dropdown
function populateProductSelect() {
    const select = document.getElementById('product-select');
    select.innerHTML = '<option value="">Select a product...</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.quantity} in stock)`;
        select.appendChild(option);
    });
}

// Record transaction - Fixed: Added validation for stock availability
async function recordTransaction(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productId = parseInt(formData.get('product_id'));
    const type = formData.get('type');
    const quantity = parseInt(formData.get('quantity'));
    
    // Client-side validation
    if (isNaN(productId) || productId <= 0) {
        alert('Please select a valid product');
        return;
    }
    
    if (!type || (type !== 'in' && type !== 'out')) {
        alert('Please select a transaction type');
        return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('Quantity must be a positive number');
        return;
    }
    
    // Check stock availability for 'out' transactions
    if (type === 'out') {
        const product = products.find(p => p.id === productId);
        if (product && product.quantity < quantity) {
            alert(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`);
            return;
        }
    }
    
    const transactionData = {
        product_id: productId,
        type: type,
        quantity: quantity,
        reason: formData.get('reason')
    };
    
    try {
        const response = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        if (response.ok) {
            event.target.reset();
            loadTransactions();
            loadProducts(); // Refresh product quantities
            populateProductSelect(); // Update dropdown with new quantities
            alert('Transaction recorded successfully!');
        } else {
            const errorData = await response.json();
            alert('Error recording transaction: ' + errorData.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: Unable to connect to server');
    }
}

// Load transactions - Fixed: Handle paginated response
async function loadTransactions(page = 1, limit = 50) {
    try {
        const response = await fetch(`${API_BASE}/transactions?page=${page}&limit=${limit}`);
        const data = await response.json();
        
        // Handle both old and new API response formats
        if (data.transactions) {
            transactions = data.transactions;
            displayTransactions(transactions, data.pagination);
        } else {
            // Backward compatibility with old format
            transactions = data;
            displayTransactions(transactions);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-list').innerHTML = '<p class="error">Failed to load transactions</p>';
    }
}

// Display transactions
function displayTransactions(transactionsToShow, pagination = null) {
    const transactionsList = document.getElementById('transactions-list');
    
    if (transactionsToShow.length === 0) {
        transactionsList.innerHTML = '<p>No transactions found.</p>';
        return;
    }
    
    let html = transactionsToShow.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <strong>${transaction.product_name}</strong>
                <span class="transaction-type">${transaction.type.toUpperCase()}</span>
                <span class="quantity">${transaction.quantity}</span>
            </div>
            <div class="transaction-meta">
                <span class="reason">${transaction.reason || 'No reason provided'}</span>
                <span class="date">${new Date(transaction.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
    
    // Add pagination controls if pagination data is available
    if (pagination) {
        html += `
            <div class="pagination-controls">
                <div class="pagination-info">
                    Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total transactions)
                </div>
                <div class="pagination-buttons">
                    ${pagination.hasPrev ? `<button onclick="loadTransactions(${pagination.page - 1})" class="btn-pagination">Previous</button>` : ''}
                    ${pagination.hasNext ? `<button onclick="loadTransactions(${pagination.page + 1})" class="btn-pagination">Next</button>` : ''}
                </div>
            </div>
        `;
    }
    
    transactionsList.innerHTML = html;
}

// Load low stock items
async function loadLowStock() {
    try {
        const response = await fetch(`${API_BASE}/low-stock`);
        const data = await response.json();
        // Handle the new API response format
        const lowStockItems = data.products || data;
        displayLowStock(lowStockItems);
    } catch (error) {
        console.error('Error loading low stock items:', error);
    }
}

// Display low stock items
function displayLowStock(items) {
    const lowStockList = document.getElementById('low-stock-list');
    
    if (items.length === 0) {
        lowStockList.innerHTML = '<p class="no-alerts">✅ All products are well-stocked!</p>';
        return;
    }
    
    lowStockList.innerHTML = items.map(item => `
        <div class="low-stock-item">
            <div class="item-info">
                <strong>${item.name}</strong>
                <span class="category">${item.category || 'Uncategorized'}</span>
            </div>
            <div class="stock-info">
                <span class="quantity critical">${item.quantity} remaining</span>
                <button onclick="quickRestock(${item.id})" class="btn-restock">Quick Restock</button>
            </div>
        </div>
    `).join('');
}

// Quick restock function - BUG: Hardcoded restock amount
function quickRestock(productId) {
    const restockAmount = 10; // BUG: Should be configurable
    
    // BUG: Should use the record transaction function
    const transactionData = {
        product_id: productId,
        type: 'in',
        quantity: restockAmount,
        reason: 'Quick restock'
    };
    
    fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    })
    .then(response => {
        if (response.ok) {
            loadProducts();
            loadLowStock();
            alert(`Restocked ${restockAmount} units successfully!`);
        } else {
            alert('Error restocking product');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Network error');
    });
}

// BUG: Modal click outside to close not implemented
document.addEventListener('click', function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
});