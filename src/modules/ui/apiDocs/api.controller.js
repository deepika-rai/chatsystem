import path from "path";
import xlsx from "xlsx";
import { Categories, HsnCode, UN_DB } from "../../../models/index.js";
import { handleErrorUi } from "../../../utils/errorHandlerUi.js";
import { Op } from "sequelize";

class ApiController {

  async list(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }
      return res.json("kajal bharti");

      return res.render("pages/admin/hsnCode");
    } catch (err) {
      return handleErrorUi(res, err, "ApiController.list");
    }
  }

}

export default ApiController;
