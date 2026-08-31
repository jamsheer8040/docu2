'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Document, Customer, SystemConfig } = require('../models');
const { sendTemplateEmail } = require('../utils/email.service');

/**
 * Daily cron: runs at 8:00 AM every day
 * Checks for documents expiring in 30, 15, or 7 days and sends reminder emails
 */
function startDocumentReminderCron() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[DocumentReminderCron] Starting document expiry check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reminderDays = [30, 15, 7];

      for (const days of reminderDays) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Find documents expiring on this exact date (with customer email)
        const docs = await Document.findAll({
          where: {
            expiry_date: targetDateStr
          },
          include: [
            { model: Customer, attributes: ['id', 'name', 'email', 'tenant_id'] }
          ]
        });

        for (const doc of docs) {
          const customer = doc.Customer;
          if (!customer || !customer.email) continue;

          // Check if auto-reminders are enabled for this tenant
          const autoEnabled = await SystemConfig.findOne({
            where: { tenant_id: customer.tenant_id, key: 'email_auto_document_reminder' }
          });
          if (!autoEnabled || autoEnabled.value !== 'true') continue;

          const result = await sendTemplateEmail({
            tenantId: customer.tenant_id,
            to: customer.email,
            templateType: 'document_reminder',
            data: {
              customer_name: customer.name,
              document_name: doc.title || doc.document_type || 'Document',
              expiry_date: targetDateStr,
              days_remaining: days
            }
          });

          if (result.success) {
            console.log(`[DocumentReminderCron] Reminder sent to ${customer.email} for doc ${doc.id} (${days} days)`);
          }
        }
      }
      console.log('[DocumentReminderCron] Check complete.');
    } catch (err) {
      console.error('[DocumentReminderCron] Error:', err.message);
    }
  });

  console.log('[DocumentReminderCron] Scheduled - runs daily at 08:00 AM');
}

module.exports = { startDocumentReminderCron };
