const User = require('./user.model');
const Workspace = require('./workspace.model');
const WorkspaceMember = require('./workspacemember.model');
const Page = require('./page.model');
const Block = require('./block.model');

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

// A Workspace can have many Pages (if page model exists)
Workspace.hasMany(Page, {
  foreignKey: 'workspaceId',
  as: 'pages',
});

// Page belongs to a Workspace
Page.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
  onDelete: 'CASCADE',
});

// User can have many Pages
User.hasMany(Page, {
  foreignKey: 'createdBy',
  as: 'createdPages',
});

// Page belongs to a User (creator)
Page.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'SET NULL',
});

// A Page can have many child pages (self-referencing)
Page.hasMany(Page, {
  foreignKey: 'parentPageId',
  as: 'children',
  onDelete: 'CASCADE',
});

// A Page can belong to a parent page
Page.belongsTo(Page, {
  foreignKey: 'parentPageId',
  as: 'parent',
  onDelete: 'CASCADE',
});

module.exports = {
  User,
  Workspace,
  WorkspaceMember,
  Page,
  Block,
};
