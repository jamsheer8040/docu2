const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  
  // String escaping
  const str = String(val);
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\0/g, '\\0')}'`;
}

/**
 * Creates a database backup file
 */
async function createBackup() {
  ensureBackupDir();

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `docclear_backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'docclear_db',
    multipleStatements: true
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    let sqlDump = [];
    sqlDump.push(`-- ========================================================`);
    sqlDump.push(`-- DocClear Database Backup`);
    sqlDump.push(`-- Generated: ${now.toISOString()} (${now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })} GST)`);
    sqlDump.push(`-- Database: ${dbConfig.database}`);
    sqlDump.push(`-- ========================================================\n`);
    sqlDump.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    sqlDump.push(`SET UNIQUE_CHECKS = 0;`);
    sqlDump.push(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);

    const [tableRows] = await connection.query('SHOW TABLES;');
    const tables = tableRows.map(r => Object.values(r)[0]);

    for (const table of tables) {
      sqlDump.push(`-- --------------------------------------------------------`);
      sqlDump.push(`-- Table structure & data for \`${table}\``);
      sqlDump.push(`-- --------------------------------------------------------`);
      sqlDump.push(`DROP TABLE IF EXISTS \`${table}\`;`);

      const [createRows] = await connection.query(`SHOW CREATE TABLE \`${table}\`;`);
      if (createRows.length > 0) {
        const createStmt = createRows[0]['Create Table'];
        sqlDump.push(`${createStmt};\n`);
      }

      // Fetch table data in chunks
      const [dataRows] = await connection.query(`SELECT * FROM \`${table}\`;`);
      if (dataRows.length > 0) {
        const columns = Object.keys(dataRows[0]).map(col => `\`${col}\``).join(', ');
        
        // Chunk inserts by 100 rows
        const chunkSize = 100;
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const valueStrings = chunk.map(row => {
            const values = Object.values(row).map(escapeSqlValue).join(', ');
            return `(${values})`;
          });

          sqlDump.push(`INSERT INTO \`${table}\` (${columns}) VALUES\n${valueStrings.join(',\n')};`);
        }
        sqlDump.push('');
      }
    }

    sqlDump.push(`SET FOREIGN_KEY_CHECKS = 1;`);
    sqlDump.push(`SET UNIQUE_CHECKS = 1;`);
    sqlDump.push(`-- End of Backup`);

    fs.writeFileSync(filePath, sqlDump.join('\n'), 'utf8');

    await connection.end();

    // Auto clean old backups (> 7 days)
    const cleanedCount = cleanOldBackups(7);

    const stats = fs.statSync(filePath);
    return {
      success: true,
      filename,
      filePath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: stats.mtime,
      cleanedOldBackups: cleanedCount
    };
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    throw error;
  }
}

/**
 * Deletes backup files older than retentionDays (default 7 days)
 */
function cleanOldBackups(retentionDays = 7) {
  ensureBackupDir();
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  const files = fs.readdirSync(BACKUP_DIR);
  for (const file of files) {
    if (file.endsWith('.sql') && file.startsWith('docclear_backup_')) {
      const filePath = path.join(BACKUP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.mtimeMs;
        if (ageMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`[BackupCleanup] Deleted old backup file (${Math.round(ageMs / (1000 * 60 * 60 * 24))} days old): ${file}`);
        }
      } catch (err) {
        console.error(`[BackupCleanup] Failed to check/delete ${file}:`, err.message);
      }
    }
  }

  return deletedCount;
}

/**
 * Lists all available backup files
 */
function listBackups() {
  ensureBackupDir();
  const now = Date.now();
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = [];

  for (const file of files) {
    if (file.endsWith('.sql') && file.startsWith('docclear_backup_')) {
      const filePath = path.join(BACKUP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        const ageDays = Math.floor((now - stats.mtimeMs) / (1000 * 60 * 60 * 24));
        backups.push({
          filename: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.mtime,
          ageDays
        });
      } catch (err) {
        console.error(`[BackupList] Error reading stat for ${file}:`, err.message);
      }
    }
  }

  // Sort by createdAt descending (newest first)
  backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return backups;
}

/**
 * Deletes a specific backup file
 */
function deleteBackup(filename) {
  ensureBackupDir();
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  if (!safeFilename.startsWith('docclear_backup_') || !safeFilename.endsWith('.sql')) {
    throw new Error('Invalid backup filename');
  }

  const filePath = path.join(BACKUP_DIR, safeFilename);
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }

  fs.unlinkSync(filePath);
  return true;
}

module.exports = {
  createBackup,
  cleanOldBackups,
  listBackups,
  deleteBackup,
  BACKUP_DIR
};
