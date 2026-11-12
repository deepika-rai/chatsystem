
import { Greeting, UN_DB } from "../../../models/index.js";
import { handleErrorUi } from "../../../utils/errorHandlerUi.js";
class StatusController {

  async list(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const status = await Greeting.findAll({
        attributes: [
          'id',
          'greetingText',
          'status'
        ],
        where: { is_deleted: 0 },
        order: [['createdAt', 'DESC']]
      });

      return res.render("pages/admin/greeting", { status });
    }
    catch (err) {
      return handleErrorUi(res, err, "StatusController.list");
    }
  }


  async updateStatus(req, res, next) {
    try {
      await Greeting.update(
        { status: req.body.status },
        { where: { id: req.params.id } }
      );
      res.json({ message: "Status updated"});
    } catch (err) {
      return handleErrorUi(res, err, "StatusController.updateStatus");
    }
  }

  async delete(req, res, next) {
    try {
      await Greeting.update(
        { is_deleted: 1 },
        { where: { id: req.params.id } }
      );
      req.flash("success", 'Greeting Deleted Suceessfully!');
      return res.redirect('/status-upload/list');
    } catch (err) {
      return handleErrorUi(res, err, "StatusController.delete");
    }
  }

  async add(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }
      return res.render("pages/admin/addGreeting");

    }
    catch (err) {
      return handleErrorUi(res, err, "StatusController.list");
    }
  }

  async edit(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const { id } = req.params;
      const edit = await UN_DB.findOne({ id }, Greeting);
      return res.render("pages/admin/editGreeting", { id, edit });

    }
    catch (err) {
      return handleErrorUi(res, err, "StatusController.list");
    }
  }

  async create(req, res) {
    try {
      const { greetingText, status } = req.body;

      // Basic validation
      if (!greetingText || !status) {
        req.flash("error", "Greeting Text and Status are required!");
        return res.redirect("/status-upload/list");
      }

      // Create new Greeting
      await Greeting.create({
        greetingText,
        status
      });

      req.flash("success", "Greeting added successfully!");
      return res.redirect("/status-upload/list");

    } catch (err) {
      return handleErrorUi(res, err, "StatusController.create");
    }
  }

  async update(req, res) {
    try {
      const { greetingText, status, id } = req.body;

      // Basic validation 
      if (!greetingText || !status) {
        req.flash("error", "Greeting Text and Status are required!");
        return res.redirect("/status-upload/list");
      }

      // Update new Greeting
      await Greeting.update(
        {
          greetingText,
          status
        },
        { where: { id } }
      );

      req.flash("success", "Greeting updated successfully!");
      return res.redirect("/status-upload/list");

    } catch (err) {
      return handleErrorUi(res, err, "StatusController.update");
    }
  }

}

export default StatusController;
