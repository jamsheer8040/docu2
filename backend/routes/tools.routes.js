const express = require('express');
const router = express.Router();
const toolsController = require('../controllers/tools.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/auth.middleware');

// Protect all tools routes
router.use(verifyToken);

// CV Maker Routes
router.get('/cvs', requirePermission('tools', 'read'), toolsController.getSavedCvs);
router.get('/cvs/:id', requirePermission('tools', 'read'), toolsController.getSavedCv);
router.post('/cvs', requirePermission('tools', 'write'), toolsController.createSavedCv);
router.put('/cvs/:id', requirePermission('tools', 'write'), toolsController.updateSavedCv);
router.delete('/cvs/:id', requirePermission('tools', 'delete'), toolsController.deleteSavedCv);

module.exports = router;
