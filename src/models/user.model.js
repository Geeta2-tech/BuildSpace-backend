const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        theme: 'light',
        language: 'en',
        notifications: true
      }
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  User.associate = (models) => {
    // Owned workspaces
    User.hasMany(models.Workspace, {
      foreignKey: 'owner_id',
      as: 'ownedWorkspaces'
    });

    // Workspace memberships (many-to-many)
    User.belongsToMany(models.Workspace, {
      through: 'workspace_members',
      foreignKey: 'user_id',
      otherKey: 'workspace_id',
      as: 'workspaces'
    });

    // Created pages
    User.hasMany(models.Page, {
      foreignKey: 'created_by',
      as: 'createdPages'
    });

    // Updated pages
    User.hasMany(models.Page, {
      foreignKey: 'updated_by',
      as: 'updatedPages'
    });

    // Created blocks
    User.hasMany(models.Block, {
      foreignKey: 'created_by',
      as: 'createdBlocks'
    });

    // Comments
    User.hasMany(models.Comment, {
      foreignKey: 'author_id',
      as: 'comments'
    });

    // Activities
    User.hasMany(models.Activity, {
      foreignKey: 'user_id',
      as: 'activities'
    });

    // Files uploaded
    User.hasMany(models.File, {
      foreignKey: 'uploaded_by',
      as: 'uploadedFiles'
    });

    // Templates created
    User.hasMany(models.Template, {
      foreignKey: 'created_by',
      as: 'createdTemplates'
    });

    // Databases created
    User.hasMany(models.Database, {
      foreignKey: 'created_by',
      as: 'createdDatabases'
    });

    // Permissions
    User.hasMany(models.Permission, {
      foreignKey: 'user_id',
      as: 'permissions'
    });

    // Permissions granted by user
    User.hasMany(models.Permission, {
      foreignKey: 'granted_by',
      as: 'grantedPermissions'
    });
  };

  return User;
};