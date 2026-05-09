import initSqlJs, { type Database, type QueryExecResult } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { SCHEMA } from './schema';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'zupu.db');

let db: Database;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let SQL: any;
  try {
    SQL = await initSqlJs();
  } catch {
    // Fallback: try without locateFile
    SQL = await initSqlJs({});
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  db.run(SCHEMA);
  saveDb();

  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// Helper: run a query and return all rows
export function queryAll(sql: string, params: any[] = []): any[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row
export function queryOne(sql: string, params: any[] = []): any | undefined {
  const rows = queryAll(sql, params);
  return rows[0];
}

// Helper: run a write statement
export function execute(sql: string, params: any[] = []): void {
  const d = getDb();
  d.run(sql, params);
  saveDb();
}

// Helper: run insert and return lastInsertRowid
export function insert(sql: string, params: any[] = []): number {
  const d = getDb();
  d.run(sql, params);
  const lastId = queryOne('SELECT last_insert_rowid() as id') as { id: number };
  saveDb();
  return lastId.id;
}
