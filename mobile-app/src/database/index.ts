import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';

import Student from './models/Student';
import Attendance from './models/Attendance';
import FeeRecord from './models/FeeRecord';
import Class from './models/Class';
import Section from './models/Section';
import ExamGroup from './models/ExamGroup';
import StudentTermResult from './models/StudentTermResult';
import StudentDocument from './models/StudentDocument';
import CommunicationLog from './models/CommunicationLog';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, /* recommended for performance */
  dbName: 'edumanage_v5',
  onSetUpError: error => {
    console.error('WatermelonDB setup error', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    Student,
    Attendance,
    FeeRecord,
    Class,
    Section,
    ExamGroup,
    StudentTermResult,
    StudentDocument,
    CommunicationLog,
  ],
});
