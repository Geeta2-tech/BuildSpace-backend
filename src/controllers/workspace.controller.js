const workspaceService = require('../services/workspace.service');

// ----------------------- CREATE WORKSPACE -----------------------
const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

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
    const userId = req.user.id;
    const { owned, shared } = await workspaceService.getUserWorkspaces(userId);

    // Also return the current user's ID for frontend context
    res.json({ owned, shared, currentUserId: userId });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch workspaces', details: err.message });
  }
};

// ----------------------- RENAME WORKSPACE -----------------------
const renameWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.query; // Changed to req.query for RESTful routes
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
    const { workspaceId } = req.query; // Changed to req.query
    const userId = req.user.id;

    const deleted = await workspaceService.deleteWorkspace(workspaceId, userId);
    if (!deleted)
      return res
        .status(403)
        .json({ error: 'Not authorized or workspace not found' });

    res.status(204).send(); // 204 No Content is more appropriate for a successful delete
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to delete workspace', details: err.message });
  }
};

// ----------------------- INVITE MEMBERS -----------------------
const inviteMembers = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const { members, message } = req.body; // Expect members array and an optional message
    const currentUserId = req.user.id;

    const results = await workspaceService.inviteWorkspaceMembers(
      workspaceId,
      members,
      message,
      currentUserId
    );

    res.status(200).json(results);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to send invitations', details: err.message });
  }
};

// ----------------------- REMOVE MEMBER -----------------------
const removeMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.query; // Changed to req.query
    const currentUserId = req.user.id;

    const removed = await workspaceService.removeWorkspaceMember(
      workspaceId,
      userId,
      currentUserId
    );

    if (!removed)
      return res
        .status(403)
        .json({ error: 'Not authorized or member not found' });

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
    const { workspaceId } = req.query; // Changed to req.query
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

// ----------------------- GET PENDING INVITATIONS -----------------------
const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitations = await workspaceService.getPendingInvitations(userId);
    res.json(invitations);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch invitations', details: err.message });
  }
};

// ----------------------- ACCEPT INVITATION -----------------------
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const result = await workspaceService.acceptWorkspaceInvitation(
      token,
      userId
    );
    res.json(result);
  } catch (err) {
    res
      .status(400)
      .json({ error: 'Failed to accept invitation', details: err.message });
  }
};

// ----------------------- DECLINE INVITATION -----------------------
const declineInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const result = await workspaceService.declineWorkspaceInvitation(
      token,
      userId
    );
    res.json(result);
  } catch (err) {
    res
      .status(400)
      .json({ error: 'Failed to decline invitation', details: err.message });
  }
};

const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.query; // Changed to req.query
    const invitation = await workspaceService.getInvitationDetails(token);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json(invitation);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch invitation details',
      details: err.message,
    });
  }
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  inviteMembers,
  removeMember,
  getMembers,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getInvitationDetails,
};
