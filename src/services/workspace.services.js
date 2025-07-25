const { Workspace, WorkspaceMember, User } = require('../models');

const createWorkspace = async (name, ownerId) => {
  // Create workspace
  const workspace = await Workspace.create({ name, ownerId });

  // Add owner
  await WorkspaceMember.create({
    workspaceId: workspace.id,
    userId: ownerId,
    role: 'owner',
  });

  return workspace;
};

const getUserWorkspaces = async (userId) => {
  // Get owned workspaces
  const owned = await Workspace.findAll({
    where: { ownerId: userId },
    order: [['createdAt', 'DESC']],
  });

  // Get shared workspaces
  const shared = await Workspace.findAll({
    include: {
      model: WorkspaceMember,
      as: 'members',
      where: { userId },
    },
    where: {
      ownerId: { [require('sequelize').Op.ne]: userId },
    },
    order: [['createdAt', 'DESC']],
  });

  return { owned, shared };
};

const renameWorkspace = async (workspaceId, newName, userId) => {
  // Get workspace
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== userId) return null;

  // Update the name of the workspace
  workspace.name = newName;
  await workspace.save();
  return workspace;
};

const deleteWorkspace = async (workspaceId, userId) => {
  // Get workspace
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== userId) return false;

  // Delete the workspace
  await workspace.destroy();
  return true;
};

const addWorkspaceMember = async (
  workspaceId,
  userIdToAdd,
  role,
  currentUserId
) => {
  // Get workspace
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== currentUserId) return null;

  // Check if user is already a member
  const existing = await WorkspaceMember.findOne({
    where: { workspaceId, userId: userIdToAdd },
  });
  if (existing) return 'already_member';

  // Add member
  const member = await WorkspaceMember.create({
    workspaceId,
    userId: userIdToAdd,
    role,
  });

  return member;
};

const removeWorkspaceMember = async (
  workspaceId,
  userIdToRemove,
  currentUserId
) => {
  // Get workspace
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== currentUserId) return null;

  // Remove member
  const removed = await WorkspaceMember.destroy({
    where: { workspaceId, userId: userIdToRemove },
  });

  return removed;
};

const getWorkspaceMembers = async (workspaceId, currentUserId) => {
  // Get workspace
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace) return null;

  // You can restrict access to owner or members if needed
  const isOwnerOrMember = await WorkspaceMember.findOne({
    where: { workspaceId, userId: currentUserId },
  });

  // If not owner or member, return forbidden
  if (!isOwnerOrMember && workspace.ownerId !== currentUserId)
    return 'forbidden';

  // Get members
  const members = await WorkspaceMember.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  return members;
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  getWorkspaceMembers,
};
