import {  Greeting } from "../../../models/index.js";
import { handleError } from "../../../utils/errorHandler.js";

class SettingController {


  async greetingList(req, res) {
    try {

      const greetings = await Greeting.findAll({
        attributes: ["id", "greetingText"],
        where: { is_deleted: 0, status: "Active" },
        order: [["createdAt", "DESC"]],
        raw: true
      });

      return res.status(200).json({ status: true, data: greetings });
    } catch (error) {
      console.error("Error fetching item units:", error);
      return res.status(500).json({ status: false, message: "Server error" });
    }
  }

  async otherEntriesCategory(req, res) {
    try {
      const { category } = req.query;

      const whereClause = {};
      if (category) {
        whereClause.category = category.replace(/"/g, '');
      }

      const otherEntries = await OtherEntriesCategory.findAll({
        attributes: ["id", "name", "category"],
        where: whereClause,
        raw: true
      });

      return res.status(200).json({ status: true, data: otherEntries });
    } catch (error) {
      console.error("Error fetching other entries categories:", error);
      return res.status(500).json({ status: false, message: "Server error" });
    }
  }

}

export default SettingController;
