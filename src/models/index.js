const User = require('./user.model');
const Workspace = require('./workspace.model');
const WorkspaceMember = require('./workspacemember.model');

// ========== ASSOCIATIONS ========== //

// A User can have many Workspaces they own
User.hasMany(Workspace, {
  foreignKey: 'ownerId',
  as: 'ownedWorkspaces',
});

// A Workspace belongs to a single User (owner)
Workspace.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
  onDelete: 'CASCADE',
});

// A Workspace has many members
Workspace.hasMany(WorkspaceMember, {
  foreignKey: 'workspaceId',
  as: 'members',
  onDelete: 'CASCADE',
});

// A WorkspaceMember belongs to a Workspace
WorkspaceMember.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
});

// A User can be in many WorkspaceMembers
User.hasMany(WorkspaceMember, {
  foreignKey: 'userId',
  as: 'memberOf',
});

// A WorkspaceMember belongs to a User
WorkspaceMember.belongsTo(User, {
  foreignKey: 'userId',
});

// // A Workspace can have many Pages (if page model exists)
// Workspace.hasMany(Page, {
//   foreignKey: 'workspaceId',
//   as: 'pages',
// });

module.exports = {
  User,
  Workspace,
  WorkspaceMember,
};
