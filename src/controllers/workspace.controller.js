const workspaceService = require('../services/workspace.service');

// ----------------------- CREATE WORKSPACE -----------------------
const createWorkspace = async (req, res) => {
  try {
    // Workspace name and user id
    const { name } = req.body;
    const {userId} = req.body;

    const workspace = await workspaceService.createWorkspace(name, userId);
    res.status(201).json(workspace);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to create workspace', details: err.message });
  }
};

// ----------------------- GET ALL WORKSPACES -----------------------
const getAllWorkspaces = async (req, res) => {
  try {
    // User id
    const userId = req.user.id;
    const { owned, shared } = await workspaceService.getUserWorkspaces(userId);

    res.json({ owned, shared });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch workspaces', details: err.message });
  }
};

// ----------------------- RENAME WORKSPACE -----------------------
const renameWorkspace = async (req, res) => {
  try {
    // Workspace id, new name and user id
    const { workspaceId } = req.query;
    const { name } = req.body;
    const userId = req.user.id;

    const updated = await workspaceService.renameWorkspace(
      workspaceId,
      name,
      userId
    );
    if (!updated)
      return res
        .status(403)
        .json({ error: 'Not authorized or workspace not found' });

    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to rename workspace', details: err.message });
  }
};

// ----------------------- DELETE WORKSPACE -----------------------
const deleteWorkspace = async (req, res) => {
  try {
    // Workspace id and user id
    const { workspaceId } = req.query;
    const userId = req.user.id;

    const deleted = await workspaceService.deleteWorkspace(workspaceId, userId);
    if (!deleted)
      return res
        .status(403)
        .json({ error: 'Not authorized or workspace not found' });

    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to delete workspace', details: err.message });
  }
};

// ----------------------- ADD MEMBER -----------------------
const addMember = async (req, res) => {
  try {
    // Workspace id, user id, role and current user id
    const { workspaceId } = req.query;
    const { userId, role } = req.body; // userId = user to add
    const currentUserId = req.user.id;

    const result = await workspaceService.addWorkspaceMember(
      workspaceId,
      userId,
      role,
      currentUserId
    );

    if (!result)
      return res
        .status(403)
        .json({ error: 'Not authorized or workspace not found' });
    if (result === 'already_member')
      return res.status(400).json({ error: 'User is already a member' });

    res.status(201).json({ message: 'Member added', member: result });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to add member', details: err.message });
  }
};

// ----------------------- REMOVE MEMBER -----------------------
const removeMember = async (req, res) => {
  try {
    // Workspace id, user id and current user id
    const { workspaceId, userId } = req.query;
    const currentUserId = req.user.id;

    const removed = await workspaceService.removeWorkspaceMember(
      workspaceId,
      userId,
      currentUserId
    );

    if (!removed)
      return res
        .status(403)
        .json({ error: 'Not authorized or workspace not found' });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to remove member', details: err.message });
  }
};

// ----------------------- GET MEMBERS -----------------------
const getMembers = async (req, res) => {
  try {
    // Workspace id and current user id
    const { workspaceId } = req.query;
    const currentUserId = req.user.id;

    const result = await workspaceService.getWorkspaceMembers(
      workspaceId,
      currentUserId
    );

    if (result === 'forbidden')
      return res.status(403).json({ error: 'Not authorized to view members' });

    if (!result) return res.status(404).json({ error: 'Workspace not found' });

    res.json({ members: result });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch members', details: err.message });
  }
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  getMembers,
};
