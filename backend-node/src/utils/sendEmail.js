import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,           // e.g., smtp.gmail.com
      port: process.env.SMTP_PORT,           // e.g., 587
      secure: false,                         // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,         // your email address
        pass: process.env.SMTP_PASS          // app password or actual password (use env var)
      }
    });

    const mailOptions = {
      from: `"Lost & Found Desk" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};  