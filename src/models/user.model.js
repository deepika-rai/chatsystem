import { Sequelize } from 'sequelize';

export default function (sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    geoLocation: {
      type: DataTypes.STRING(255)
    },
    parentId: {
      type: DataTypes.INTEGER
    },
    greetingId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING
      // unique: true
    },
    phone: {
      type: DataTypes.BIGINT,
      unique: true
    },
    password: {
      type: DataTypes.TEXT
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff', 'customer'),
      defaultValue: 'staff'
    },
    language: {
      type: DataTypes.ENUM('English', 'Hindi'),
      defaultValue: 'English'
    },
    profile: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    is_deleted: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
      comment: '1 => deleted, 0 => not deleted'
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }]
      }
      // {
      //   name: "email_unique",
      //   unique: true,
      //   using: "BTREE",
      //   fields: [{ name: "email" }]
      // }
    ]
  });
}
