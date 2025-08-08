const { Page, Workspace } = require('../models');

const createPage = async (title, workspaceId, createdBy = null, parentPageId = null) => {
  // Ensure workspace exists
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace) return null;

  const page = await Page.create({
    title,
    workspaceId,
    createdBy, // Allow createdBy to be null
    parentPageId,
  });

  return page;
};


const getPagesInWorkspace = async (workspaceId) => {
  const pages = await Page.findAll({
    where: { workspaceId },
    order: [['createdAt', 'DESC']],
  });

  return pages;
};

const getPageById = async (pageId) => {
  const page = await Page.findByPk(pageId);
  return page;
};

const updatePageTitle = async (pageId, title, userId) => {
  const page = await Page.findByPk(pageId);
  if (!page || page.createdBy !== userId) return null;

  page.title = title;
  await page.save();
  return page;
};

const deletePage = async (pageId, userId) => {
  const page = await Page.findByPk(pageId);
  if (!page) return null;

  // Allow deletion if createdBy is null or if createdBy matches the userId
  if (page.createdBy === null || page.createdBy === userId) {
    await page.destroy();
    return true;
  }

  return null;
};


module.exports = {
  createPage,
  getPagesInWorkspace,
  getPageById,
  updatePageTitle,
  deletePage,
};
