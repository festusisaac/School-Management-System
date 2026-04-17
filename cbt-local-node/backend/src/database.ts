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

    await run(`
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            admissionNo TEXT UNIQUE,
            fullName TEXT
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
            isSubmitted INTEGER DEFAULT 0,
            answers TEXT -- JSON stringified object { [questionId]: optionId }
        )
    `);
    
    console.log('Local Database initialized.');
};
