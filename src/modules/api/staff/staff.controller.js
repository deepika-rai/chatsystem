import { UN_DB_CONNECTION, User } from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { handleError } from "../../../utils/errorHandler.js";

const sequelize = UN_DB_CONNECTION;

class StaffController {

  // Start a transaction
  async _transaction() {
    return await sequelize.transaction();
  }

  // Check if mobile number exists (exclude optional id for updates)
  async _checkMobileExists(phone, excludeId = null, transaction = null) {
    const whereClause = { phone };
    if (excludeId) whereClause.id = { [Op.ne]: excludeId };

    return await User.findOne({ where: whereClause, transaction });
  }

  // --- CONTROLLER METHODS ---

  // Add new team
  async add(req, res) {
    const t = await this._transaction();
    try {
      const { name, phone, address } = req.validatedBody;
      const user_id = req.user.userId;

      // Check mobile uniqueness
      if (await this._checkMobileExists(phone, null, t)) {
        await t.rollback();
        return res.status(400).json({ status: false, message: "This mobile number is already registered." });
      }

      await User.create({ name, phone, geoLocation: address, parentId: user_id }, { transaction: t });
      await t.commit();

      return res.status(200).json({ status: true, message: "Team added successfully!" });
    } catch (err) {
      await t.rollback();
      return handleError(res, err, "StaffController.add");
    }
  }

  // Update existing team
  async update(req, res) {
    const t = await this._transaction();
    try {
      const { name, phone, address } = req.validatedBody;
      const { id } = req.params;
      const user_id = req.user.userId;

      // Check mobile uniqueness excluding current record
      if (await this._checkMobileExists(phone, id, t)) {
        await t.rollback();
        return res.status(400).json({ status: false, message: "This mobile number is already registered." });
      }

      const [updated] = await User.update(
        { name, phone, geoLocation: address },
        { where: { id, parentId: user_id }, transaction: t }
      );

      if (!updated) {
        await t.rollback();
        return res.status(404).json({ status: false, message: "Team not found" });
      }

      await t.commit();
      return res.status(200).json({ status: true, message: "Team updated successfully!" });
    } catch (err) {
      await t.rollback();
      return handleError(res, err, "StaffController.update");
    }
  }

  // List User with pagination
  async list(req, res) {
    try {
      const user_id = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { rows, count } = await User.findAndCountAll({
        where: { parentId: user_id, is_deleted: 0 },
        attributes: ["id", "name", "phone", "geoLocation"],
        order: [["id", "DESC"]],
        limit,
        offset,
      });

      return res.status(200).json({
        status: true,
        data: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      });
    } catch (err) {
      return handleError(res, err, "StaffController.list");
    }
  }

  // Delete a team
  async delete(req, res) {
    const t = await this._transaction();
    try {
      const { id } = req.params;
      const user_id = req.user.userId;

      // Check if team exists under this user
      const team = await User.findOne({
        where: { id, parentId: user_id, is_deleted: 0 },
        transaction: t
      });

      if (!team) {
        await t.rollback();
        return res.status(404).json({ status: false, message: "Team not found" });
      }

      // Soft delete instead of destroy
      await team.update(
        { is_deleted: 1 }, // assuming you have these fields
        { transaction: t }
      );

      await t.commit();
      return res.status(200).json({ status: true, message: "Team deleted successfully" });
    } catch (err) {
      await t.rollback();
      return handleError(res, err, "StaffController.delete");
    }
  }
}

export default StaffController;
