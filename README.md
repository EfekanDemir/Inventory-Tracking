# Inventory Tracking System

A web-based inventory management system built with Node.js, Express, and SQLite. This system allows users to manage products, track stock movements, and monitor low inventory levels.

## Features

- ✅ Product management (CRUD operations)
- ✅ Stock transaction tracking 
- ✅ Low stock alerts
- ✅ Search and filter functionality
- ✅ Responsive web interface

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/EfekanDemir/Inventory-Tracking.git
   cd Inventory-Tracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Testing & Demo Data

To quickly test the application with sample data:

1. **Start the application** first:
   ```bash
   npm start
   ```

2. **Add demo data** by opening the browser console and running:
   ```javascript
   // Open browser console and run these commands
   addSampleData();     // Adds sample products
   addSampleTransactions(); // Adds sample transactions
   ```

   Or include the test data script in your HTML:
   ```html
   <script src="test-data.js"></script>
   ```

The demo data includes:
- 8 sample products across different categories
- Various stock levels (including low-stock items)
- Sample transactions to demonstrate the system

## Bug Fixes Applied

The following bugs have been identified and fixed in this version:

### ✅ Fixed Backend Issues (app.js)

1. **Input Validation** - ✅ FIXED
   - ✅ Added comprehensive validation for product data (name, quantity, price)
   - ✅ Prevents negative quantities and prices
   - ✅ Added required field validation
   - ✅ Added ID parameter validation

2. **Security Vulnerabilities** - ✅ FIXED
   - ✅ Added parameter validation for ID fields
   - ✅ Added data type validation
   - ✅ Proper input sanitization

3. **Database Issues** - ✅ FIXED
   - ✅ Fixed race conditions in transaction recording using database transactions
   - ✅ Added cascade delete for related transactions
   - ✅ Wrapped critical operations in database transactions

4. **Performance Issues** - ✅ PARTIALLY FIXED
   - ✅ Made threshold configurable for low stock alerts
   - ⚠️ Pagination for transaction history (pending - requires frontend changes)

5. **Error Handling** - ✅ FIXED
   - ✅ Improved error messages with specific details
   - ✅ Added proper HTTP status codes
   - ✅ Better graceful shutdown handling

### ✅ Fixed Frontend Issues (script.js)

1. **User Experience** - ✅ FIXED
   - ✅ Added confirmation dialogs for delete operations
   - ✅ Improved error messages to users with specific details
   - ✅ Fixed case-insensitive search functionality

2. **Data Validation** - ✅ FIXED
   - ✅ Added comprehensive client-side validation for forms
   - ✅ Added null/undefined checks
   - ✅ Added stock availability validation for transactions

3. **Code Quality** - ✅ IMPROVED
   - ✅ Better error handling in API calls
   - ✅ Proper form reset functionality
   - ✅ Updated API response handling

### ✅ Fixed UI/UX Issues (style.css & index.html)

1. **Responsive Design** - ✅ IMPROVED
   - ✅ Fixed mobile layout for transaction items
   - ✅ Better navigation stacking on mobile
   - ✅ Improved overall mobile responsiveness

2. **Form Validation** - ✅ FIXED
   - ✅ HTML inputs now prevent negative values (min="0")
   - ✅ Added proper form validation constraints
   - ✅ Better user feedback

3. **Modal Issues** - ✅ IMPROVED
   - ✅ Better modal interaction handling
   - ✅ Click outside to close functionality

## Remaining Known Issues

The following minor issues may still need attention in future versions:

### Performance Optimizations
1. **Pagination** - Transaction history could benefit from pagination for large datasets
2. **Caching** - Consider implementing client-side caching for better performance
3. **Query Optimization** - Database queries could be optimized for larger datasets

### Additional Features
1. **Accessibility** - ARIA labels and keyboard navigation could be improved
2. **Loading States** - Visual loading indicators during API calls
3. **Batch Operations** - Ability to perform bulk operations on multiple products
4. **Export/Import** - Data export/import functionality
5. **User Management** - Authentication and user roles

### Advanced Functionality
1. **Product Images** - Support for product image uploads
2. **Barcode Scanning** - QR/Barcode support for quick product lookup
3. **Reporting** - Advanced analytics and reporting features
4. **Notifications** - Email/SMS notifications for low stock alerts

## Bug Fixing Priority

### High Priority
1. Input validation (security & data integrity)
2. Database race conditions
3. Error handling improvements

### Medium Priority
1. User experience enhancements
2. Mobile responsiveness
3. Performance optimizations

### Low Priority
1. Code refactoring
2. Additional features
3. UI polish

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions` - Record new transaction
- `GET /api/low-stock` - Get low stock items

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0.0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type TEXT NOT NULL, -- 'in' or 'out'
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Fix bugs following the priority list above
4. Test thoroughly
5. Submit a pull request

## License

MIT License