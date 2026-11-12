import { User, Greeting, UN_DB_CONNECTION } from "../../../models/index.js";
import { handleError } from "../../../utils/errorHandler.js";
import { literal, Sequelize, Op } from "sequelize";
const sequelize = UN_DB_CONNECTION;

class DashboardController {

  async userDetails(req, res) {
    try {
      const { userId } = req.user;

      const user = await User.findOne({
        attributes: [
          "name",
          "greetingId",
          [literal("CONCAT('http://beta.apnidiary.com/assets/images/userimages/', profile)"), "profile"],
        ],
        include: [
          {
            model: Greeting,
            attributes: ["greetingText"],
            where: { is_deleted: 0 },
            required: false,
          }
        ],
        where: { id: userId },
        raw: true,
        nest: true
      });

      if (!user) {
        return res.status(404).json({ status: false, message: "User not found" });
      }

      let welcome_message = user.greeting?.greetingText || "";
      if (!welcome_message) {
        const randomGreeting = await Greeting.findOne({
          attributes: ["greetingText"],
          where: { is_deleted: 0 },
          order: literal('RAND()'),
          raw: true
        });
        welcome_message = randomGreeting?.greetingText || "";
      }

      return res.status(200).json({
        status: true,
        user_detail: {
          name: user.name,
          profile: user.profile,
          welcome_message
        }
      });

    } catch (err) {
      return handleError(res, err, "DashboardController.userDetails");
    }
  }

  async update(req, res) {
    const t = await sequelize.transaction();
    try {
      const { greetingId } = req.body;
      const user_id = req.user.userId;

      if (!greetingId) {
        await t.rollback();
        return res.status(400).json({
          status: false,
          message: "Greeting message is required",
        });
      }

      // Corrected Sequelize update syntax
      await User.update(
        { greetingId },
        {
          where: { id: user_id },
          transaction: t,
        }
      );

      await t.commit();
      return res.status(200).json({
        status: true,
        message: "Greeting message updated successfully!",
      });
    } catch (err) {
      await t.rollback();
      return handleError(res, err, "DashboardController.update");
    }
  }

  async list(req, res) {
    try {
      const userId = req.user.userId;
      const { fy } = req.query;

      const getFYDates = (fyStr) => {
        if (fyStr) {
          const [startYear, endYear] = fyStr.split("-").map(Number);
          return [new Date(`${startYear}-04-01`), new Date(`${endYear}-03-31`)];
        } else {
          // Default: current FY
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1; // Jan=1
          if (month >= 4) {
            return [new Date(`${year}-04-01`), new Date(`${year + 1}-03-31`)];
          } else {
            return [new Date(`${year - 1}-04-01`), new Date(`${year}-03-31`)];
          }
        }
      };

      const [startDate, endDate] = getFYDates(fy);
      const sumByModel = (Model, column, dateField) =>
        Model.findOne({
          attributes: [[sequelize.fn("SUM", sequelize.col(column)), "total"]],
          where: {
            user_id: userId,
            [dateField]: { [Op.between]: [startDate, endDate] },
          },
          raw: true,
        });



      const [
        report_list,
        receipts,
      ] = await Promise.all([
        User.findAll({ attributes: ["name"], where: { id: userId }, raw: true }),



        getTransactions(Receipts, "amount", "receipt_date", "receipt"),
      ]);



      return res.status(200).json({
        status: true,
        report_list,
        financial_year: fy || `${startDate.getFullYear()}-${endDate.getFullYear()}`,
        
      });
    } catch (err) {
      return handleError(res, err, "DashboardController.list");
    }
  }

}

export default DashboardController;
