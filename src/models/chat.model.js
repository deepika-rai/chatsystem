export default function (sequelize, DataTypes) {
  return sequelize.define('chats', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    type: { type: DataTypes.ENUM('direct', 'group'), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: true },
    image: { type: DataTypes.TEXT, allowNull: true },
    // "minId_maxId" for 1-to-1 chats; unique so duplicates are impossible
    directKey: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    lastMessage: { type: DataTypes.TEXT, allowNull: true },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'chats',
    timestamps: true
  });
}