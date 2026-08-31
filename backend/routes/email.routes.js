'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const emailCtrl = require('../controllers/email.controller');

// All routes require authentication
router.use(verifyToken);

// SMTP Settings
router.get('/smtp', emailCtrl.getSmtpSettings);
router.post('/smtp', emailCtrl.saveSmtpSettings);
router.post('/smtp/test', emailCtrl.testSmtp);

// Templates
router.get('/templates', emailCtrl.getTemplates);
router.post('/templates', emailCtrl.upsertTemplate);
router.delete('/templates/:id', emailCtrl.deleteTemplate);

// Send
router.post('/send', emailCtrl.sendManual);
router.post('/send-template', emailCtrl.sendTemplate);

// Logs
router.get('/logs', emailCtrl.getLogs);

module.exports = router;
