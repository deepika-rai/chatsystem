export default function (sequelize, DataTypes) {
    return sequelize.define('chat_members', {
        id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
        chatId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
        isMuted: { type: DataTypes.BOOLEAN, defaultValue: false },
        lastReadAt: { type: DataTypes.DATE, allowNull: true },
        joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        leftAt: { type: DataTypes.DATE, allowNull: true }
    }, {
        sequelize,
        tableName: 'chat_members',
        timestamps: true,
        indexes: [{ unique: true, fields: ['chatId', 'userId'] }]
    });
}