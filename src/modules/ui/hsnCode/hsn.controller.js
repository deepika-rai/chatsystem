import path from "path";
import xlsx from "xlsx";
import { ProductCategory, HsnCode, UN_DB } from "../../../models/index.js";
import { handleErrorUi } from "../../../utils/errorHandlerUi.js";
import { Op } from "sequelize";

class HsnController {

  async list(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      return res.render("pages/admin/hsnCode");
    } catch (err) {
      return handleErrorUi(res, err, "HsnController.list");
    }
  }

  async search(req, res) {
    try {

      const q = req.query.q || "";
      if (!q) return res.json([]);
      
      const results = await HsnCode.findAll({
        attributes: ["id", "hsn_code", "description"],
        where: {
          [Op.or]: [
            { hsn_code: { [Op.like]: `%${q}%` } },
            { description: { [Op.like]: `%${q}%` } }
          ]
        },
        limit: 10
      });
      return res.json(results);

    } catch (error) {
      throw error;
      console.error("HSN Search Error:", error);
      return res.status(500).json({ message: "Error fetching results" });
    }
  }

  async ajaxList(req, res) {
    try {
      const { start = 0, length = 10, search = { value: "" } } = req.body;

      // Base condition (non-deleted)
      const baseWhere = { is_deleted: 0 };

      // Filter condition (when search applied)
      const where = {
        ...baseWhere,
        ...(search.value
          ? {
            [Op.or]: [
              { hsn_code: { [Op.like]: `%${search.value}%` } },
              { description: { [Op.like]: `%${search.value}%` } },
              { '$category.name$': { [Op.like]: `%${search.value}%` } },
            ],
          }
          : {}),
      };

      // Get filtered data and count (with pagination)
      const { count: filteredCount, rows } = await HsnCode.findAndCountAll({
        attributes: ['id', 'hsn_code', 'status', 'description'],
        where,
        include: [
          {
            model: ProductCategory,
            as: 'category',
            attributes: ['name'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        offset: parseInt(start),
        limit: parseInt(length),
      });

      // Get total count (without search filter)
      const totalCount = await HsnCode.count({
      });


      // Send both total & filtered counts
      return res.json({
        draw: req.body.draw,
        recordsTotal: totalCount,     // total in DB (e.g., 1306)
        recordsFiltered: filteredCount, // filtered count (after search)
        data: rows,
      });
    } catch (err) {
      console.error('HSN AJAX Error:', err);
      return res.status(500).json({ error: 'Failed to fetch HSN data' });
    }
  }


  async updateStatus(req, res, next) {
    try {
      await HsnCode.update(
        { status: req.body.status },
        { where: { id: req.params.id } }
      );
      res.json({ message: "Status updated" });

    } catch (err) {
      return handleErrorUi(res, err, "HsnController.updateStatus");
    }
  }

  async delete(req, res, next) {
    try {
      await HsnCode.update(
        { is_deleted: 1 },
        { where: { id: req.params.id } }
      );
      req.flash("success", 'HSN Code Deleted Suceessfully!');
      return res.redirect('/hsn-code/list');
    } catch (err) {
      return handleErrorUi(res, err, "HsnController.delete");
    }
  }

  async add(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const parent_categories = await ProductCategory.findAll({
        attributes: ["id", "name"],
        where: {
          is_deleted: 0,
          status: 1
        }
      });

      return res.render("pages/admin/addHsnCode", {parent_categories});

    }
    catch (err) {
      return handleErrorUi(res, err, "HsnController.list");
    }
  }

  async edit(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const { id } = req.params;
      const edit = await UN_DB.findOne({ id }, HsnCode);
       const parent_categories = await ProductCategory.findAll({
        attributes: ["id", "name"],
        where: {
          is_deleted: 0,
          status: 1
        }
      });

      return res.render("pages/admin/editHsnCode", { id, edit, parent_categories });

    }
    catch (err) {
      return handleErrorUi(res, err, "HsnController.list");
    }
  }

  async create(req, res) {
    try {

      const { hsn_code, status, category, description } = req.body;

      // Basic validation
      if (!hsn_code || !status || !category) {
        req.flash("error", "HSN Code, Category and Status are required!");
        return res.redirect("/hsn-code/list");
      }

      // Create new HSN Code
      await HsnCode.create({
        hsn_code: hsn_code,
        category_id: category,
        description,
        status
      });

      req.flash("success", "HSN Code added successfully!");
      return res.redirect("/hsn-code/list");

    } catch (err) {
      return handleErrorUi(res, err, "HsnController.create");
    }
  }

  async update(req, res) {
    try {

      const { hsn_code, status, category, id, description } = req.body;

      // Basic validation (optional)
      if (!hsn_code || !status || !category) {
        req.flash("error", "HSN Code, Category and Status are required!");
        return res.redirect("/hsn-code/list");
      }

      // Update new HSN Code
      await HsnCode.update(
        {
          hsn_code: hsn_code,
          category_id: category,
          description,
          status
        },
        { where: { id } }
      );

      req.flash("success", "HSN Code updated successfully!");
      return res.redirect("/hsn-code/list");

    } catch (err) {
      throw err;
      return handleErrorUi(res, err, "HsnController.update");
    }
  }

  async importXlsxToDB(req, res) {
    try {
      const filePath = path.join("public/assets/hsn_code.xlsx");
      const workbook = xlsx.readFile(filePath);

      const sheetName = workbook.SheetNames[0];
      const excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
        raw: false,
      });

      // Prepare bulk data array
      const insertData = excelData.map((row) => ({
        hsn_code: (row.code || row.hsn_code || "").replace(/\s+/g, ""),
        description: row.description || ""
      }));

      // Perform bulk insert
      await HsnCode.bulkCreate(insertData, {
        ignoreDuplicates: true
      });

      res.json({
        success: true,
        message: `Successfully imported ${insertData.length} records.`,
      });

    } catch (error) {
      console.error("Error importing Excel data:", error);
      res.status(500).json({
        success: false,
        message: "Error importing Excel data",
        error: error.message,
      });
    }
  }

}

export default HsnController;
