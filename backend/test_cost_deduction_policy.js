require('dotenv').config();
const { User, Customer, ServiceType, ServiceOrder, WalletAccount, WalletTransaction, Invoice, SystemConfig, Tenant } = require('./models');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('  TEST SUITE: Strict Cost Deduction Policy & Zero Double-Deduction Guarantee');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    try {
        const user = await User.findOne({ where: { email: 'admin@docclear.com' } });
        if (!user) {
            console.error('❌ Admin user not found');
            process.exit(1);
        }

        const tenantId = user.tenant_id || 1;
        await Tenant.update({ status: 'active', subscription_status: 'active' }, { where: { id: tenantId } });

        const token = jwt.sign(
            { id: user.id, email: user.email, tenant_id: tenantId },
            process.env.JWT_SECRET || 'docclear_secret_key_2024'
        );
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const customer = await Customer.findOne({ where: { tenant_id: tenantId } });
        const wallet = await WalletAccount.findOne({ where: { tenant_id: tenantId } });
        let serviceType = await ServiceType.findOne({ where: { tenant_id: tenantId } });

        if (!customer || !wallet || !serviceType) {
            console.error('❌ Missing prerequisite data: customer, wallet, or serviceType');
            process.exit(1);
        }

        // Ensure service type has a known cost price
        const testCost = 75.00;
        await serviceType.update({ cost_price: testCost });

        console.log(`Initial Setup:`);
        console.log(`- Customer: ${customer.name} (ID: ${customer.id})`);
        console.log(`- Service Type: ${serviceType.name} (Cost: AED ${testCost})`);
        console.log(`- Wallet: ${wallet.name} (ID: ${wallet.id})`);

        // Helper to get fresh wallet balance directly from DB
        const getWalletBalance = async () => {
            const fresh = await WalletAccount.findByPk(wallet.id);
            return parseFloat(fresh.balance);
        };

        // ═════════════════════════════════════════════════════════════════════
        // SCENARIO 1: Policy = 'service_completion'
        // Service deducts on completion. Invoice must NEVER deduct again!
        // ═════════════════════════════════════════════════════════════════════
        console.log('\n─────────────────────────────────────────────────────────────────────────');
        console.log('▶ SCENARIO 1: Policy = "service_completion"');
        console.log('  Cost deducted at Service Completion. Invoice must SKIP deduction.');
        console.log('─────────────────────────────────────────────────────────────────────────');

        // Set config to service_completion
        await SystemConfig.upsert({
            tenant_id: tenantId,
            key: 'wallet_deduction_point',
            value: 'service_completion'
        });

        const balBeforeS1 = await getWalletBalance();
        console.log(`Wallet Balance Before Scenario 1: ${balBeforeS1}`);

        // Step 1.1: Create Service Order (In Progress)
        const orderS1 = await ServiceOrder.create({
            customer_id: customer.id,
            service_type_id: serviceType.id,
            status: 'In Progress',
            is_cost_deducted: false,
            tenant_id: tenantId
        });
        console.log(`Created Service Order #${orderS1.id} (Status: In Progress, is_cost_deducted: false)`);

        // Step 1.2: Complete the Service Order with wallet_id (deducting cost)
        const completeResS1 = await fetch(`${API_URL}/services/orders/${orderS1.id}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'Completed',
                wallet_id: wallet.id,
                cost_type: 'Wallet'
            })
        });
        const completeDataS1 = await completeResS1.json();
        if (!completeDataS1.success) {
            throw new Error(`Failed to complete order: ${JSON.stringify(completeDataS1)}`);
        }

        const balAfterCompleteS1 = await getWalletBalance();
        const deductedAtComplete = balBeforeS1 - balAfterCompleteS1;
        console.log(`Wallet Balance After Service Completion: ${balAfterCompleteS1}`);
        console.log(`Deduction at Completion: AED ${deductedAtComplete} (Expected: ${testCost})`);

        if (Math.abs(deductedAtComplete - testCost) > 0.01) {
            console.error(`❌ FAILED: Wallet deduction mismatch at completion!`);
            process.exit(1);
        } else {
            console.log(`  ✓ Check 1 Passed: Exactly AED ${testCost} deducted at Service Completion.`);
        }

        // Verify order in DB now has is_cost_deducted = true
        const freshOrderS1 = await ServiceOrder.findByPk(orderS1.id);
        if (!freshOrderS1.is_cost_deducted) {
            console.error(`❌ FAILED: Order #${orderS1.id} is_cost_deducted should be true!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 2 Passed: Service Order #${orderS1.id} is_cost_deducted is TRUE in database.`);

        // Step 1.3: Attempt to call status update with wallet_id A SECOND TIME on the same order
        console.log(`\nAttempting a second completion/deduction request on Order #${orderS1.id}...`);
        await fetch(`${API_URL}/services/orders/${orderS1.id}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'Completed',
                wallet_id: wallet.id,
                cost_type: 'Wallet'
            })
        });
        const balAfterSecondComplete = await getWalletBalance();
        if (balAfterSecondComplete !== balAfterCompleteS1) {
            console.error(`❌ FAILED: Double deduction occurred on repeated service completion!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 3 Passed: Repeated service status call did NOT deduct wallet a second time.`);

        // Step 1.4: Now Create an Invoice for this Service Order (Status: Issued, wallet_id passed)
        console.log(`\nCreating Invoice (Status: Issued) containing the completed Service Order #${orderS1.id}...`);
        const invoicePayloadS1 = {
            customer_id: customer.id,
            service_order_ids: [orderS1.id],
            status: 'Issued',
            subtotal: 150,
            discount: 0,
            tax: 0,
            total: 150,
            items: [
                {
                    service_order_id: orderS1.id,
                    description: `${serviceType.name} (Service Order #${orderS1.id})`,
                    quantity: 1,
                    unit_price: 150,
                    cost_price: testCost,
                    wallet_id: wallet.id, // Intentionally pass wallet_id to test if backend guards against double-deducting!
                    total: 150
                }
            ]
        };

        const resInvS1 = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers,
            body: JSON.stringify(invoicePayloadS1)
        });
        const dataInvS1 = await resInvS1.json();
        if (!dataInvS1.success) {
            throw new Error(`Failed to create invoice: ${JSON.stringify(dataInvS1)}`);
        }
        const invoiceIdS1 = dataInvS1.data.id;
        console.log(`Invoice #${invoiceIdS1} created with status 'Issued'.`);

        const balAfterInvoiceS1 = await getWalletBalance();
        console.log(`Wallet Balance After Invoice Issuance: ${balAfterInvoiceS1}`);

        if (balAfterInvoiceS1 !== balAfterCompleteS1) {
            console.error(`❌ FAILED: Wallet was deducted again during invoice creation!`);
            console.error(`Before Invoice: ${balAfterCompleteS1}, After Invoice: ${balAfterInvoiceS1}`);
            process.exit(1);
        }
        console.log(`  ✓ Check 4 Passed: Zero additional wallet deduction during Invoice creation (Skipped correctly).`);

        // Cleanup Scenario 1
        await fetch(`${API_URL}/invoices/${invoiceIdS1}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: 'Draft' })
        });
        await fetch(`${API_URL}/invoices/${invoiceIdS1}`, { method: 'DELETE', headers });
        await ServiceOrder.destroy({ where: { id: orderS1.id } });


        // ═════════════════════════════════════════════════════════════════════
        // SCENARIO 2: Policy = 'invoice_creation'
        // Service completion does NOT deduct. Invoice creation DOES deduct.
        // Once invoice is issued, order must NEVER be deducted again!
        // ═════════════════════════════════════════════════════════════════════
        console.log('\n─────────────────────────────────────────────────────────────────────────');
        console.log('▶ SCENARIO 2: Policy = "invoice_creation"');
        console.log('  Service Completion does NOT deduct. Invoice Creation performs deduction.');
        console.log('  Subsequent operations must NEVER deduct again.');
        console.log('─────────────────────────────────────────────────────────────────────────');

        // Set config to invoice_creation
        await SystemConfig.upsert({
            tenant_id: tenantId,
            key: 'wallet_deduction_point',
            value: 'invoice_creation'
        });

        const balBeforeS2 = await getWalletBalance();
        console.log(`Wallet Balance Before Scenario 2: ${balBeforeS2}`);

        // Step 2.1: Create Service Order (In Progress)
        const orderS2 = await ServiceOrder.create({
            customer_id: customer.id,
            service_type_id: serviceType.id,
            status: 'In Progress',
            is_cost_deducted: false,
            tenant_id: tenantId
        });
        console.log(`Created Service Order #${orderS2.id} (Status: In Progress, is_cost_deducted: false)`);

        // Step 2.2: Complete Service Order WITHOUT wallet_id (strictly per invoice_creation policy)
        const completeResS2 = await fetch(`${API_URL}/services/orders/${orderS2.id}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'Completed'
            })
        });
        const completeDataS2 = await completeResS2.json();
        if (!completeDataS2.success) {
            throw new Error(`Failed to complete order: ${JSON.stringify(completeDataS2)}`);
        }

        const balAfterCompleteS2 = await getWalletBalance();
        console.log(`Wallet Balance After Service Completion: ${balAfterCompleteS2}`);
        if (balAfterCompleteS2 !== balBeforeS2) {
            console.error(`❌ FAILED: Wallet was deducted during completion under invoice_creation policy!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 5 Passed: Zero wallet deduction at Service Completion (Strict policy adherence).`);

        // Step 2.3: Create Invoice with status 'Issued' and wallet_id
        console.log(`\nCreating Invoice (Status: Issued) for Service Order #${orderS2.id}...`);
        const invoicePayloadS2 = {
            customer_id: customer.id,
            service_order_ids: [orderS2.id],
            status: 'Issued',
            subtotal: 150,
            discount: 0,
            tax: 0,
            total: 150,
            items: [
                {
                    service_order_id: orderS2.id,
                    description: `${serviceType.name} (Service Order #${orderS2.id})`,
                    quantity: 1,
                    unit_price: 150,
                    cost_price: testCost,
                    wallet_id: wallet.id,
                    total: 150
                }
            ]
        };

        const resInvS2 = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers,
            body: JSON.stringify(invoicePayloadS2)
        });
        const dataInvS2 = await resInvS2.json();
        if (!dataInvS2.success) {
            throw new Error(`Failed to create invoice: ${JSON.stringify(dataInvS2)}`);
        }
        const invoiceIdS2 = dataInvS2.data.id;
        console.log(`Invoice #${invoiceIdS2} created with status 'Issued'.`);

        const balAfterInvoiceS2 = await getWalletBalance();
        const deductedAtInvoiceS2 = balAfterCompleteS2 - balAfterInvoiceS2;
        console.log(`Wallet Balance After Invoice: ${balAfterInvoiceS2}`);
        console.log(`Deduction at Invoice: AED ${deductedAtInvoiceS2} (Expected: ${testCost})`);

        if (Math.abs(deductedAtInvoiceS2 - testCost) > 0.01) {
            console.error(`❌ FAILED: Expected deduction of ${testCost} at invoice issue!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 6 Passed: Exactly AED ${testCost} deducted upon Invoice Issue.`);

        // Step 2.4: Verify Service Order in DB was updated to is_cost_deducted = true
        const freshOrderS2 = await ServiceOrder.findByPk(orderS2.id);
        if (!freshOrderS2.is_cost_deducted) {
            console.error(`❌ FAILED: Service Order #${orderS2.id} was not marked is_cost_deducted = true after invoice issue!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 7 Passed: Service Order #${orderS2.id} is now flagged is_cost_deducted = true in DB.`);

        // Step 2.5: Attempt to deduct on the Service Order now
        console.log(`\nAttempting to deduct on Service Order #${orderS2.id} now that it is already deducted...`);
        await fetch(`${API_URL}/services/orders/${orderS2.id}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'Completed',
                wallet_id: wallet.id,
                cost_type: 'Wallet'
            })
        });
        const balAfterAttemptS2 = await getWalletBalance();
        if (balAfterAttemptS2 !== balAfterInvoiceS2) {
            console.error(`❌ FAILED: Wallet was deducted again on Service Order!`);
            process.exit(1);
        }
        console.log(`  ✓ Check 8 Passed: Service order safely rejected second deduction attempt.`);

        // Cleanup Scenario 2
        await fetch(`${API_URL}/invoices/${invoiceIdS2}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: 'Draft' })
        });
        await fetch(`${API_URL}/invoices/${invoiceIdS2}`, { method: 'DELETE', headers });
        await ServiceOrder.destroy({ where: { id: orderS2.id } });

        console.log('\n═══════════════════════════════════════════════════════════════════════════');
        console.log('  🎉 ALL 8 TESTS PASSED: STRICT COST DEDUCTION & ZERO DOUBLE-DEDUCTION!');
        console.log('═══════════════════════════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
    process.exit(0);
}

runTest();
