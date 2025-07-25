const pageService = require('../services/page.service');

// ----------------------- CREATE PAGE -----------------------
const createPage = async (req, res) => {
  try {
    const { title, workspaceId, parentPageId } = req.body;
    const createdBy = req.user.id;

    const page = await pageService.createPage(
      title,
      workspaceId,
      createdBy,
      parentPageId
    );
    if (!page) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.status(201).json(page);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to create page', details: err.message });
  }
};

// ----------------------- GET PAGES IN WORKSPACE -----------------------
const getPagesInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    const pages = await pageService.getPagesInWorkspace(workspaceId);
    res.json({ pages });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch pages', details: err.message });
  }
};

// ----------------------- GET PAGE BY ID -----------------------
const getPageById = async (req, res) => {
  try {
    const { pageId } = req.query;

    const page = await pageService.getPageById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    res.json(page);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch page', details: err.message });
  }
};

// ----------------------- UPDATE PAGE -----------------------
const updatePage = async (req, res) => {
  try {
    const { pageId } = req.query;
    const { title } = req.body;
    const userId = req.user.id;

    const updatedPage = await pageService.updatePageTitle(
      pageId,
      title,
      userId
    );
    if (!updatedPage)
      return res.status(403).json({ error: 'Not allowed or page not found' });

    res.json(updatedPage);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to update page', details: err.message });
  }
};

// ----------------------- DELETE PAGE -----------------------
const deletePage = async (req, res) => {
  try {
    const { pageId } = req.query;
    const userId = req.user.id;

    const deleted = await pageService.deletePage(pageId, userId);
    if (!deleted)
      return res.status(403).json({ error: 'Not allowed or page not found' });

    res.json({ message: 'Page deleted' });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to delete page', details: err.message });
  }
};

module.exports = {
  createPage,
  getPagesInWorkspace,
  getPageById,
  updatePage,
  deletePage,
};
