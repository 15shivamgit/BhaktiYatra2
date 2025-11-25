const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendBookingEmail = async ({ to, subject, text, html, attachments }) => {
  await transporter.sendMail({
    from: `"BhaktiYatra" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
};
