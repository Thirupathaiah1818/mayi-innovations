const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tirupspk417@gmail.com",
    pass: "kgei eohm gjkv xqsx" // your 16-digit App Password
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Transporter not working:", error);
  } else {
    console.log("✅ Transporter is ready:", success);
  }
});

transporter.sendMail({
  from: "tirupspk417@gmail.com",
  to: "yourmail@example.com", // change to your real inbox
  subject: "Test Email",
  text: "This is a test mail from Node.js"
}, (error, info) => {
  if (error) {
    console.error("❌ Email Error:", error);
  } else {
    console.log("✅ Email sent:", info.response);
  }
});
