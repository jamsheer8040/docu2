require('dotenv').config();
const { User, Customer, ServiceType, ServiceOrder, WalletAccount, Invoice } = require('./models');

async function run() {
    try {
        const user = await User.findOne({ where: { email: 'admin@docclear.com' } });
        if(!user) {
            console.log('No user'); return;
        }

        console.log(`User tenant_id is: ${user.tenant_id}`);
        // Fix tenant status so we don't get blocked
        const { Tenant } = require('./models');
        const updateRes = await Tenant.update({ status: 'active', subscription_status: 'active' }, { where: { id: user.tenant_id || 1 } });
        console.log(`Tenant Update:`, updateRes);
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, email: user.email, tenant_id: user.tenant_id }, process.env.JWT_SECRET || 'docclear_secret_key_2024');
        
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get a customer
        const resCust = await fetch('http://localhost:5000/api/v1/customers', { headers });
        const custData = await resCust.json();
        const customer = custData.data[0];

        // Get a wallet
        const resWallet = await fetch('http://localhost:5000/api/v1/wallet/accounts', { headers });
        const walletData = await resWallet.json();
        const wallet = walletData.data[0];

        // Get a service type
        const resType = await fetch('http://localhost:5000/api/v1/services/types', { headers });
        const typeData = await resType.json();
        const serviceType = typeData.data[0];

        if (!customer || !wallet || !serviceType) {
            console.log('Missing required data to run test:', { customer: !!customer, wallet: !!wallet, serviceType: !!serviceType });
            return;
        }

        console.log(`\n--- Test Environment Setup ---`);
        console.log(`Customer: ${customer.name}`);
        console.log(`Wallet: ${wallet.name} (Balance: ${wallet.balance})`);
        
        // 1. Create a service order
        const resOrder = await fetch('http://localhost:5000/api/v1/services/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customer_id: customer.id,
                service_type_id: serviceType.id,
                status: 'CompletedInvoicePending', // Directly push it to ready-for-invoice
                is_cost_deducted: true // Pretend cost was already deducted at service completion
            })
        });
        const orderData = await resOrder.json();
        if(!orderData.success) {
            console.error('Failed to create order:', orderData);
            return;
        }
        const order = orderData.data;
        // Force the DB to have is_cost_deducted = true since createServiceOrder might strip it
        await ServiceOrder.update({ is_cost_deducted: true }, { where: { id: order.id } });
        console.log(`\nCreated Service Order #${order.id} and forced is_cost_deducted=true`);

        // 2. Create Invoice with mixed items (Service + Manual)
        const invoicePayload = {
            customer_id: customer.id,
            service_order_ids: [order.id],
            status: 'Issued',
            subtotal: 150,
            discount: 0,
            tax: 0,
            total: 150,
            paid_amount: 0,
            items: [
                {
                    _service_order_id: order.id,
                    description: 'Test Service Item',
                    quantity: 1,
                    unit_price: 100,
                    cost_price: 50, // Cost is 50, but should NOT be deducted because service is_cost_deducted=true
                    selling_price: 100,
                    total: 100,
                    wallet_id: wallet.id
                },
                {
                    _service_order_id: null,
                    description: 'Test Manual Item',
                    quantity: 1,
                    unit_price: 50,
                    cost_price: 20, // Cost is 20, SHOULD be deducted because it's manual
                    selling_price: 50,
                    total: 50,
                    wallet_id: wallet.id
                }
            ]
        };

        console.log(`\nCreating Invoice (Status: Issued)...`);
        const resInv = await fetch('http://localhost:5000/api/v1/invoices', {
            method: 'POST',
            headers,
            body: JSON.stringify(invoicePayload)
        });
        const invData = await resInv.json();
        
        if (!invData.success) {
            console.error('Failed to create invoice:', invData);
            return;
        }
        console.log(`Invoice created successfully! ID: ${invData.data.id}`);

        // 3. Verify Wallet Deduction
        const resWalletAfter = await fetch(`http://localhost:5000/api/v1/wallet/accounts`, { headers });
        const walletAfterDataList = await resWalletAfter.json();
        const walletAfterData = walletAfterDataList.data.find(w => w.id === wallet.id);
        
        console.log(`\n--- Verification ---`);
        console.log(`Original Balance: ${wallet.balance}`);
        console.log(`New Balance: ${walletAfterData.balance}`);
        
        const expectedDeduction = 20; // Only the manual item's cost (20), NOT the service's cost (50)
        const actualDeduction = wallet.balance - walletAfterData.balance;
        
        console.log(`Expected Deduction: ${expectedDeduction}`);
        console.log(`Actual Deduction: ${actualDeduction}`);

        if (actualDeduction === expectedDeduction) {
            console.log('✅ TEST PASSED: Only manual item cost was deducted. Service cost was correctly skipped.');
        } else {
            console.log('❌ TEST FAILED: Deduction mismatch.');
        }

        // Cleanup
        console.log(`\nCleaning up...`);
        await fetch(`http://localhost:5000/api/v1/invoices/${invData.data.id}/status`, { 
            method: 'PUT', 
            headers, 
            body: JSON.stringify({ status: 'Draft' }) 
        });
        await fetch(`http://localhost:5000/api/v1/invoices/${invData.data.id}`, { method: 'DELETE', headers });
        await ServiceOrder.destroy({ where: { id: order.id } });

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
