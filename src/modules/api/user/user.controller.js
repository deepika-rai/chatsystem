import fs from "fs";
import path from "path";
import { col, literal } from "sequelize";
import {  User } from "../../../models/index.js";
import { handleError } from "../../../utils/errorHandler.js";

class UserController {

  async updateProfile(req, res) {
    try {
      const data = req.validatedBody;

      // Normalize GST number based on applicability
      const gst_number = data.gst_applicable === "Yes" ? data.gst_number : null;

      // Ensure optional fields are handled gracefully
      const geoLocation = data.address || null;
      const name = data.name || null;
      const email = data.email || null;
      const product_type = data.product_type || 0;

      // First update User table
      await User.update(
        { geoLocation, name, email },
        { where: { id: req.user.userId } }
      );
     

      return res.status(200).json({
        status: true,
        message: "User Profile Updated Successfully!"
      });
    } catch (err) {
      return handleError(res, err, "UserController.updateProfile");
    }
  }

  async updateProfileImage(req, res, next) {
    try {
      const id = req.user.userId;
      const updateData = {};

      // 1. Ensure a file was uploaded
      if (!req.file || !req.file.filename) {
        return res.status(400).json({
          status: false,
          message: "Profile image is required."
        });
      }

      // 2. Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      // 4. Fetch existing user
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found."
        });
      }

      // 5. Delete old profile image if exists
      if (user.profile) {
        const oldImagePath = path.join("uploads/profile", user.profile);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // 6. Save new image
      updateData.profile = req.file.filename;
      await User.update(updateData, { where: { id } });

      return res.status(200).json({
        status: true,
        message: "User profile updated successfully."
      });

    } catch (error) {
      return handleError(res, error, "UserController.updateProfileImage");
    }
  }

  async profileDetails(req, res) {
    try {

      const userId = req.user.userId;
      const users = await User.findOne({
        attributes: [
          "id",
          "name",
          "email",
          "phone",
          [literal("CONCAT('http://beta.apnidiary.com/assets/images/userimages/', profile)"), "profile"],
          "geoLocation",
       
        ],

        where: { id: userId },
        raw: true
      });

      // return res.json(users)
      return res.status(200).json({
        status: true,
        users
      });

    } catch (err) {
      return handleError(res, err, "UserController.updateProfile");
    }
  }
  
 

}

export default UserController;
