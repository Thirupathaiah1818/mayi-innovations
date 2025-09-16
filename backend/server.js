const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://mayiinnovations.info",
    "https://mayiinnovations.info",
    "http://www.mayiinnovations.info",
    "https://www.mayiinnovations.info"
  ]
}));

app.use(express.static(path.join(__dirname, "../frontend")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================= MULTER CONFIG (File Upload) =================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where resumes will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage: storage });

// ================= MYSQL CONNECTION =================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",           // change to your MySQL user
  password: "root"        // change to your MySQL password
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL");

  // Create Database
  db.query("CREATE DATABASE IF NOT EXISTS mayi_innovations", (err) => {
    if (err) throw err;
    console.log("✅ Database ready");

    // Switch to DB
    db.changeUser({ database: "mayi_innovations" }, (err) => {
      if (err) throw err;

      // Create Contacts Table
      const contactsTable = `
        CREATE TABLE IF NOT EXISTS contacts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      db.query(contactsTable, (err) => {
        if (err) throw err;
        console.log("✅ Contacts table ready");
      });

      // Create Careers Table
      const careersTable = `
        CREATE TABLE IF NOT EXISTS careers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fullname VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL,
          phone VARCHAR(15) NOT NULL,
          position VARCHAR(100) NOT NULL,
          experience VARCHAR(50),
          skills VARCHAR(255),
          resume VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      db.query(careersTable, (err) => {
        if (err) throw err;
        console.log("✅ Careers table ready");
      });
    });
  });
});

// ================= CONTACT FORM =================
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const sql = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error("❌ SQL Error (contact):", err);
      return res.status(500).json({ error: "DB insert failed" });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// ================= CAREERS FORM =================
app.post("/api/careers", upload.single("resume"), (req, res) => {
  const { fullname, email, phone, position, experience, skills } = req.body;
  if (!fullname || !email || !phone || !position) {
    return res.status(400).json({ error: "All required fields must be filled" });
  }

  const resumePath = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO careers (fullname, email, phone, position, experience, skills, resume)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [fullname, email, phone, position, experience, skills, resumePath], (err, result) => {
    if (err) {
      console.error("❌ SQL Error (careers):", err);
      return res.status(500).json({ error: "DB insert failed" });
    }
    const mailOptions = {
        from: '"HR Team - MAYIINNOVATIONS" <tirupspk417@gmail.com>',
        to: email,
        subject: `Application Received – ${position} Role`,
        html: `
          <p>Dear <b>${fullname}</b>,</p>

          <p>Thank you for applying for the <b>${position}</b> position at <b> MAYI INNOVATIONS PVT LTD </b>. 
          We truly appreciate the time and effort you put into your application.</p>

          <p>Our recruitment team has successfully received your details and resume. 
          We will carefully review your application against the requirements of the role and our current opportunities.</p>

          <p><b>Next Steps:</b></p>
          <ul>
            <li>Our hiring team will thoroughly evaluate your qualifications, skills, and experience.</li>
            <li>If your profile matches our requirements, we will contact you to discuss further steps in the process.</li>
            <li>Even if you are not shortlisted for this specific role, we may keep your profile in our talent pool for future opportunities.</li>
          </ul>

          <p>We aim to respond within the next <b>7–10 business days</b>, but sometimes it may take a little longer depending on the volume of applications.</p>

          <p>If you have any questions in the meantime, feel free to reach out to us at 
          <a href="mailto:sivanandareddy@mayiinnovations.onmicrosoft.com">careers@MAYI INNOVATIONS PVT LTD.com</a>.</p>

          <p>Once again, thank you for your interest in joining <b> MAYI INNOVATIONS PVT LTD </b>. 
          We wish you the very best of luck with your application process.</p>

          <br/>
          <p>
      Thanks & Regards,<br/>
      <b>Patlo Sivananda Reddy</b><br/>
      Human Resources<br/>
      📞 9036624184<br/>
      ✉️ sivanandareddy@mayiinnovations.onmicrosoft.com
    </p>

    <p>
      <b>MAYI INNOVATIONS Pvt Ltd.</b><br/>
      SANA ELITE, 25, 9th Main Road,<br/>
      Bommanahalli, Bengaluru South,<br/>
      Karnataka, India, 560068
    </p>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Email Error:", error);
        } else {
          console.log("✅ Email sent:", info.response);
        }
      });

      // ==================================================

      res.json({ success: true, id: result.insertId });
    }
  );
});


// ================== ADMIN GET APIs ==================
app.get("/api/contact", (req, res) => {
  db.query("SELECT * FROM contacts ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error("❌ Fetch contacts error:", err);
      return res.status(500).json({ error: "Failed to fetch contacts" });
    }
    res.json(rows);
  });
});

app.get("/api/careers", (req, res) => {
  db.query("SELECT * FROM careers ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error("❌ Fetch careers error:", err);
      return res.status(500).json({ error: "Failed to fetch careers" });
    }
    res.json(rows);
  });
});
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or your SMTP service
  auth: {
    user: "tirupspk417@gmail.com",
    pass: "kgei eohm gjkv xqsx" // ⚠️ use App Password, not your real Gmail password
  }
});

// ================= STATIC FILES (serve resumes) =================
app.use("/uploads", express.static("uploads"));

// app.post("/api/careers", upload.single("resume"), (req, res) => {
//   const { fullname, email, phone, position, experience } = req.body;
//   const skills = Array.isArray(req.body["skills[]"])
//     ? req.body["skills[]"].join(", ")
//     : req.body["skills[]"] || "";
//   const resumeFile = req.file ? req.file.filename : null;

//   const sql = `
//     INSERT INTO careers (fullname, email, phone, position, experience, skills, resume)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;
//   db.query(
//     sql,
//     [fullname, email, phone, position, experience, skills, resumeFile],
//     (err, result) => {
//       if (err) {
//         console.error("❌ SQL Error (careers):", err);
//         return res.json({ success: false, error: "Database error" });
//       }

//       // ================= SEND MAIL =================
//       const mailOptions = {
//         from: '"HR Team - MAYIINNOVATIONS" <tirupspk417@gmail.com>',
//         to: email,
//         subject: `Application Received – ${position} Role`,
//         html: `
//           <p>Dear <b>${fullname}</b>,</p>

//           <p>Thank you for applying for the <b>${position}</b> position at <b>YourCompany</b>. 
//           We truly appreciate the time and effort you put into your application.</p>

//           <p>Our recruitment team has successfully received your details and resume. 
//           We will carefully review your application against the requirements of the role and our current opportunities.</p>

//           <p><b>Next Steps:</b></p>
//           <ul>
//             <li>Our hiring team will thoroughly evaluate your qualifications, skills, and experience.</li>
//             <li>If your profile matches our requirements, we will contact you to discuss further steps in the process.</li>
//             <li>Even if you are not shortlisted for this specific role, we may keep your profile in our talent pool for future opportunities.</li>
//           </ul>

//           <p>We aim to respond within the next <b>7–10 business days</b>, but sometimes it may take a little longer depending on the volume of applications.</p>

//           <p>If you have any questions in the meantime, feel free to reach out to us at 
//           <a href="mailto:sivanandareddy@mayiinnovations.onmicrosoft.com">careers@MAYIINNOVATIONS.com</a>.</p>

//           <p>Once again, thank you for your interest in joining <b>YourCompany</b>. 
//           We wish you the very best of luck with your application process.</p>

//           <br/>
//           <p>Warm regards,</p>
//           <p>Patlo Sivananda Reddy | +91 9036624184,</p>
//           <p><b>HR & Recruitment Team</b><br/>
//           © 2025 MAYI INNOVATIONS Pvt Ltd. All Rights Reserved</p>
//         `
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.error("❌ Email Error:", error);
//         } else {
//           console.log("✅ Email sent:", info.response);
//         }
//       });

//       // ==================================================

//       res.json({ success: true, id: result.insertId });
//     }
//   );
// });

// ================= SERVER =================


const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});