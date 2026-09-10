const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');
const { checkUserLimit } = require('../middleware/limit.middleware');
const docUpload = require('../middleware/upload.middleware');

// Apply protection to all user routes
router.use(protect);

router.get('/', requirePermission('settings', 'read'), userController.getUsers);
router.get('/:id', requirePermission('settings', 'read'), userController.getUserById);
router.post('/', requirePermission('settings', 'write'), checkUserLimit, userController.createUser);
router.put('/:id', requirePermission('settings', 'write'), userController.updateUser);
router.delete('/:id', requirePermission('settings', 'write'), userController.deleteUser);
router.post('/:id/avatar', requirePermission('settings', 'write'), userController.upload.single('avatar'), userController.uploadAvatar);

// Staff Documents
router.post('/:id/documents', requirePermission('settings', 'write'), docUpload.single('file'), userController.addStaffDocument);
router.put('/:id/documents/:docId', requirePermission('settings', 'write'), docUpload.single('file'), userController.updateStaffDocument);
router.delete('/:id/documents/:docId', requirePermission('settings', 'write'), userController.deleteStaffDocument);

module.exports = router;
