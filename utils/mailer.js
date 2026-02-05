// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendOtpMail = async (to, otp) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your OTP Code",
//     html: `<h2>${otp}</h2><p>Valid for 5 minutes</p>`,
//   });
// };

import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendOtpMail = async (to, otp) => {
  const email = new Brevo.SendSmtpEmail();

  email.subject = "Your OTP Code";
  email.htmlContent = `<h2>${otp}</h2><p>Valid for 5 minutes</p>`;
  email.sender = {
    name: "MyThanks",
    email: process.env.EMAIL_USER,
  };
  email.to = [{ email: to }];

  try {
    await apiInstance.sendTransacEmail(email);
    console.log("OTP sent via Brevo");
  } catch (err) {
    console.error("Brevo email error:", err.response?.body || err);
    throw err;
  }
};
