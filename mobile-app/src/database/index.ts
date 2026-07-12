import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import schema from './schema';

// Pure JS UUIDv4 generator to avoid native module requirements (like expo-crypto)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

setGenerator(() => generateUUID());

import Student from './models/Student';
import Attendance from './models/Attendance';
import FeeRecord from './models/FeeRecord';
import Class from './models/Class';
import Section from './models/Section';
import ExamGroup from './models/ExamGroup';
import StudentTermResult from './models/StudentTermResult';
import StudentDocument from './models/StudentDocument';
import CommunicationLog from './models/CommunicationLog';
import FeeGroup from './models/FeeGroup';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, /* recommended for performance */
  dbName: 'edumanage_v10',
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
    FeeGroup,
  ],
});
