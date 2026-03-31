const express = require('express');   // // FIXED
const cors = require('cors');         // // FIXED

const app = express();                // // FIXED

app.use(cors());                      // // FIXED
app.use(express.json());              // // FIXED

// server.js
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL missing ❌");
  process.exit(1);
}

const parsed = new URL(dbUrl);

const pool = mysql.createPool({
  host: parsed.hostname,
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.replace('/', ''),
  port: Number(parsed.port), // // FIXED
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
// =================== DATABASE INIT ===================

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255),
        role VARCHAR(100),
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        status VARCHAR(100),
        priority VARCHAR(50),
        lead_type VARCHAR(50),
        location VARCHAR(255),
        requirement TEXT,
        description TEXT,
        source VARCHAR(100),
        deal_value DECIMAL(10,2),
        follow_up_date DATE,
        assigned_user_id VARCHAR(50),
        assigned_user_name VARCHAR(255),
        is_shared TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
        
    `);
    await conn.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    console.log('Database tables initialized');
  } finally {
    conn.release();
  }
  
}

// =================== LOGIN ===================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =================== GET LEADS ===================

app.get('/api/leads', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id, name, phone, email, status, priority,
        lead_type AS leadType,
        location, requirement, description, source,
        deal_value AS dealValue,
        follow_up_date AS followUpDate,
        assigned_user_id AS assignedUserId,
        assigned_user_name AS assignedUserName,
        is_shared AS isShared,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM leads
      ORDER BY created_at DESC
    `);

    console.log("FETCHED LEADS:", rows); // ADDED

    res.json(rows);
  } catch (err) {
    console.error('getLeads error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =================== ADD LEAD ===================

app.post('/api/leads', async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body); // ADDED

    let {
      name,
      phone,
      email,
      status,
      priority,
      leadType,
      location,
      requirement,
      description,
      source,
      dealValue,
      followUpDate,
      assignedUserId,
      assignedUserName,
      isShared,
    } = req.body;

    // MODIFIED — safe fallback values
    name = name || 'Unknown';
    phone = phone || '0000000000';
    status = status || 'New';
    priority = priority || 'Medium';
    leadType = leadType === 'collab' ? 'collab' : 'our';

    const [result] = await pool.query(
      `INSERT INTO leads
        (name, phone, email, status, priority, lead_type,
         location, requirement, description, source,
         deal_value, follow_up_date,
         assigned_user_id, assigned_user_name, is_shared)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email || '',
        status,
        priority,
        leadType,
        location || '',
        requirement || '',
        description || '',
        source || 'Manual',
        dealValue || null,
        followUpDate || null,
        assignedUserId || '',
        assignedUserName || '',
        isShared ? 1 : 0,
      ]
    );

    console.log("INSERT SUCCESS ID:", result.insertId); // ADDED

    res.status(201).json({
      success: true,
      message: 'Lead created',
      id: result.insertId,
    });
  } catch (err) {
    console.error('INSERT ERROR:', err); // ADDED
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
});


// =================== UPDATE LEAD ===================
// ADDED — update lead (status, etc.)

app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      name,
      phone,
      email,
      leadType,
      location,
      requirement,
      description,
      source,
      dealValue,
      followUpDate,
      assignedUserId,
      assignedUserName,
    } = req.body;

    console.log("UPDATE BODY:", req.body); // ADDED

    // MODIFIED — dynamic update query
    const fields = [];
    const values = [];

    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (priority !== undefined) {
      fields.push("priority = ?");
      values.push(priority);
    }

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (phone !== undefined) {
      fields.push("phone = ?");
      values.push(phone);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (leadType !== undefined) {
      fields.push("lead_type = ?");
      values.push(leadType === 'collab' ? 'collab' : 'our');
    }

    if (location !== undefined) {
      fields.push("location = ?");
      values.push(location);
    }

    if (requirement !== undefined) {
      fields.push("requirement = ?");
      values.push(requirement);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    if (source !== undefined) {
      fields.push("source = ?");
      values.push(source);
    }

    if (dealValue !== undefined) {
      fields.push("deal_value = ?");
      values.push(dealValue);
    }

   // MODIFIED — fix date format for MySQL
    if (followUpDate !== undefined) {
      fields.push("follow_up_date = ?");
  
      let formattedDate = null;

   if (followUpDate) {
      const date = new Date(followUpDate);
      formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

      values.push(formattedDate);
}

    if (assignedUserId !== undefined) {
      fields.push("assigned_user_id = ?");
      values.push(assignedUserId);
    }

    if (assignedUserName !== undefined) {
      fields.push("assigned_user_name = ?");
      values.push(assignedUserName);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    await pool.query(
      `UPDATE leads SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error("update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// =================== DELETE ===================

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM leads WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADDED — add note
app.post('/api/notes', async (req, res) => {
  try {
    const { leadId, message } = req.body;

    await pool.query(
      'INSERT INTO notes (lead_id, message) VALUES (?, ?)',
      [leadId, message]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ADDED — get notes
app.get('/api/notes/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC',
      [leadId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =================== START SERVER ===================

const PORT = process.env.PORT || 5000; // // FIXED

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
});
