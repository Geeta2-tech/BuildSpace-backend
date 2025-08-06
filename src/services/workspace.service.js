const {
  Workspace,
  WorkspaceMember,
  User,
  WorkspaceInvitation,
} = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const createWorkspace = async (name, ownerId) => {
  const workspace = await Workspace.create({ name, ownerId });
  await WorkspaceMember.create({
    workspaceId: workspace.id,
    userId: ownerId,
    role: 'owner',
  });
  return workspace;
};

const getUserWorkspaces = async (userId) => {
  const owned = await Workspace.findAll({
    where: { ownerId: userId },
    order: [['createdAt', 'DESC']],
  });
  const shared = await Workspace.findAll({
    include: {
      model: WorkspaceMember,
      as: 'members',
      where: { userId },
    },
    where: {
      ownerId: { [Op.ne]: userId },
    },
    order: [['createdAt', 'DESC']],
  });
  return { owned, shared };
};

const renameWorkspace = async (workspaceId, newName, userId) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== userId) return null;
  workspace.name = newName;
  await workspace.save();
  return workspace;
};

const deleteWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== userId) return false;
  await workspace.destroy();
  return true;
};

const inviteWorkspaceMembers = async (
  workspaceId,
  members,
  message,
  currentUserId
) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace || workspace.ownerId !== currentUserId) {
    throw new Error('Unauthorized or workspace not found');
  }

  const results = [];
  for (const { email, role } of members) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      results.push({ email, status: 'user_not_found' });
      continue;
    }

    const isAlreadyMember = await WorkspaceMember.findOne({
      where: { workspaceId, userId: user.id },
    });
    if (isAlreadyMember) {
      results.push({ email, status: 'already_member' });
      continue;
    }

    const existingInvitation = await WorkspaceInvitation.findOne({
      where: {
        workspaceId,
        email,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (existingInvitation) {
      results.push({ email, status: 'invitation_pending' });
      continue;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await WorkspaceInvitation.create({
      workspaceId,
      email,
      role,
      token,
      expiresAt,
    });

    const joinLink = `${process.env.FRONTEND_URL}/join-workspace?token=${token}`;

    await transporter.sendMail({
      from: `"BuildSpace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to join the "${workspace.name}" workspace!`,
      html: `
        <h2>You have been invited to join a workspace on BuildSpace!</h2>
        <p>You've been invited to collaborate in the <strong>${workspace.name}</strong> workspace.</p>
        ${message ? `<p><strong>Message from the inviter:</strong><br/><em>${message}</em></p>` : ''}
        <p>Click the link below to accept the invitation:</p>
        <a href="${joinLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Workspace</a>
        <p><small>This invitation is valid for 7 days.</small></p>
      `,
    });

    results.push({ email, status: 'invitation_sent' });
  }

  return results;
};

const acceptWorkspaceInvitation = async (token, userId) => {
  console.log('Accepting invitation with token (Backend Service):', token);
  const invitation = await WorkspaceInvitation.findOne({
    where: {
      token,
    },
  });

  console.log('Invitation found:', invitation);

  if (!invitation) {
    throw new Error('Invalid or expired invitation token.');
  }

  const user = await User.findByPk(userId);
  if (!user || user.email !== invitation.email) {
    throw new Error('This invitation is for a different user.');
  }

  console.log('User found:', user);

  const isAlreadyMember = await WorkspaceMember.findOne({
    where: {
      workspaceId: invitation.workspaceId,
      userId: user.id,
    },
  });

  if (isAlreadyMember) {
    await invitation.destroy();
    return { status: 'already_member', workspaceId: invitation.workspaceId };
  }

  console.log('Adding user to workspace:', invitation.workspaceId);

  await WorkspaceMember.create({
    workspaceId: invitation.workspaceId,
    userId: user.id,
    role: invitation.role,
  });

  await invitation.destroy();

  return { status: 'success', workspaceId: invitation.workspaceId };
};

// **NEW**: Service to get all pending invitations for a user
const getPendingInvitations = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const invitations = await WorkspaceInvitation.findAll({
    where: {
      email: user.email,
      expiresAt: { [Op.gt]: new Date() },
    },
    // Include workspace details to show in the notification
    include: {
      as: 'workspace',
      model: Workspace,
      attributes: ['name'],
    },
  });

  if (!invitations || invitations.length === 0) {
    return [];
  }

  return invitations;
};

// **NEW**: Service to decline/reject an invitation
const declineWorkspaceInvitation = async (token, userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const invitation = await WorkspaceInvitation.findOne({
    where: {
      token,
      email: user.email, // Ensure the user is declining their own invitation
    },
  });

  if (!invitation) {
    throw new Error(
      'Invitation not found or you are not authorized to decline it.'
    );
  }

  // Simply delete the invitation
  await invitation.destroy();
  return { status: 'declined' };
};

const removeWorkspaceMember = async (workspaceId, userIdToRemove) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace) return null;
  const removed = await WorkspaceMember.destroy({
    where: { workspaceId, userId: userIdToRemove },
  });
  return removed;
};

const getWorkspaceMembers = async (workspaceId, currentUserId) => {
  const isMember = await WorkspaceMember.findOne({
    where: { workspaceId, userId: currentUserId },
  });
  if (!isMember) return 'forbidden';

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

const getInvitationDetails = async (token) => {
  const invitation = await WorkspaceInvitation.findOne({
    where: { token },
  });
  if (!invitation) {
    throw new Error('Invalid or expired invitation token.');
  }
  return {
    workspaceId: invitation.workspaceId,
    email: invitation.email,
  };
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  inviteWorkspaceMembers,
  acceptWorkspaceInvitation,
  getPendingInvitations,
  declineWorkspaceInvitation,
  removeWorkspaceMember,
  getWorkspaceMembers,
  getInvitationDetails,
};
