import axios from "axios";

const sender = "REFRLN";

export const sendOTP = async (phone, otp) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      new URLSearchParams({
        sender_id: sender,
        message: "186282",   // DLT template ID
        variables_values: `${otp}`,
        route: "dlt",
        numbers: phone
      }),
      {
        headers: {
          authorization: process.env.free2sms_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (response.data && response.data.return === true) {
      return {
        status: true,
        message: "OTP sent successfully",
        response: response.data
      };
    }

    return {
      status: false,
      message: "Fast2SMS rejected the request",
      error: response.data
    };
  } catch (err) {
    return {
      status: false,
      message: "Error sending OTP",
      error: err.message || err
    };
  }
};
