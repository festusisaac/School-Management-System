const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function reproduceConflict() {
    console.log('🧪 Testing Timetable Conflict Detection...\n');

    try {
        // 1. Login
        console.log('1️⃣  Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'sarah@gmail.com',
            password: 'password123',
        });
        const accessToken = loginResponse.data.data.access_token;
        const config = { headers: { Authorization: `Bearer ${accessToken}` } };
        console.log('✅ Logged in');

        // 2. Get Periods
        console.log('\n2️⃣  Getting Periods...');
        const periodsRes = await axios.get(`${API_URL}/academics/timetable/periods`, config);
        const periods = periodsRes.data.data;
        if (periods.length === 0) throw new Error('No periods found');
        const periodId = periods[0].id;

        // 3. Get Classes/Sections
        console.log('\n3️⃣  Getting Classes and Sections...');
        const classesRes = await axios.get(`${API_URL}/academics/classes`, config);
        const sectionsRes = await axios.get(`${API_URL}/academics/sections`, config);
        const classes = classesRes.data.data;
        const sections = sectionsRes.data.data;

        if (classes.length < 2 || sections.length < 2) {
            console.log('⚠️  Need at least 2 classes/sections to test teacher conflict. Skipping full test.');
            return;
        }

        const class1 = classes[0];
        const section1 = sections.find(s => s.classId === class1.id);
        const class2 = classes[1];
        const section2 = sections.find(s => s.classId === class2.id);

        // 4. Get Subjects
        const subjectsRes = await axios.get(`${API_URL}/academics/subjects`, config);
        const subjects = subjectsRes.data.data;
        const subjectId = subjects[0].id;

        // 5. Get a Teacher
        const staffRes = await axios.get(`${API_URL}/hr/staff`, config);
        const teachers = staffRes.data.data.filter(s => s.isTeachingStaff);
        if (teachers.length === 0) throw new Error('No teachers found');
        const teacherId = teachers[0].id;

        console.log(`Using Teacher: ${teachers[0].firstName} ${teachers[0].lastName}`);

        // 6. Create first slot
        console.log('\n4️⃣  Creating first slot for teacher...');
        let slot1;
        try {
            const res = await axios.post(`${API_URL}/academics/timetable/slots`, {
                classId: class1.id,
                sectionId: section1.id,
                dayOfWeek: 1,
                periodId: periodId,
                subjectId: subjectId,
                teacherId: teacherId
            }, config);
            slot1 = res.data.data;
            console.log('✅ First slot created');
        } catch (err) {
            if (err.response?.data?.message?.includes('already assigned')) {
                console.log('ℹ️  Slot already exists, using existing data for test.');
                // Try to find it
                const teacherTT = await axios.get(`${API_URL}/academics/timetable/slots/teacher/${teacherId}`, config);
                slot1 = teacherTT.data.data.find(s => s.dayOfWeek === 1 && s.periodId === periodId);
            } else {
                throw err;
            }
        }

        // 7. Try to create conflicting slot for same teacher
        console.log('\n5️⃣  Testing teacher conflict detection (New Slot)...');
        try {
            await axios.post(`${API_URL}/academics/timetable/slots`, {
                classId: class2.id,
                sectionId: section2.id,
                dayOfWeek: 1,
                periodId: periodId,
                subjectId: subjectId,
                teacherId: teacherId
            }, config);
            console.error('❌ Conflict detection FAILED - duplicate teacher slot created!');
        } catch (err) {
            if (err.response && err.response.status === 409) {
                console.log('✅ Conflict detection WORKING - Error message:', err.response.data.message);
            } else {
                console.error('❌ Unexpected error:', err.response?.data || err.message);
            }
        }

        // 8. Test update conflict
        console.log('\n6️⃣  Testing conflict detection (Update Slot)...');
        // Create another slot somewhere else and try to move it to a conflicting time
        const slot2Res = await axios.post(`${API_URL}/academics/timetable/slots`, {
            classId: class2.id,
            sectionId: section2.id,
            dayOfWeek: 2, // Different day
            periodId: periodId,
            subjectId: subjectId,
            teacherId: teacherId
        }, config).catch(err => {
            if (err.response?.data?.message?.includes('already exists')) {
                return axios.get(`${API_URL}/academics/timetable/slots/teacher/${teacherId}`, config);
            }
            throw err;
        });

        let slot2 = slot2Res.data.data;
        if (Array.isArray(slot2)) slot2 = slot2.find(s => s.dayOfWeek === 2 && s.periodId === periodId);

        try {
            await axios.put(`${API_URL}/academics/timetable/slots/${slot2.id}`, {
                dayOfWeek: 1 // Move to conflicting day
            }, config);
            console.error('❌ Update conflict detection FAILED!');
        } catch (err) {
            if (err.response && err.response.status === 409) {
                console.log('✅ Update conflict detection WORKING - Error message:', err.response.data.message);
            } else {
                console.error('❌ Unexpected error during update:', err.response?.data || err.message);
            }
        }

        console.log('\n🎉 Verification completed!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

reproduceConflict();
