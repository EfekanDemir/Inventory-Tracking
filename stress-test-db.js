const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

class DatabaseStressTester {
    constructor() {
        this.issues = [];
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${timestamp} ${prefix} ${message}`);
    }

    async makeRequest(url, options = {}) {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
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
    }

    async testConcurrentTransactions() {
        await this.log('\n=== TESTING CONCURRENT TRANSACTIONS ===');
        
        try {
            // Create a product for concurrent testing
            const productData = {
                name: 'Concurrency Test Product',
                quantity: 100,
                price: 10.00,
                category: 'Test'
            };
            
            const { data: product } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            const productId = product.id;
            await this.log(`Created test product with ID: ${productId}`);
            
            // Create multiple concurrent transactions
            const concurrentTransactions = [];
            const numTransactions = 10;
            const quantityPerTransaction = 5;
            
            for (let i = 0; i < numTransactions; i++) {
                const transactionData = {
                    product_id: productId,
                    type: 'out',
                    quantity: quantityPerTransaction,
                    reason: `Concurrent test ${i + 1}`
                };
                
                concurrentTransactions.push(
                    this.makeRequest(`${API_BASE}/transactions`, {
                        method: 'POST',
                        body: JSON.stringify(transactionData)
                    })
                );
            }
            
            await this.log(`Starting ${numTransactions} concurrent transactions...`);
            const results = await Promise.allSettled(concurrentTransactions);
            
            // Analyze results
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201).length;
            const failed = results.length - successful;
            
            await this.log(`Concurrent transactions - Successful: ${successful}, Failed: ${failed}`);
            
            // Check final quantity
            const { data: finalProduct } = await this.makeRequest(`${API_BASE}/products/${productId}`);
            const expectedQuantity = 100 - (successful * quantityPerTransaction);
            
            await this.log(`Final quantity: ${finalProduct.quantity}, Expected: ${expectedQuantity}`);
            
            if (finalProduct.quantity !== expectedQuantity) {
                this.issues.push(`Quantity mismatch after concurrent transactions: got ${finalProduct.quantity}, expected ${expectedQuantity}`);
                await this.log('❌ CONCURRENCY ISSUE: Quantity mismatch detected!', 'error');
            } else {
                await this.log('✅ Concurrent transactions handled correctly', 'success');
            }
            
            // Clean up
            await this.makeRequest(`${API_BASE}/products/${productId}`, { method: 'DELETE' });
            
        } catch (error) {
            this.issues.push(`Concurrency test error: ${error.message}`);
            await this.log(`Concurrency test error: ${error.message}`, 'error');
        }
    }

    async testLargeDataOperations() {
        await this.log('\n=== TESTING LARGE DATA OPERATIONS ===');
        
        try {
            // Test with very large strings
            const largeDescription = 'A'.repeat(10000);
            const largeData = {
                name: 'Large Data Test Product',
                description: largeDescription,
                quantity: 1,
                price: 1.00,
                category: 'Large Test'
            };
            
            const { data, status } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(largeData)
            });
            
            if (status === 201) {
                await this.log('✅ Large data insert successful', 'success');
                // Clean up
                await this.makeRequest(`${API_BASE}/products/${data.id}`, { method: 'DELETE' });
            } else {
                this.issues.push(`Large data insert failed: ${status} - ${JSON.stringify(data)}`);
                await this.log(`Large data insert failed: ${status}`, 'error');
            }
            
        } catch (error) {
            this.issues.push(`Large data test error: ${error.message}`);
            await this.log(`Large data test error: ${error.message}`, 'error');
        }
    }

    async testDatabaseConstraints() {
        await this.log('\n=== TESTING DATABASE CONSTRAINTS ===');
        
        try {
            // Test 1: Very large numbers
            await this.log('Testing very large numbers...');
            const largeNumberData = {
                name: 'Large Number Test',
                quantity: Number.MAX_SAFE_INTEGER,
                price: 99999999.99,
                category: 'Large Numbers'
            };
            
            const { data: largeResult, status: largeStatus } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(largeNumberData)
            });
            
            if (largeStatus === 201) {
                await this.log('✅ Large numbers handled correctly', 'success');
                await this.makeRequest(`${API_BASE}/products/${largeResult.id}`, { method: 'DELETE' });
            } else {
                this.issues.push(`Large numbers rejected: ${largeStatus} - ${JSON.stringify(largeResult)}`);
                await this.log(`Large numbers issue: ${largeStatus}`, 'warning');
            }
            
            // Test 2: Decimal precision
            await this.log('Testing decimal precision...');
            const precisionData = {
                name: 'Precision Test',
                quantity: 1,
                price: 0.001, // Very small decimal
                category: 'Precision'
            };
            
            const { data: precisionResult, status: precisionStatus } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(precisionData)
            });
            
            if (precisionStatus === 201) {
                await this.log(`Price precision: stored as ${precisionResult.price}`, 'info');
                if (Math.abs(precisionResult.price - 0.001) > 0.0001) {
                    this.issues.push(`Decimal precision lost: expected 0.001, got ${precisionResult.price}`);
                    await this.log('❌ Decimal precision issue detected!', 'error');
                } else {
                    await this.log('✅ Decimal precision maintained', 'success');
                }
                await this.makeRequest(`${API_BASE}/products/${precisionResult.id}`, { method: 'DELETE' });
            }
            
            // Test 3: Special characters in names
            await this.log('Testing special characters...');
            const specialCharData = {
                name: "Test with 'quotes' and \"double quotes\" & special chars: !@#$%^&*()",
                quantity: 1,
                price: 1.00,
                category: 'Special'
            };
            
            const { data: specialResult, status: specialStatus } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(specialCharData)
            });
            
            if (specialStatus === 201) {
                await this.log('✅ Special characters handled correctly', 'success');
                await this.makeRequest(`${API_BASE}/products/${specialResult.id}`, { method: 'DELETE' });
            } else {
                this.issues.push(`Special characters rejected: ${specialStatus} - ${JSON.stringify(specialResult)}`);
                await this.log(`Special characters issue: ${specialStatus}`, 'warning');
            }
            
        } catch (error) {
            this.issues.push(`Constraint test error: ${error.message}`);
            await this.log(`Constraint test error: ${error.message}`, 'error');
        }
    }

    async testTransactionIntegrity() {
        await this.log('\n=== TESTING TRANSACTION INTEGRITY ===');
        
        try {
            // Create a product
            const productData = {
                name: 'Transaction Integrity Test',
                quantity: 50,
                price: 10.00,
                category: 'Integrity Test'
            };
            
            const { data: product } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            const productId = product.id;
            await this.log(`Created product with ID: ${productId} and quantity: ${product.quantity}`);
            
            // Test overselling protection
            await this.log('Testing overselling protection...');
            const oversellData = {
                product_id: productId,
                type: 'out',
                quantity: 100, // More than available
                reason: 'Overselling test'
            };
            
            const { data: oversellResult, status: oversellStatus } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(oversellData)
            });
            
            if (oversellStatus === 400) {
                await this.log('✅ Overselling correctly prevented', 'success');
            } else {
                this.issues.push(`Overselling not prevented: ${oversellStatus} - ${JSON.stringify(oversellResult)}`);
                await this.log('❌ CRITICAL: Overselling was allowed!', 'error');
            }
            
            // Test transaction rollback on error
            await this.log('Testing valid transaction...');
            const validData = {
                product_id: productId,
                type: 'out',
                quantity: 10,
                reason: 'Valid test transaction'
            };
            
            const { data: validResult, status: validStatus } = await this.makeRequest(`${API_BASE}/transactions`, {
                method: 'POST',
                body: JSON.stringify(validData)
            });
            
            if (validStatus === 201) {
                await this.log(`✅ Valid transaction successful. New quantity: ${validResult.new_product_quantity}`, 'success');
                
                // Verify quantity was actually updated
                const { data: updatedProduct } = await this.makeRequest(`${API_BASE}/products/${productId}`);
                if (updatedProduct.quantity !== validResult.new_product_quantity) {
                    this.issues.push(`Quantity update inconsistency: transaction says ${validResult.new_product_quantity}, product shows ${updatedProduct.quantity}`);
                    await this.log('❌ CRITICAL: Quantity update inconsistency!', 'error');
                } else {
                    await this.log('✅ Quantity update consistency verified', 'success');
                }
            } else {
                this.issues.push(`Valid transaction failed: ${validStatus} - ${JSON.stringify(validResult)}`);
                await this.log('❌ Valid transaction unexpectedly failed', 'error');
            }
            
            // Clean up
            await this.makeRequest(`${API_BASE}/products/${productId}`, { method: 'DELETE' });
            
        } catch (error) {
            this.issues.push(`Transaction integrity test error: ${error.message}`);
            await this.log(`Transaction integrity test error: ${error.message}`, 'error');
        }
    }

    async testDatabaseLocking() {
        await this.log('\n=== TESTING DATABASE LOCKING ===');
        
        try {
            // Create a product
            const productData = {
                name: 'Database Lock Test',
                quantity: 20,
                price: 5.00,
                category: 'Lock Test'
            };
            
            const { data: product } = await this.makeRequest(`${API_BASE}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            const productId = product.id;
            
            // Simulate rapid-fire updates
            const rapidUpdates = [];
            for (let i = 0; i < 5; i++) {
                const updateData = {
                    name: `Updated Product ${i}`,
                    quantity: 20 + i,
                    price: 5.00 + i,
                    category: 'Lock Test'
                };
                
                rapidUpdates.push(
                    this.makeRequest(`${API_BASE}/products/${productId}`, {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    })
                );
            }
            
            await this.log('Testing rapid-fire updates...');
            const updateResults = await Promise.allSettled(rapidUpdates);
            
            const successfulUpdates = updateResults.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
            await this.log(`Rapid updates - Successful: ${successfulUpdates}/${updateResults.length}`);
            
            if (successfulUpdates === updateResults.length) {
                await this.log('✅ All rapid updates successful', 'success');
            } else {
                this.issues.push(`Some rapid updates failed: ${successfulUpdates}/${updateResults.length} successful`);
                await this.log('⚠️ Some rapid updates failed - possible locking issues', 'warning');
            }
            
            // Clean up
            await this.makeRequest(`${API_BASE}/products/${productId}`, { method: 'DELETE' });
            
        } catch (error) {
            this.issues.push(`Database locking test error: ${error.message}`);
            await this.log(`Database locking test error: ${error.message}`, 'error');
        }
    }

    async runStressTests() {
        await this.log('🔥 Starting database stress tests...\n');
        
        await this.testConcurrentTransactions();
        await this.testLargeDataOperations();
        await this.testDatabaseConstraints();
        await this.testTransactionIntegrity();
        await this.testDatabaseLocking();
        
        await this.log('\n=== STRESS TEST SUMMARY ===');
        
        if (this.issues.length === 0) {
            await this.log('🎉 All stress tests passed! Database appears robust.', 'success');
        } else {
            await this.log(`⚠️ Found ${this.issues.length} potential issues:`, 'warning');
            this.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        return this.issues.length === 0;
    }
}

// Run stress tests
(async () => {
    const tester = new DatabaseStressTester();
    const success = await tester.runStressTests();
    console.log('\n✨ Database stress testing complete!');
    process.exit(success ? 0 : 1);
})();