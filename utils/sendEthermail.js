import axios from "axios";

const ETHERMAIL_API_URL =
  "https://hub-gateway.ethermail.io/v1/transactional-emails";

export const sendTransactionalEmail = async ({
  senderName,
  senderEmail,
  toName,
  toEmail,
  subject,
  htmlContent,
  cc,
  bcc,
  mergeData = {},
}) => {
  if (
    !senderName ||
    !senderEmail ||
    !toName ||
    !subject ||
    !toEmail ||
    !htmlContent ||
    !mergeData
  ) {
    throw new Error("Missing required fields!");
  }

  const payload = {
    sender_name: senderName,
    sender_email: senderEmail,
    to_name: toName,
    to_email: toEmail,
    cc: cc,
    bcc: bcc,
    subject,
    html: htmlContent,
    merge_data: mergeData,
  };

  try {
    const response = await axios.post(ETHERMAIL_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ETHERMAIL_API_KEY,
        "x-api-secret": process.env.ETHERMAIL_API_SECRET,
      },
    });

    return response.data;
  } catch (err) {
    console.error(
      "Failed to send EtherMail:",
      err.response?.data || err.message
    );

    throw err;
  }
};
