import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { User, UN_DB } from "../../../models/index.js";
import { handleError } from "../../../utils/errorHandler.js";
import { sendOTP } from "../../../utils/sendOtp.js";

class AuthController {

  // 1. User Registration
  async userRegistration(req, res) {
    try {
      const data = req.validatedBody;

      // Check duplicates
      const [existingEmail, existingPhone] = await Promise.all([
        User.findOne({ where: { email: data.email } }),
        User.findOne({ where: { phone: data.phone } }),
      ]);

      if (existingEmail) {
        return res.status(400).json({ status: false, message: "Email already registered!" });
      }
      if (existingPhone) {
        return res.status(400).json({ status: false, message: "Phone already registered!" });
      }

      const hash_password = await bcrypt.hash(data.password, 12);

      await User.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        language: data.language,
        geoLocation: data.geoLocation || null,
        role: "customer",
        password: hash_password,
      });

      return res.status(200).json({ status: true, message: "User registered successfully!" });
    } catch (err) {
      return handleError(res, err, "AuthController.userRegistration");
    }
  }

  // 2. Get OTP
  async getOtp(req, res) {
    try {
      // 1. Extract the Joi-validated phone number from the request
      const { phone } = req.validatedBody;

      // 2. Find User
      const user = await UN_DB.findOne({ phone }, User);
      if (!user) {
        return res.status(200).json({
          status: true,
          message: "User Not Found in out Records"
        });
      }

      // 3. Find Existing OTP Record for this mobile number
      const existingOtp = await UN_DB.findOne({ mobile: phone }, Otp);

      // 4. Rate Limiting, Cooldown, and Blocking Logic
      const now = Date.now();
      const COOLDOWN_PERIOD = 30 * 1000;    // 30 seconds between OTP requests (ms)
      const MAX_ATTEMPTS = 15;               // Max 15 OTP requests per hour
      const BLOCK_DURATION = 60 * 60 * 1000; // Block for 1 hour if max attempts reached (ms)

      if (existingOtp) {
        // Check if the number is temporarily blocked
        if (existingOtp.blocked_until && existingOtp.blocked_until > now) {
          const timeLeftMinutes = Math.ceil((existingOtp.blocked_until - now) / 1000 / 60);
          return res.status(429).json({
            status: false,
            message: `Too many attempts. Please try again in ${timeLeftMinutes} minute(s).`,
            retryAfter: timeLeftMinutes * 60
          });
        }

        // Check if the user is requesting before the cooldown period is over
        // Use 'updatedAt' or a dedicated 'last_otp_sent_at' field
        const timeSinceLastOtp = now - existingOtp.updatedAt;
        if (timeSinceLastOtp < COOLDOWN_PERIOD) {
          const timeLeftSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastOtp) / 1000);
          return res.status(429).json({
            status: false,
            message: `Please wait ${timeLeftSeconds} second(s) before requesting a new OTP.`,
            retryAfter: timeLeftSeconds
          });
        }

        // Check if the user has exceeded the maximum allowed OTP requests
        if (existingOtp.mobile_otp_count >= MAX_ATTEMPTS) {
          // Block the number for BLOCK_DURATION and reset the counter for the next period
          const blockedUntil = new Date(now + BLOCK_DURATION);
          await UN_DB.update(
            { mobile_otp_count: 0, blockedUntil },
            { mobile: phone },
            Otp
          );
          return res.status(429).json({
            status: false,
            message: "Too many OTP attempts. This number is temporarily blocked. Please try again in an hour."
          });
        }
      }

      // 5. Generate a cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();

      // 6. Send OTP via SMS using the imported function
      const smsResult = await sendOTP(phone, otp);

      // 7. Handle SMS Gateway Failures
      if (!smsResult.status) {
        // Log the error for debugging
        console.error("SMS Gateway Error:", smsResult.error);
        // Return a user-friendly message, don't expose gateway errors
        return res.status(502).json({ // 502 Bad Gateway
          status: false,
          message: "Failed to send OTP. Please try again shortly."
        });
      }

      // 8. Calculate Expiration Time (1 minutes from now)
      const expirationTime = new Date(now + (1 * 60 * 1000));

      // 9. Create or Update the OTP Record in the Database
      const updateData = {
        mobile_otp: otp,
        mobile_verified: false,
        expires_at: expirationTime,
        blocked_until: null
      };

      if (existingOtp) {
        updateData.mobile_otp_count = (existingOtp.mobile_otp_count || 0) + 1;
        await UN_DB.update(updateData, { mobile: phone }, Otp);
      } else {
        updateData.mobile = phone;
        updateData.mobile_otp_count = 1;
        await UN_DB.create(updateData, Otp);
      }

      // 10. Success Response
      return res.status(200).json({
        status: true,
        message: "OTP sent successfully."
      });

    } catch (err) {
      return handleError(res, err, "AuthController.getOtp");
    }
  }

  // 3. Verify OTP
  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.validatedBody;

      // 1. Find the User
      const user = await UN_DB.findOne({ phone }, User);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found in our records."
        });
      }

      // 2. Find the OTP record
      const otpRecord = await UN_DB.findOne({ mobile: phone }, Otp);

      if (!otpRecord) {
        return res.status(400).json({
          status: false,
          message: "OTP not requested. Please request a new OTP."
        });
      }

      const now = Date.now();
      const expiresAt = new Date(otpRecord.expires_at).getTime();
      // 3. Check expiry
      if (!expiresAt || expiresAt < now) {
        return res.status(400).json({
          status: false,
          message: "OTP has expired. Please request a new one."
        });
      }

      // 4. Check blocked status
      if (otpRecord.blocked_until && otpRecord.blocked_until > now) {
        const timeLeftMinutes = Math.ceil((otpRecord.blocked_until - now) / 1000 / 60);
        return res.status(429).json({
          status: false,
          message: `Too many invalid attempts. Try again in ${timeLeftMinutes} minute(s).`
        });
      }

      // 5. Compare OTP ( should be hashed in production!)
      if (otpRecord.mobile_otp !== otp) {
        const failedAttempts = (otpRecord.failed_attempts || 0) + 1;

        let updateData = { failed_attempts: failedAttempts };

        // If too many failed attempts → block temporarily
        if (failedAttempts >= 5) {
          updateData.blocked_until = new Date(now + 15 * 60 * 1000); // block for 15 minutes
          updateData.failed_attempts = 0; // reset for next cycle
        }

        await UN_DB.update(updateData, { mobile: phone }, Otp);

        return res.status(400).json({
          status: false,
          message: "Invalid OTP. Please try again."
        });
      }

      // 6. OTP valid → mark verified and clean up
      await UN_DB.update(
        {
          mobile_verified: true,
          mobile_otp: null,
          failed_attempts: 0,
          mobile_otp_count: 0,
          expires_at: null,
          blocked_until: null
        },
        { mobile: phone },
        Otp
      );

      // 7. (Optional) Issue JWT or session
      const token = jwt.sign(
        { phone, userId: user.id },
        process.env.JWT_SECRET
      );

      return res.status(200).json({
        status: true,
        message: "OTP verified successfully.",
        token
      });

    } catch (err) {
      return handleError(res, err, "AuthController.verifyOtp");
    }
  }

  // 4. Login (OTP)
  async login(req, res) {
    try {
      const { phone, otp } = req.validatedBody;

      const user = await UN_DB.findOne({ phone }, User);
      if (!user) return res.status(404).json({ status: false, message: "User not found." });

      const otpRecord = await UN_DB.findOne({ mobile: phone }, Otp);
      if (!otpRecord) return res.status(404).json({ status: false, message: "OTP not requested." });

      if (otpRecord.mobile_otp !== otp) {
        return res.status(400).json({ status: false, message: "Invalid OTP." });
      }

      await UN_DB.update({ mobile_verified: true, mobile_otp: null, mobile_otp_count: 0 }, { mobile: phone }, Otp);

      const token = jwt.sign(
        { phone, userId: user.id },
        process.env.JWT_SECRET
      );

      return res.status(200).json({ status: true, message: "Login successful!", accessToken: token });
    } catch (err) {
      return handleError(res, err, "AuthController.login");
    }
  }

  // 5. Resend OTP
  async resendOtp(req, res) {
    try {
      const { phone } = req.validatedBody;

      const user = await UN_DB.findOne({ phone }, User);
      if (!user) return res.status(404).json({ status: false, message: "User not found." });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const result = await sendOTP(phone, otp);
      if (!result.status) {
        return res.status(500).json(result);
      }

      const existingOtp = await UN_DB.findOne({ mobile: phone }, Otp);

      if (existingOtp) {
        await UN_DB.update(
          { mobile_otp: otp, mobile_verified: false, mobile_otp_count: (existingOtp.mobile_otp_count || 0) + 1 },
          { mobile: phone },
          Otp
        );
      } else {
        await UN_DB.create({ mobile: phone, mobile_otp: otp, mobile_verified: false, mobile_otp_count: 1 }, Otp);
      }

      return res.status(200).json({ status: true, message: "OTP resent successfully!" });
    } catch (err) {
      return handleError(res, err, "AuthController.resendOtp");
    }
  }

}

export default AuthController;
