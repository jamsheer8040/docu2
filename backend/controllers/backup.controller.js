const path = require('path');
const fs = require('fs');
const backupUtil = require('../utils/backup.util');

exports.getBackups = async (req, res, next) => {
  try {
    const backups = backupUtil.listBackups();
    res.json({
      success: true,
      schedule: {
        time: '02:00 AM',
        timezone: 'Asia/Dubai (UAE Time)',
        retentionDays: 7
      },
      data: backups
    });
  } catch (error) {
    next(error);
  }
};

exports.createBackupManual = async (req, res, next) => {
  try {
    const result = await backupUtil.createBackup();
    res.json({
      success: true,
      message: `Database backup created successfully: ${result.filename}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadBackupFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupUtil.BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    res.download(filePath, safeFilename);
  } catch (error) {
    next(error);
  }
};

exports.deleteBackupFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    backupUtil.deleteBackup(filename);
    res.json({
      success: true,
      message: `Backup file ${filename} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};
