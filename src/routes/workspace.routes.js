const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Workspace
 *   description: Workspace management
 */

/**
 * @swagger
 * /workspace/create:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Awesome Workspace
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *       500:
 *         description: Failed to create workspace
 */
router.post('/create', workspaceController.createWorkspace);

/**
 * @swagger
 * /workspace/get-all:
 *   get:
 *     summary: Get all workspaces of the logged-in user
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns owned and shared workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owned:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workspace'
 *                 shared:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workspace'
 *       500:
 *         description: Failed to fetch workspaces
 */
router.get('/get-all', authMiddleware, workspaceController.getAllWorkspaces);

/**
 * @swagger
 * /workspace/rename:
 *   put:
 *     summary: Rename a workspace (owner only)
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Workspace Name
 *     responses:
 *       200:
 *         description: Workspace renamed successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Failed to rename workspace
 */
router.put('/rename', authMiddleware, workspaceController.renameWorkspace);

/**
 * @swagger
 * /workspace/delete:
 *   delete:
 *     summary: Delete a workspace (owner only)
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       403:
 *         description: Not authorized or workspace not found
 *       500:
 *         description: Failed to delete workspace
 */
router.delete('/delete', authMiddleware, workspaceController.deleteWorkspace);

/**
 * @swagger
 * /workspace/get-all-members:
 *   get:
 *     summary: Get all members of a workspace
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workspace members
 *       403:
 *         description: Not authorized to view members
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Failed to fetch members
 */
router.get('/get-all-members', authMiddleware, workspaceController.getMembers);

/**
 * @swagger
 * /workspace/add-members:
 *   post:
 *     summary: Add a new member to the workspace (owner only)
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [member, admin, viewer, editor]
 *                 example: member
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: User is already a member
 *       403:
 *         description: Not authorized or workspace not found
 *       500:
 *         description: Failed to add member
 */
router.post('/add-members', authMiddleware, workspaceController.addMember);

/**
 * @swagger
 * /workspace/remove-members:
 *   delete:
 *     summary: Remove a member from the workspace (owner only)
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Not authorized or workspace not found
 *       500:
 *         description: Failed to remove member
 */
router.delete(
  '/remove-members',
  authMiddleware,
  workspaceController.removeMember
);

module.exports = router;
