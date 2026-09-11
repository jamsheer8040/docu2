const cron = require('node-cron');
const { createBackup, cleanOldBackups } = require('../utils/backup.util');

function startDatabaseBackupCron() {
  // Schedule: 02:00 AM UAE Time (Asia/Dubai) every night
  const scheduleExpr = '0 2 * * *';
  
  console.log('[DatabaseBackupCron] Initialized - Scheduled for 02:00 AM UAE Time daily (7-day retention).');

  cron.schedule(scheduleExpr, async () => {
    const uaeTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' });
    console.log(`[DatabaseBackupCron] Starting nightly backup at ${uaeTime} UAE Time...`);
    try {
      const result = await createBackup();
      console.log(`[DatabaseBackupCron] Nightly backup SUCCESS: ${result.filename} (${result.sizeFormatted}). Deleted ${result.cleanedOldBackups} file(s) >7 days old.`);
    } catch (err) {
      console.error('[DatabaseBackupCron] Nightly backup FAILED:', err.message, err.stack);
    }
  }, {
    timezone: 'Asia/Dubai'
  });
}

module.exports = { startDatabaseBackupCron };
