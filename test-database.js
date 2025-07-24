// Comprehensive database testing script
const API_BASE = 'http://localhost:3000/api';

class DatabaseTester {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${timestamp} ${prefix} ${message}`);
    }

    async test(description, testFn) {
        this.testCount++;
        try {
            await this.log(`Test ${this.testCount}: ${description}`, 'info');
            await testFn();
            this.passCount++;
            await this.log(`PASSED: ${description}`, 'success');
        } catch (error) {
            this.failCount++;
            await this.log(`FAILED: ${description} - ${error.message}`, 'error');
            this.testResults.push({ test: description, error: error.message });
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { raw: text };
            }
            
            return { response, data, status: response.status };
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }
    }

    // Test INSERT operations
    async testInsertOperations() {
        await this.log('\n=== TESTING INSERT OPERATIONS ===');
        
        // Test 1: Valid product insert
        await this.test('Insert valid product', async () => {
            const productData = {
                name: 'Test Product 1',
                description: 'A test product',
                quantity: 10,
                price: 25.99,
                category: 'Test Category'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            if (status !== 201) {
                throw new Error(`Expected status 201, got ${status}: ${JSON.stringify(data)}`);
            }
            
            if (!data.id || data.name !== productData.name) {
                throw new Error(`Invalid response data: ${JSON.stringify(data)}`);
            }
            
            this.lastProductId = data.id;
        });

        // Test 2: Insert with missing required fields
        await this.test('Insert product with missing name (should fail)', async () => {
            const productData = {
                description: 'Missing name',
                quantity: 5,
                price: 10.00
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 3: Insert with negative values
        await this.test('Insert product with negative quantity (should fail)', async () => {
            const productData = {
                name: 'Negative Test',
                quantity: -5,
                price: 10.00
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 4: Insert with invalid data types
        await this.test('Insert product with invalid data types (should fail)', async () => {
            const productData = {
                name: 'Type Test',
                quantity: 'not-a-number',
                price: 'also-not-a-number'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 5: Insert transaction
        await this.test('Insert valid transaction', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for transaction test');
            }
            
            const transactionData = {
                product_id: this.lastProductId,
                type: 'in',
                quantity: 5,
                reason: 'Test restocking'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 201) {
                throw new Error(`Expected status 201, got ${status}: ${JSON.stringify(data)}`);
            }
            
            this.lastTransactionId = data.id;
        });

        // Test 6: Insert transaction with invalid product
        await this.test('Insert transaction with invalid product ID (should fail)', async () => {
            const transactionData = {
                product_id: 99999,
                type: 'out',
                quantity: 1,
                reason: 'Test invalid product'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 404) {
                throw new Error(`Expected status 404, got ${status}: ${JSON.stringify(data)}`);
            }
        });
    }

    // Test UPDATE operations
    async testUpdateOperations() {
        await this.log('\n=== TESTING UPDATE OPERATIONS ===');
        
        // Test 1: Valid product update
        await this.test('Update existing product', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for update test');
            }
            
            const updateData = {
                name: 'Updated Test Product',
                description: 'Updated description',
                quantity: 20,
                price: 35.99,
                category: 'Updated Category'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products/${this.lastProductId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            if (status !== 200) {
                throw new Error(`Expected status 200, got ${status}: ${JSON.stringify(data)}`);
            }
            
            if (data.name !== updateData.name) {
                throw new Error(`Update failed: expected name '${updateData.name}', got '${data.name}'`);
            }
        });

        // Test 2: Update non-existent product
        await this.test('Update non-existent product (should fail)', async () => {
            const updateData = {
                name: 'Non-existent Product',
                quantity: 10,
                price: 15.00
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products/99999`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            if (status !== 404) {
                throw new Error(`Expected status 404, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 3: Update with invalid ID
        await this.test('Update with invalid ID format (should fail)', async () => {
            const updateData = {
                name: 'Invalid ID Test',
                quantity: 10,
                price: 15.00
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products/invalid-id`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 4: Update with negative values
        await this.test('Update with negative values (should fail)', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for update test');
            }
            
            const updateData = {
                name: 'Negative Update Test',
                quantity: -10,
                price: -5.00
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products/${this.lastProductId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });
    }

    // Test DELETE operations
    async testDeleteOperations() {
        await this.log('\n=== TESTING DELETE OPERATIONS ===');
        
        // First create a product specifically for deletion tests
        await this.test('Create product for deletion test', async () => {
            const productData = {
                name: 'Delete Test Product',
                description: 'Will be deleted',
                quantity: 5,
                price: 10.00,
                category: 'Delete Test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            if (status !== 201) {
                throw new Error(`Expected status 201, got ${status}: ${JSON.stringify(data)}`);
            }
            
            this.deleteTestProductId = data.id;
        });

        // Add a transaction for the delete test product
        await this.test('Add transaction to delete test product', async () => {
            if (!this.deleteTestProductId) {
                throw new Error('No delete test product ID available');
            }
            
            const transactionData = {
                product_id: this.deleteTestProductId,
                type: 'in',
                quantity: 3,
                reason: 'For delete test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 201) {
                throw new Error(`Expected status 201, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 1: Delete product with transactions (cascade delete)
        await this.test('Delete product with transactions (cascade delete)', async () => {
            if (!this.deleteTestProductId) {
                throw new Error('No delete test product ID available');
            }
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products/${this.deleteTestProductId}`, {
                method: 'DELETE'
            });
            
            if (status !== 200) {
                throw new Error(`Expected status 200, got ${status}: ${JSON.stringify(data)}`);
            }
            
            // Verify product is actually deleted
            const { data: getResult, status: getStatus } = await this.makeRequest(`${API_BASE}/products/${this.deleteTestProductId}`);
            
            if (getStatus !== 404) {
                throw new Error(`Product should be deleted but still exists: ${JSON.stringify(getResult)}`);
            }
        });

        // Test 2: Delete non-existent product
        await this.test('Delete non-existent product (should fail)', async () => {
            const { data, status } = await this.makeRequest(`${API_BASE}/products/99999`, {
                method: 'DELETE'
            });
            
            if (status !== 404) {
                throw new Error(`Expected status 404, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test 3: Delete with invalid ID
        await this.test('Delete with invalid ID format (should fail)', async () => {
            const { data, status } = await this.makeRequest(`${API_BASE}/products/invalid-id`, {
                method: 'DELETE'
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400, got ${status}: ${JSON.stringify(data)}`);
            }
        });
    }

    // Test transaction edge cases
    async testTransactionEdgeCases() {
        await this.log('\n=== TESTING TRANSACTION EDGE CASES ===');
        
        // Test overselling prevention
        await this.test('Prevent overselling (should fail)', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for overselling test');
            }
            
            // First get current stock
            const { data: product } = await this.makeRequest(`${API_BASE}/products/${this.lastProductId}`);
            const currentStock = product.quantity;
            
            // Try to sell more than available
            const transactionData = {
                product_id: this.lastProductId,
                type: 'out',
                quantity: currentStock + 10,
                reason: 'Overselling test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400 for overselling, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test negative transaction quantity
        await this.test('Transaction with negative quantity (should fail)', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for negative quantity test');
            }
            
            const transactionData = {
                product_id: this.lastProductId,
                type: 'in',
                quantity: -5,
                reason: 'Negative quantity test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400 for negative quantity, got ${status}: ${JSON.stringify(data)}`);
            }
        });

        // Test invalid transaction type
        await this.test('Transaction with invalid type (should fail)', async () => {
            if (!this.lastProductId) {
                throw new Error('No product ID available for invalid type test');
            }
            
            const transactionData = {
                product_id: this.lastProductId,
                type: 'invalid',
                quantity: 5,
                reason: 'Invalid type test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (status !== 400) {
                throw new Error(`Expected status 400 for invalid type, got ${status}: ${JSON.stringify(data)}`);
            }
        });
    }

    async runAllTests() {
        await this.log('🚀 Starting comprehensive database tests...\n');
        
        try {
            await this.testInsertOperations();
            await this.testUpdateOperations();
            await this.testDeleteOperations();
            await this.testTransactionEdgeCases();
            
            await this.log('\n=== TEST SUMMARY ===');
            await this.log(`Total tests: ${this.testCount}`);
            await this.log(`Passed: ${this.passCount}`, 'success');
            await this.log(`Failed: ${this.failCount}`, this.failCount > 0 ? 'error' : 'success');
            
            if (this.testResults.length > 0) {
                await this.log('\n=== FAILED TESTS ===', 'error');
                this.testResults.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.test}: ${result.error}`);
                });
            }
            
            return this.failCount === 0;
            
        } catch (error) {
            await this.log(`Test runner error: ${error.message}`, 'error');
            return false;
        }
    }
}

// Make it work in both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseTester;
} else if (typeof window !== 'undefined') {
    window.DatabaseTester = DatabaseTester;
    window.runDatabaseTests = async () => {
        const tester = new DatabaseTester();
        return await tester.runAllTests();
    };
} else {
    // Node.js command line execution
    (async () => {
        if (typeof fetch === 'undefined') {
            // Use node-fetch if available, otherwise provide helpful error
            try {
                global.fetch = require('node-fetch');
            } catch (e) {
                console.log('Please install node-fetch: npm install node-fetch');
                console.log('Or run this script in a browser environment');
                process.exit(1);
            }
        }
        
        const tester = new DatabaseTester();
        const success = await tester.runAllTests();
        process.exit(success ? 0 : 1);
    })();
}