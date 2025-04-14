import { sendTransactionalEmail } from "../utils/sendEthermail.js";

export const sendBasicEmail = async (req, res, next) => {
  try {
    const { toEmail, toName, subject, htmlContent } = req.body;

    if (!toEmail || !toName || !subject || !htmlContent) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    const result = await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "members@Si3.space",
      toName,
      toEmail,
      subject,
      htmlContent,
      mergeData: {},
    });

    res.status(200).json({
      status: "success",
      message: "Email sent successfully",
      result,
    });
  } catch (err) {
    next(err);
  }
};
