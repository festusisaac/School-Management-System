const { Client } = require('pg');
const client = new Client({ user: 'sms_user', host: 'localhost', database: 'sms_db', password: 'your_secure_password', port: 5432 });
client.connect().then(async () => {
                const todayClasses = await client.query(`
                    SELECT 
                        ts.id,
                        tp."startTime" as time,
                        s.name as subject,
                        st."first_name" || ' ' || COALESCE(st."last_name", '') as teacher
                    FROM timetables ts
                    JOIN timetable_periods tp ON tp.id = ts."periodId"
                    JOIN subjects s ON s.id = ts."subjectId"
                    LEFT JOIN staff st ON st.id = ts."teacherId"
                    WHERE ts."classId" = $1 AND ts."dayOfWeek" = $2
                    ORDER BY tp."periodOrder" ASC
                `, ['81b2800b-5140-4623-a157-c26fbdb28935', 5]);
  console.log('QueryResult:', todayClasses.rows);
}).catch(console.error).finally(() => client.end());
