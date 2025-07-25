const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Pages
 *   description: Page management within a workspace
 */

/**
 * @swagger
 * /api/pages/create:
 *   post:
 *     summary: Create a new page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - workspaceId
 *             properties:
 *               title:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               parentPageId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Page created successfully
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Server error
 */
router.post('/create', authMiddleware, pageController.createPage);

/**
 * @swagger
 * /api/pages/get-all:
 *   get:
 *     summary: Get all pages in a workspace
 *     tags: [Pages]
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
 *         description: List of pages
 *       500:
 *         description: Server error
 */
router.get('/get-all', authMiddleware, pageController.getPagesInWorkspace);

/**
 * @swagger
 * /api/pages/get-by-id:
 *   get:
 *     summary: Get a page by its ID
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page data
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/get-by-id', authMiddleware, pageController.getPageById);

/**
 * @swagger
 * /api/pages/update:
 *   put:
 *     summary: Update a page title
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Page updated
 *       403:
 *         description: Not allowed or page not found
 *       500:
 *         description: Server error
 */
router.put('/update', authMiddleware, pageController.updatePage);

/**
 * @swagger
 * /api/pages/delete:
 *   delete:
 *     summary: Delete a page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page deleted
 *       403:
 *         description: Not allowed or page not found
 *       500:
 *         description: Server error
 */
router.delete('/delete', authMiddleware, pageController.deletePage);

module.exports = router;
