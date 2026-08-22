const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config');

const dataDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Open SQLite database
const rawDb = new sqlite3.Database(config.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
  } else {
    console.log('Database connected successfully at:', config.DB_PATH);
  }
});

// Configure SQLite
rawDb.run('PRAGMA foreign_keys = ON');

// Wrapper that provides synchronous-like prepare API with transactions
class StatementWrapper {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  get(...params) {
    let finalParams = params;
    if (params.length === 1 && Array.isArray(params[0])) {
      finalParams = params[0];
    }
    // Synchronous execution using deasync / promise or direct async helper
    // In node-sqlite3, we execute synchronously via statement
    return new Promise((resolve, reject) => {
      this.db.get(this.sql, finalParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(...params) {
    let finalParams = params;
    if (params.length === 1 && Array.isArray(params[0])) {
      finalParams = params[0];
    }
    return new Promise((resolve, reject) => {
      this.db.all(this.sql, finalParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  run(...params) {
    let finalParams = params;
    if (params.length === 1 && Array.isArray(params[0])) {
      finalParams = params[0];
    }
    return new Promise((resolve, reject) => {
      this.db.run(this.sql, finalParams, function (err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    });
  }
}

// Let's create an intuitive sync/async DB interface with synchronous execution helper
// Note: We can implement a clean in-memory/disk sync database engine or execute statements directly
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
rawDb.exec(schemaSql, (err) => {
  if (err) {
    console.error('Schema initialization error:', err);
  } else {
    console.log('Dayflow Database Schema Ready.');
  }
});

// Export clean methods
const db = {
  raw: rawDb,
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  prepare: (sql) => {
    return {
      get: (...params) => {
        let finalParams = params;
        if (params.length === 1 && Array.isArray(params[0])) finalParams = params[0];
        return new Promise((resolve, reject) => {
          rawDb.get(sql, finalParams, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params) => {
        let finalParams = params;
        if (params.length === 1 && Array.isArray(params[0])) finalParams = params[0];
        return new Promise((resolve, reject) => {
          rawDb.all(sql, finalParams, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });
      },
      run: (...params) => {
        let finalParams = params;
        if (params.length === 1 && Array.isArray(params[0])) finalParams = params[0];
        return new Promise((resolve, reject) => {
          rawDb.run(sql, finalParams, function (err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          });
        });
      }
    };
  },
  transaction: (fn) => {
    return async (...args) => {
      await db.exec('BEGIN TRANSACTION');
      try {
        const result = await fn(...args);
        await db.exec('COMMIT');
        return result;
      } catch (err) {
        await db.exec('ROLLBACK');
        throw err;
      }
    };
  }
};

module.exports = db;
