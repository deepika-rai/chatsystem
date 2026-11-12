
import { Service, ServiceRequests, ServiceRequestItems, Section, UN_DB, UN_DB_CONNECTION } from "../../../models/index.js";
import { handleErrorUi } from "../../../utils/errorHandlerUi.js";
import { Op, Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Similarity helper ──
// Normalise: lowercase, strip punctuation, collapse spaces
function normaliseName(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Returns true when two service names are considered duplicates:
//   1. One normalised string contains the other, OR
//   2. They share ≥ 50 % of their combined unique words
function areSimilar(a, b) {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const wordsA = new Set(na.split(' ').filter(Boolean));
  const wordsB = new Set(nb.split(' ').filter(Boolean));
  const common = [...wordsA].filter(w => wordsB.has(w)).length;
  const union  = new Set([...wordsA, ...wordsB]).size;
  return union > 0 && (common / union) >= 0.5;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../../../uploads/ser");
class ServiceController {

  async serviceList(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const service_list = await Service.findAll({
        attributes: [
          'id',
          'name',
          'status'
        ],
        where: { deletedAt: null },
        order: [['name', 'DESC']]
      });

      return res.render("pages/admin/services/service", { service_list });
    }
    catch (err) {
      return handleErrorUi(res, err, "ServiceController.list");
    }
  }

  async updateStatus(req, res, next) {
    try {
      await Service.update(
        { status: req.body.status },
        { where: { id: req.params.id } }
      );
      res.json({ message: "Status updated" });
    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.updateStatus");
    }
  }

  async delete(req, res, next) {
    try {
      await Service.update(
        { deletedAt: new Date() },
        { where: { id: req.params.id } }
      );
      req.flash("success", 'Service Deleted Suceessfully!');
      return res.redirect('/service/list');
    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.delete");
    }
  }

  async add(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }
      return res.render("pages/admin/services/addService");

    }
    catch (err) {
      return handleErrorUi(res, err, "ServiceController.list");
    }
  }

  async edit(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const { id } = req.params;
      const edit = await UN_DB.findOne({ id }, Service);
      return res.render("pages/admin/services/editService", { id, edit });

    }
    catch (err) {
      return handleErrorUi(res, err, "ServiceController.list");
    }
  }

  // ── AJAX: check if a name is similar to any existing service ──
  async checkSimilar(req, res) {
    try {
      const { name, excludeId } = req.query;
      if (!name || !name.trim()) {
        return res.json({ similar: false, matches: [] });
      }

      const where = { deletedAt: null };
      if (excludeId) where.id = { [Op.ne]: Number(excludeId) };

      const existing = await Service.findAll({ attributes: ['id', 'name'], where, raw: true });

      const matches = existing
        .filter(s => areSimilar(name.trim(), s.name))
        .map(s => s.name);

      return res.json({ similar: matches.length > 0, matches });
    } catch (err) {
      return res.status(500).json({ similar: false, matches: [] });
    }
  }

  async create(req, res) {
    try {
      const { name, status } = req.body;

      if (!name || !status) {
        req.flash("error", "Name and Status are required!");
        return res.redirect("/service/add");
      }

      // Similarity check — block if a similar service already exists
      const existing = await Service.findAll({ attributes: ['id', 'name'], where: { deletedAt: null }, raw: true });
      const matches = existing.filter(s => areSimilar(name.trim(), s.name)).map(s => s.name);
      if (matches.length > 0) {
        req.flash("error", `A similar service already exists: "${matches.join('", "')}". Please avoid duplicate services.`);
        return res.redirect("/service/add");
      }

      await Service.create({ name, status });
      req.flash("success", "Service added successfully!");
      return res.redirect("/service/list");

    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.create");
    }
  }

  async update(req, res) {
    try {
      const { name, status, id } = req.body;

      if (!name || !status) {
        req.flash("error", "Name and Status are required!");
        return res.redirect("/service/list");
      }

      // Similarity check — exclude the current record from comparison
      const existing = await Service.findAll({
        attributes: ['id', 'name'],
        where: { deletedAt: null, id: { [Op.ne]: Number(id) } },
        raw: true
      });
      const matches = existing.filter(s => areSimilar(name.trim(), s.name)).map(s => s.name);
      if (matches.length > 0) {
        req.flash("error", `A similar service already exists: "${matches.join('", "')}". Please avoid duplicate services.`);
        return res.redirect(`/service/edit/${id}`);
      }

      await Service.update({ name, status }, { where: { id } });
      req.flash("success", "Service updated successfully!");
      return res.redirect("/service/list");

    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.update");
    }
  }

  // SERVICER REQUEST FUNCTION STARTS FROM HERE

  async addServiceRequest(req, res) {
    try {

      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const section = await Section.findAll({
        attributes: ['id', 'name'],
        where: {
          is_deleted: 0,
          status: 1
        },
        order: [['name', 'ASC']]
      });


      const services = await Service.findAll({
        attributes: ['id', 'name'],
        where: {
          deletedAt: null,
          status: 1
        },
        order: [['name', 'ASC']]
      });
      console.log("=services========>", services)

      return res.render("pages/admin/services/addServiceRequest", {
        section,
        services
      });

    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.addServiceRequest");
    }
  }

  async serviceRequestList(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const filters = {
        fromDate: req.query.fromDate || "",
        toDate: req.query.toDate || "",
        requestStatus: req.query.requestStatus || ""
      };
      const baseWhere = { deletedAt: null };

      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.fromDate) || /^\d{4}-\d{2}-\d{2}$/.test(filters.toDate)) {
        baseWhere.createdAt = {};
        if (/^\d{4}-\d{2}-\d{2}$/.test(filters.fromDate)) {
          baseWhere.createdAt[Op.gte] = `${filters.fromDate} 00:00:00`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(filters.toDate)) {
          baseWhere.createdAt[Op.lte] = `${filters.toDate} 23:59:59.999`;
        }
      }

      const where = { ...baseWhere };
      const requestStatuses = ['pending', 'partially_fulfilled', 'fulfilled'];
      if (requestStatuses.includes(filters.requestStatus)) {
        where.reqStatus = filters.requestStatus;
      }

      const service_list = await ServiceRequests.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'file',
          'reqStatus',
          'reqNumber',
          'status',
          'createdAt'
        ],
        include: [
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
        ],
        where,
        order: [['id', 'DESC']]
      });


      const pendingServiceRequest = await ServiceRequests.count({
        where: {
          ...baseWhere,
          reqStatus: 'pending'
        }
      });

      const fulfillServiceRequest = await ServiceRequests.count({
        where: {
          ...baseWhere,
          reqStatus: 'fulfilled'
        }
      });

      const partialServiceRequest = await ServiceRequests.count({
        where: {
          ...baseWhere,
          reqStatus: 'partially_fulfilled'
        }
      });

      const serviceStats = {
        pending: pendingServiceRequest,
        fulfill: fulfillServiceRequest,
        semifill: partialServiceRequest
      };

      return res.render("pages/admin/services/serviceRequest", { service_list, serviceStats, filters });
    }
    catch (err) {
      return handleErrorUi(res, err, "ServiceController.serviceRequestList");
    }
  }

  async createServiceRequest(req, res) {
    let transaction;
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const { name, sectionId, email, phone, comments } = req.body;
      console.log("createServiceRequest====>", req.body)

      // Normalize serviceId(s) into an array regardless of single/multi selection
      const rawServiceIds = Array.isArray(req.body.serviceId)
        ? req.body.serviceId
        : (req.body.serviceId ? [req.body.serviceId] : []);

      if (!name || !sectionId || !phone) {
        req.flash("error", "Name, Section and Phone are required!");
        return res.redirect("/service/add-request");
      }

      if (!rawServiceIds.length) {
        req.flash("error", "Please select at least one service!");
        return res.redirect("/service/add-request");
      }

      // Convert to numbers, drop invalid/NaN values, and remove duplicates
      const serviceIds = [...new Set(
        rawServiceIds
          .map(id => Number(id))
          .filter(id => Number.isInteger(id) && id > 0)
      )];

      if (!serviceIds.length) {
        req.flash("error", "Please select valid services!");
        return res.redirect("/service/add-request");
      }

      transaction = await UN_DB_CONNECTION.transaction();

      const serviceRequest = await ServiceRequests.create({
        name,
        sectionId,
        email: email || null,
        phone,
        comments,
        file: req.file ? req.file.filename : null,
        status: 1,
        deletedAt: null
      }, { transaction });

      // Generate unique request number: DDMMYYSER<id>  e.g. 130826SER3
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const reqNumber = `${dd}${mm}${yy}SER${serviceRequest.id}`;

      await ServiceRequests.update(
        { reqNumber },
        { where: { id: serviceRequest.id }, transaction }
      );

      await ServiceRequestItems.bulkCreate(
        serviceIds.map(serviceId => ({
          serviceRequestId: serviceRequest.id,
          serviceId,
          deletedAt: null
        })),
        { transaction }
      );

      await transaction.commit();

      req.flash(
        "success",
        `Your service request has been submitted successfully! Your request number is ${reqNumber}. Please note this request number for future reference.`
      );
      return res.redirect("/service/request-list");

    } catch (err) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return handleErrorUi(res, err, "ServiceController.createServiceRequest");
    }
  }

  async viewServiceRequest(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }
      console.log("viewServiceRequest========>")

      const requisition = await ServiceRequests.findOne({
        attributes: [
          'id',
          'sectionId',
          'name',
          'email',
          'phone',
          'file',
          'reqStatus',
          'comments',
          'status',
          'createdAt'
        ],
        include: [
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
          {
            model: ServiceRequestItems,
            as: 'items',
            attributes: ['id', 'serviceRequestId', 'serviceId', 'cost', 'billId', 'status'],
            include: [
              {
                model: Service,
                as: 'service',
                attributes: ['id', 'name'],
              },
            ]
          }
        ],
        where: {
          id: req.params.id,
          deletedAt: null
        }
      });

      console.log("viewServiceRequest========>", requisition)

      if (!requisition) {
        req.flash("error", "Service Request not found!");
        return res.redirect("/service/request-list");
      }

      return res.render("pages/admin/services/viewServiceRequest", { requisition });
    } catch (err) {
      console.log("err====>", err)
      return handleErrorUi(res, err, "ServiceController.viewServiceRequest");
    }
  }

  // ==================== ISSUE SERVICE REQUEST ITEMS COST AND STATUS UPDATE ====================
  async issue(req, res) {
    let transaction;
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ status: false, message: "Unauthorized." });
      }

      const service_request_id = req.params.id;
      const { items } = req.body; // [{ itemId, cost, status }]

      if (!items || !items.length) {
        return res.status(400).json({ status: false, message: "No items provided." });
      }

      // Load ServiceRequests with all its items
      const service_request = await ServiceRequests.findOne({
        where: { id: service_request_id, deletedAt: null },
        include: [{
          model: ServiceRequestItems,
          as: 'items',
        }]
      });

      if (!service_request) {
        return res.status(404).json({ status: false, message: "Service request not found." });
      }

      if (service_request.reqStatus === 'fulfilled') {
        return res.status(400).json({ status: false, message: "Service request is already fully fulfilled." });
      }

      // Build a map of service_request items by id for quick lookup
      const itemMap = {};
      service_request.items.forEach(i => { itemMap[i.id] = i; });

      // Validate each submitted item before writing anything
      for (const entry of items) {
        const reqItem = itemMap[entry.itemId];
        if (!reqItem) {
          return res.status(400).json({ status: false, message: `Item ${entry.itemId} not found in this request.` });
        }

        const cost = parseInt(entry.cost, 10);
        if (isNaN(cost) || cost < 0) {
          return res.status(400).json({ status: false, message: `Invalid cost for item ${entry.itemId}.` });
        }

        const status = parseInt(entry.status, 10);
        if (![0, 1, 2].includes(status)) {
          return res.status(400).json({ status: false, message: `Invalid status for item ${entry.itemId}.` });
        }
      }

      transaction = await UN_DB_CONNECTION.transaction();

      // Update cost & status for each item
      for (const entry of items) {
        const reqItem = itemMap[entry.itemId];
        const cost = parseInt(entry.cost, 10) || 0;
        const status = parseInt(entry.status, 10) || 0;

        await ServiceRequestItems.update(
          { cost, status },
          { where: { id: reqItem.id }, transaction }
        );
      }

      // Reload all items to determine overall service request status
      const updatedItems = await ServiceRequestItems.findAll({
        where: { serviceRequestId: service_request_id },
        transaction
      });

      // status = 2 means "Complete" for an item
      const allFulfilled = updatedItems.every(i => (i.status || 0) === 2);
      const anyFulfilled = updatedItems.some(i => (i.status || 0) === 2);
      const newReqStatus = allFulfilled
        ? 'fulfilled'
        : anyFulfilled ? 'partially_fulfilled' : 'pending';

      await ServiceRequests.update(
        { reqStatus: newReqStatus },
        { where: { id: service_request_id }, transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        status: true,
        message: allFulfilled
          ? "Service request fully fulfilled!"
          : "Items updated successfully (partially fulfilled).",
        reqStatus: newReqStatus
      });

    } catch (err) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error("[ServiceController.issue]", err);
      return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    }
  }

  async archivedRequestList(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        req.flash("error", "Unauthorized: Please login first");
        return res.redirect("/");
      }

      const req_list = await ServiceRequests.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'file',
          'reqStatus',
          'reqNumber',
          'status',
          'createdAt'
        ],
        include: [
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
        ],
        where: {
          deletedAt: {
            [Op.ne]: null
          }
        },
        order: [['id', 'DESC']]
      });

      return res.render("pages/admin/services/serviceRequestArchived", { req_list });
    }
    catch (err) {
      return handleErrorUi(res, err, "ServiceController.archivedRequestList");
    }

  }

  async deleteRequest(req, res, next) {
    try {

      await ServiceRequests.update(
        { reqStatus: 'reject', deletedAt: new Date() },
        { where: { id: req.params.id } }
      );

      await ServiceRequestItems.update(
        { deletedAt: new Date() },
        { where: { serviceRequestId: req.params.id } }
      );
      req.flash("success", 'Service Request Rejected successfully!');
      return res.redirect('/service/request-list');
    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.deleteRequest");
    }
  }

  async permanentDelete(req, res, next) {
    try {
      const requisition = await ServiceRequests.findOne({
        attributes: [
          "id",
          "file",
          "reqStatus",
        ],
        where: {
          id: req.params.id,
        },
      });

      if (!requisition) {
        req.flash("error", "ServiceRequests not found or already deleted!");
        return res.redirect("/service/request-list");
      }

      // Delete ServiceRequests Items first
      await ServiceRequestItems.destroy({
        where: {
          serviceRequestId: req.params.id,
        },
      });

      // Delete ServiceRequests
      await ServiceRequests.destroy({
        where: {
          id: req.params.id,
        },
      });

      // Delete uploaded file
      if (requisition.file) {
        const fileName = path.basename(requisition.file);
        const filePath = path.join(uploadDir, fileName);

        console.log("File stored in DB:", requisition.file);
        console.log("Deleting file:", filePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("File deleted successfully");
        } else {
          console.log("File does not exist:", filePath);
        }
      }

      req.flash(
        "success",
        "Service request permanently deleted successfully!"
      );

      return res.redirect("/service/request-list");

    } catch (err) {
      return handleErrorUi(
        res,
        err,
        "ServiceController.permanentDelete"
      );
    }
  }

  async revert(req, res, next) {
    try {
      await ServiceRequests.update(
        { reqStatus: 'pending', deletedAt: null },
        { where: { id: req.params.id } }
      );

      await ServiceRequestItems.update(
        { deletedAt: null },
        { where: { serviceRequestId: req.params.id } }
      );
      req.flash("success", 'Service Request Reverted successfully!');
      return res.redirect('/service/request-list');
    } catch (err) {
      return handleErrorUi(res, err, "ServiceController.delete");
    }
  }


}

export default ServiceController;
