const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testBasicOperations() {
    console.log('🚀 Testing database operations...\n');
    
    try {
        // Test 1: INSERT - Create a product
        console.log('1. Testing INSERT operation...');
        const productData = {
            name: 'DB Test Product',
            description: 'Testing database operations',
            quantity: 10,
            price: 25.99,
            category: 'Test'
        };
        
        const insertResponse = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        const insertResult = await insertResponse.json();
        console.log(`   Status: ${insertResponse.status}`);
        console.log(`   Result: ${JSON.stringify(insertResult, null, 2)}`);
        
        if (insertResponse.status !== 201) {
            console.log('❌ INSERT test failed!');
            return;
        }
        
        const productId = insertResult.id;
        console.log('✅ INSERT test passed!');
        
        // Test 2: UPDATE - Modify the product
        console.log('\n2. Testing UPDATE operation...');
        const updateData = {
            name: 'Updated DB Test Product',
            description: 'Updated description',
            quantity: 15,
            price: 30.99,
            category: 'Updated Test'
        };
        
        const updateResponse = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        console.log(`   Status: ${updateResponse.status}`);
        console.log(`   Result: ${JSON.stringify(updateResult, null, 2)}`);
        
        if (updateResponse.status !== 200) {
            console.log('❌ UPDATE test failed!');
            return;
        }
        console.log('✅ UPDATE test passed!');
        
        // Test 3: INSERT Transaction
        console.log('\n3. Testing transaction INSERT...');
        const transactionData = {
            product_id: productId,
            type: 'out',
            quantity: 5,
            reason: 'Test sale'
        };
        
        const transactionResponse = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });
        
        const transactionResult = await transactionResponse.json();
        console.log(`   Status: ${transactionResponse.status}`);
        console.log(`   Result: ${JSON.stringify(transactionResult, null, 2)}`);
        
        if (transactionResponse.status !== 201) {
            console.log('❌ Transaction INSERT test failed!');
            return;
        }
        console.log('✅ Transaction INSERT test passed!');
        
        // Test 4: Verify product quantity was updated
        console.log('\n4. Verifying quantity update...');
        const getResponse = await fetch(`${API_BASE}/products/${productId}`);
        const getResult = await getResponse.json();
        console.log(`   Product quantity after transaction: ${getResult.quantity}`);
        
        const expectedQuantity = 10; // 15 (updated) - 5 (transaction out)
        if (getResult.quantity !== expectedQuantity) {
            console.log(`❌ Quantity mismatch! Expected ${expectedQuantity}, got ${getResult.quantity}`);
        } else {
            console.log('✅ Quantity verification passed!');
        }
        
        // Test 5: DELETE - Remove the product
        console.log('\n5. Testing DELETE operation...');
        const deleteResponse = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE'
        });
        
        const deleteResult = await deleteResponse.json();
        console.log(`   Status: ${deleteResponse.status}`);
        console.log(`   Result: ${JSON.stringify(deleteResult, null, 2)}`);
        
        if (deleteResponse.status !== 200) {
            console.log('❌ DELETE test failed!');
            return;
        }
        console.log('✅ DELETE test passed!');
        
        // Test 6: Verify product was deleted
        console.log('\n6. Verifying deletion...');
        const verifyResponse = await fetch(`${API_BASE}/products/${productId}`);
        console.log(`   Status: ${verifyResponse.status}`);
        
        if (verifyResponse.status !== 404) {
            console.log('❌ Product should be deleted but still exists!');
            return;
        }
        console.log('✅ Deletion verification passed!');
        
        console.log('\n🎉 All basic database operations are working correctly!');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

async function testEdgeCases() {
    console.log('\n🔍 Testing edge cases and error conditions...\n');
    
    try {
        // Test negative values
        console.log('1. Testing negative values (should fail)...');
        const negativeData = {
            name: 'Negative Test',
            quantity: -5,
            price: -10.00
        };
        
        const negativeResponse = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(negativeData)
        });
        
        console.log(`   Status: ${negativeResponse.status}`);
        const negativeResult = await negativeResponse.json();
        console.log(`   Result: ${JSON.stringify(negativeResult, null, 2)}`);
        
        if (negativeResponse.status === 400) {
            console.log('✅ Negative values correctly rejected!');
        } else {
            console.log('❌ Negative values should be rejected!');
        }
        
        // Test missing required fields
        console.log('\n2. Testing missing required fields (should fail)...');
        const missingData = {
            description: 'Missing name field',
            quantity: 5
        };
        
        const missingResponse = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(missingData)
        });
        
        console.log(`   Status: ${missingResponse.status}`);
        const missingResult = await missingResponse.json();
        console.log(`   Result: ${JSON.stringify(missingResult, null, 2)}`);
        
        if (missingResponse.status === 400) {
            console.log('✅ Missing required fields correctly rejected!');
        } else {
            console.log('❌ Missing required fields should be rejected!');
        }
        
        // Test invalid ID formats
        console.log('\n3. Testing invalid ID format (should fail)...');
        const invalidIdResponse = await fetch(`${API_BASE}/products/invalid-id`, {
            method: 'GET'
        });
        
        console.log(`   Status: ${invalidIdResponse.status}`);
        const invalidIdResult = await invalidIdResponse.json();
        console.log(`   Result: ${JSON.stringify(invalidIdResult, null, 2)}`);
        
        if (invalidIdResponse.status === 400) {
            console.log('✅ Invalid ID format correctly rejected!');
        } else {
            console.log('❌ Invalid ID format should be rejected!');
        }
        
    } catch (error) {
        console.error('❌ Edge case test error:', error.message);
    }
}

// Run tests
(async () => {
    await testBasicOperations();
    await testEdgeCases();
    console.log('\n✨ Database testing complete!');
})();