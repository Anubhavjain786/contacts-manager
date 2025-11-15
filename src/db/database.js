class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  // Simple hash function for browser (not cryptographically secure, but works for demo)
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  async loadSqlJs() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sql.js.org/dist/sql-wasm.js";
      script.onload = () => resolve(window.initSqlJs);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async init() {
    try {
      // Load sql.js from CDN (more reliable for browser)
      const initSqlJs = window.initSqlJs || (await this.loadSqlJs());

      this.SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      });

      // Try to load existing database from IndexedDB
      const savedDb = await this.loadFromIndexedDB();

      if (savedDb) {
        this.db = new this.SQL.Database(savedDb);
      } else {
        this.db = new this.SQL.Database();
        await this.createTables();
        await this.createDefaultUser();
      }

      return true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  async createTables() {
    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

    // Create contacts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        location TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.saveToIndexedDB();
  }

  async createDefaultUser() {
    const hashedPassword = this.simpleHash("admin123");
    this.db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
      "admin",
      hashedPassword,
    ]);
    await this.saveToIndexedDB();
  }

  // User methods
  async authenticateUser(username, password) {
    const result = this.db.exec("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const user = {
      id: result[0].values[0][0],
      username: result[0].values[0][1],
      password_hash: result[0].values[0][2],
    };

    const hashedInput = this.simpleHash(password);
    const isValid = hashedInput === user.password_hash;
    return isValid ? { id: user.id, username: user.username } : null;
  }

  // Contact CRUD methods
  async createContact(contact) {
    const { name, email, phone, company, location, tags } = contact;
    const tagsJson = JSON.stringify(tags || []);

    this.db.run(
      `INSERT INTO contacts (name, email, phone, company, location, tags)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email || "", phone || "", company || "", location || "", tagsJson]
    );

    await this.saveToIndexedDB();
    return this.getLastInsertId();
  }

  async getAllContacts() {
    const result = this.db.exec(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map((row) => ({
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      company: row[4],
      location: row[5],
      tags: JSON.parse(row[6] || "[]"),
      created_at: row[7],
      updated_at: row[8],
    }));
  }

  async getContactById(id) {
    const result = this.db.exec("SELECT * FROM contacts WHERE id = ?", [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    return {
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      company: row[4],
      location: row[5],
      tags: JSON.parse(row[6] || "[]"),
      created_at: row[7],
      updated_at: row[8],
    };
  }

  async updateContact(id, contact) {
    const { name, email, phone, company, location, tags } = contact;
    const tagsJson = JSON.stringify(tags || []);

    this.db.run(
      `UPDATE contacts 
       SET name = ?, email = ?, phone = ?, company = ?, location = ?, tags = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        email || "",
        phone || "",
        company || "",
        location || "",
        tagsJson,
        id,
      ]
    );

    await this.saveToIndexedDB();
    return true;
  }

  async deleteContact(id) {
    this.db.run("DELETE FROM contacts WHERE id = ?", [id]);
    await this.saveToIndexedDB();
    return true;
  }

  async searchContacts(query) {
    const searchTerm = `%${query}%`;
    const result = this.db.exec(
      `SELECT * FROM contacts 
       WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
       ORDER BY created_at DESC`,
      [searchTerm, searchTerm, searchTerm]
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map((row) => ({
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      company: row[4],
      location: row[5],
      tags: JSON.parse(row[6] || "[]"),
      created_at: row[7],
      updated_at: row[8],
    }));
  }

  getLastInsertId() {
    const result = this.db.exec("SELECT last_insert_rowid()");
    return result[0].values[0][0];
  }

  // IndexedDB persistence
  async saveToIndexedDB() {
    const data = this.db.export();
    const dbName = "contacts-manager-db";

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["databases"], "readwrite");
        const store = transaction.objectStore("databases");
        const putRequest = store.put(data, "main");

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("databases")) {
          db.createObjectStore("databases");
        }
      };
    });
  }

  async loadFromIndexedDB() {
    const dbName = "contacts-manager-db";

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("databases")) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(["databases"], "readonly");
        const store = transaction.objectStore("databases");
        const getRequest = store.get("main");

        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("databases")) {
          db.createObjectStore("databases");
        }
      };
    });
  }
}

export default new Database();
