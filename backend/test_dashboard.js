const { Op } = require('sequelize');
const { Customer, Document, DocumentType, Invoice, Expense, ServiceOrder, ServiceType, WalletAccount, sequelize } = require('d:/project/backend/models');

async function test() {
  try {
    const tenantId = 1; // Assuming tenant 1
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const whereDoc = { tenant_id: tenantId };
    const whereInvoiceAll = { tenant_id: tenantId, created_at: { [Op.between]: [startOfMonth, endOfMonth] } };
    const whereInvoicePaid = { tenant_id: tenantId, status: 'Paid', created_at: { [Op.between]: [startOfMonth, endOfMonth] } };
    const whereExpense = { tenant_id: tenantId, status: 'Paid', created_at: { [Op.between]: [startOfMonth, endOfMonth] } };
    const whereServiceAll = { tenant_id: tenantId };
    const whereServiceActive = { tenant_id: tenantId, status: { [Op.in]: ['Pending', 'In Progress'] } };

    console.log("Fetching stats...");
    const [
      totalCustomers,
      activeDocuments,
      expiringSoon,
      criticalDocuments,
      monthlyPaid,
      monthlyReceivable,
      monthlyCost,
      activeServiceOrders,
      serviceCounts,
      wallets
    ] = await Promise.all([
      Customer.count({ where: { tenant_id: tenantId, is_active: true } }),
      Document.count({ where: whereDoc }),
      Document.count({ where: { ...whereDoc, expiry_date: { [Op.between]: [new Date(), thirtyDaysFromNow] } } }),
      Document.count({ where: { ...whereDoc, expiry_date: { [Op.between]: [new Date(), sevenDaysFromNow] } } }),
      Invoice.sum('total', { where: whereInvoicePaid }),
      Invoice.sum('total', { where: whereInvoiceAll }),
      Expense.sum('amount', { where: whereExpense }),
      ServiceOrder.count({ where: whereServiceActive }),
      ServiceOrder.findAll({
        where: whereServiceAll,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status']
      }),
      WalletAccount.findAll({
        where: { tenant_id: tenantId, is_active: true },
        attributes: ['id', 'name', 'balance', 'currency']
      })
    ]);

    console.log("Stats results:", {
      totalCustomers,
      activeDocuments,
      expiringSoon,
      criticalDocuments,
      monthlyPaid,
      monthlyReceivable,
      monthlyCost,
      activeServiceOrders,
      serviceCounts: serviceCounts.map(s => s.toJSON()),
      wallets: wallets.map(w => w.toJSON())
    });

    console.log("Fetching recent activity...");
    const thirtyDaysFromNowEnd = new Date();
    thirtyDaysFromNowEnd.setDate(thirtyDaysFromNowEnd.getDate() + 30);
    thirtyDaysFromNowEnd.setHours(23, 59, 59, 999);

    const [recentInvoices, expiringDocuments, recentServices] = await Promise.all([
      Invoice.findAll({
        limit: 5,
        where: { tenant_id: tenantId },
        order: [['created_at', 'DESC']],
        include: [{ model: Customer, attributes: ['name', 'phone_whatsapp'] }]
      }),
      Document.findAll({
        where: { tenant_id: tenantId, expiry_date: { [Op.lte]: thirtyDaysFromNowEnd } },
        order: [['expiry_date', 'ASC']],
        include: [
          { model: Customer, attributes: ['name', 'phone_whatsapp'] },
          { model: DocumentType, attributes: ['name'] }
        ]
      }),
      ServiceOrder.findAll({
        limit: 5,
        where: { tenant_id: tenantId, status: { [Op.in]: ['Pending', 'In Progress'] } },
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, attributes: ['name'] },
          { model: ServiceType, attributes: ['name'] }
        ]
      })
    ]);

    console.log("Recent activity results:", {
      recentInvoicesCount: recentInvoices.length,
      expiringDocumentsCount: expiringDocuments.length,
      recentServicesCount: recentServices.length
    });

    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}

test();
