import sqlite3 from 'sqlite3';
import { join } from 'path';

const dbPath = join(__dirname, '../cbt-local.db');
const db = new sqlite3.Database(dbPath);

export const run = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

export const all = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
};

export const get = <T = any>(sql: string, params: any[] = []): Promise<T> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row as T);
        });
    });
};

export const initDb = async () => {
    await run(`
        CREATE TABLE IF NOT EXISTS manifest (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // Enable High-Concurrency WAL Mode
    await run(`PRAGMA journal_mode = WAL`);

    await run(`
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            admissionNo TEXT UNIQUE,
            fullName TEXT,
            photoUrl TEXT
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            content TEXT,
            marks INTEGER,
            options TEXT -- JSON stringified array of options
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS exam_sessions (
            studentId TEXT PRIMARY KEY,
            startTime TEXT,
            endTime TEXT,
            updatedAt TEXT,
            isSubmitted INTEGER DEFAULT 0,
            extraTimeMinutes INTEGER DEFAULT 0,
            lastQuestionIndex INTEGER DEFAULT 0,
            answerTimeline TEXT DEFAULT '{}',
            answers TEXT -- JSON stringified object { [questionId]: optionId }
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            actor TEXT NOT NULL,
            clientId TEXT,
            details TEXT,
            createdAt TEXT NOT NULL
        )
    `);

    // Migration for existing DBs
    try {
        await run(`ALTER TABLE exam_sessions ADD COLUMN extraTimeMinutes INTEGER DEFAULT 0`);
    } catch (e) { /* ignore if already exists */ }

    try {
        await run(`ALTER TABLE exam_sessions ADD COLUMN lastQuestionIndex INTEGER DEFAULT 0`);
    } catch (e) { /* ignore if already exists */ }

    try {
        await run(`ALTER TABLE exam_sessions ADD COLUMN answerTimeline TEXT DEFAULT '{}'`);
    } catch (e) { /* ignore if already exists */ }

    try {
        await run(`ALTER TABLE exam_sessions ADD COLUMN updatedAt TEXT`);
    } catch (e) { /* ignore if already exists */ }

    try {
        await run(`ALTER TABLE students ADD COLUMN photoUrl TEXT`);
    } catch (e) { /* ignore if already exists */ }
    
    console.log('Local Database initialized.');
};
