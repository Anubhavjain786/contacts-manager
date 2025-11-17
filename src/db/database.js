class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.fileHandle = null;
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

  // Check if File System Access API is supported
  supportsFileSystemAccess() {
    return "showSaveFilePicker" in window && "showOpenFilePicker" in window;
  }

  async init() {
    try {
      // Load sql.js from CDN (more reliable for browser)
      const initSqlJs = window.initSqlJs || (await this.loadSqlJs());

      this.SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      });

      // Always start with IndexedDB (File System Access requires user gesture)
      console.log("Initializing with IndexedDB...");
      await this.initWithIndexedDB();

      return true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  async initWithFileSystem() {
    try {
      // This method is now called manually when user clicks a button
      this.fileHandle = await this.requestFileAccess();

      if (!this.fileHandle) {
        throw new Error("No file selected");
      }

      // Load database from file
      const file = await this.fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();

      if (arrayBuffer.byteLength > 0) {
        // Load existing database
        this.db = new this.SQL.Database(new Uint8Array(arrayBuffer));
        console.log("Loaded existing database from file");
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        await this.createTables();
        await this.createDefaultUser();
        await this.saveToFile();
        console.log("Created new database file");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("User cancelled file selection, falling back to IndexedDB");
        await this.initWithIndexedDB();
      } else {
        throw error;
      }
    }
  }

  async requestFileAccess() {
    const options = {
      types: [
        {
          description: "SQLite Database",
          accept: { "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"] },
        },
      ],
      suggestedName: "contacts.db",
    };

    try {
      // Try to open existing file
      const [handle] = await window.showOpenFilePicker({
        types: options.types,
        multiple: false,
      });
      return handle;
    } catch (e) {
      // If user cancels or file doesn't exist, create new file
      return await window.showSaveFilePicker(options);
    }
  }

  async initWithIndexedDB() {
    // Fallback to IndexedDB
    const savedDb = await this.loadFromIndexedDB();

    if (savedDb) {
      this.db = new this.SQL.Database(savedDb);
    } else {
      this.db = new this.SQL.Database();
      await this.createTables();
      await this.createDefaultUser();
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
    await this.saveToDisk();
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

    await this.saveToDisk();
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

    await this.saveToDisk();
    return true;
  }

  async deleteContact(id) {
    this.db.run("DELETE FROM contacts WHERE id = ?", [id]);
    await this.saveToDisk();
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

  // Method to manually switch to file-based storage
  async switchToFileStorage() {
    if (!this.supportsFileSystemAccess()) {
      throw new Error(
        "File System Access API is not supported in this browser"
      );
    }

    try {
      this.fileHandle = await this.requestFileAccess();

      if (this.fileHandle) {
        // Save current database to the file
        await this.saveToFile();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to switch to file storage:", error);
      throw error;
    }
  }

  // Method to export database to a file (one-time download)
  async exportDatabaseFile() {
    if (!this.supportsFileSystemAccess()) {
      throw new Error(
        "File System Access API is not supported in this browser"
      );
    }

    try {
      const options = {
        types: [
          {
            description: "SQLite Database",
            accept: { "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"] },
          },
        ],
        suggestedName: `contacts_backup_${
          new Date().toISOString().split("T")[0]
        }.db`,
      };

      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      const data = this.db.export();
      await writable.write(data);
      await writable.close();

      return true;
    } catch (error) {
      if (error.name === "AbortError") {
        return false; // User cancelled
      }
      throw error;
    }
  }

  // Save to disk (File System Access API or IndexedDB fallback)
  async saveToDisk() {
    if (this.fileHandle) {
      await this.saveToFile();
    } else {
      await this.saveToIndexedDB();
    }
  }

  // Save to actual file using File System Access API
  async saveToFile() {
    if (!this.fileHandle) {
      console.log("No file handle, falling back to IndexedDB");
      await this.saveToIndexedDB();
      return;
    }

    try {
      const writable = await this.fileHandle.createWritable();
      const data = this.db.export();
      await writable.write(data);
      await writable.close();
      console.log("Database saved to file successfully");
    } catch (error) {
      console.error("Failed to save to file:", error);
      // Fallback to IndexedDB
      await this.saveToIndexedDB();
    }
  }

  // IndexedDB persistence (fallback)
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
