const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testTimetable() {
    console.log('🧪 Testing Class Timetable Feature...\n');

    try {
        // Step 1: Login
        const uniqueEmail = 'admin_test_1765839075701@sms.school';
        const password = 'TestAdmin@123';

        console.log('1️⃣  Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: password,
        });

        const accessToken = loginResponse.data.data.access_token;
        const config = { headers: { Authorization: `Bearer ${accessToken}` } };
        console.log('✅ Logged in');

        // Step 2: Create Periods
        console.log('\n2️⃣  Creating Periods...');
        const periods = [];
        const periodData = [
            { name: 'Period 1', startTime: '08:00', endTime: '09:00', periodOrder: 1, isBreak: false },
            { name: 'Period 2', startTime: '09:00', endTime: '10:00', periodOrder: 2, isBreak: false },
            { name: 'Break', startTime: '10:00', endTime: '10:15', periodOrder: 3, isBreak: true },
            { name: 'Period 3', startTime: '10:15', endTime: '11:15', periodOrder: 4, isBreak: false },
        ];

        for (const pd of periodData) {
            const response = await axios.post(`${API_URL}/academics/timetable-periods`, pd, config);
            periods.push(response.data.data);
        }
        console.log(`✅ Created ${periods.length} periods`);

        // Step 3: Get a Class and Section
        console.log('\n3️⃣  Getting Class and Section...');
        const classesResponse = await axios.get(`${API_URL}/academics/classes`, config);
        const classes = classesResponse.data.data;

        if (classes.length === 0) {
            throw new Error('No classes found. Please create a class first.');
        }

        const testClass = classes[0];
        const sectionsResponse = await axios.get(`${API_URL}/academics/sections`, config);
        const sections = sectionsResponse.data.data.filter(s => s.classId === testClass.id);

        if (sections.length === 0) {
            throw new Error('No sections found for this class. Please create a section first.');
        }

        const testSection = sections[0];
        console.log(`✅ Using Class: ${testClass.name}, Section: ${testSection.name}`);

        // Step 4: Get Subjects
        console.log('\n4️⃣  Getting Subjects...');
        const subjectsResponse = await axios.get(`${API_URL}/academics/subjects`, config);
        const subjects = subjectsResponse.data.data;

        if (subjects.length === 0) {
            throw new Error('No subjects found. Please create subjects first.');
        }
        console.log(`✅ Found ${subjects.length} subjects`);

        // Step 5: Create Timetable Slots
        console.log('\n5️⃣  Creating Timetable Slots...');
        const slots = [];

        // Monday Period 1 - Math
        const slot1 = await axios.post(`${API_URL}/academics/timetable`, {
            classId: testClass.id,
            sectionId: testSection.id,
            dayOfWeek: 1,
            periodId: periods[0].id,
            subjectId: subjects[0].id,
            roomNumber: 'Room 101'
        }, config);
        slots.push(slot1.data.data);

        // Monday Period 2 - Science
        const slot2 = await axios.post(`${API_URL}/academics/timetable`, {
            classId: testClass.id,
            sectionId: testSection.id,
            dayOfWeek: 1,
            periodId: periods[1].id,
            subjectId: subjects.length > 1 ? subjects[1].id : subjects[0].id,
            roomNumber: 'Room 102'
        }, config);
        slots.push(slot2.data.data);

        console.log(`✅ Created ${slots.length} timetable slots`);

        // Step 6: Test Conflict Detection
        console.log('\n6️⃣  Testing Conflict Detection...');
        try {
            await axios.post(`${API_URL}/academics/timetable`, {
                classId: testClass.id,
                sectionId: testSection.id,
                dayOfWeek: 1,
                periodId: periods[0].id, // Same day and period as slot1
                subjectId: subjects[0].id,
            }, config);
            throw new Error('Conflict detection FAILED - duplicate slot was created!');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('✅ Conflict detection working - duplicate slot prevented');
            } else {
                throw err;
            }
        }

        // Step 7: Retrieve Timetable
        console.log('\n7️⃣  Retrieving Timetable...');
        const timetableResponse = await axios.get(
            `${API_URL}/academics/timetable/class/${testClass.id}/section/${testSection.id}`,
            config
        );
        const timetable = timetableResponse.data.data;
        console.log(`✅ Retrieved timetable with ${timetable.length} slots`);

        // Step 8: Update Slot
        console.log('\n8️⃣  Updating Timetable Slot...');
        await axios.put(`${API_URL}/academics/timetable/${slots[0].id}`, {
            roomNumber: 'Room 201 (Updated)'
        }, config);
        console.log('✅ Slot updated successfully');

        // Step 9: Delete Slots and Periods
        console.log('\n9️⃣  Cleaning Up...');
        for (const slot of slots) {
            await axios.delete(`${API_URL}/academics/timetable/${slot.id}`, config);
        }
        for (const period of periods) {
            await axios.delete(`${API_URL}/academics/timetable-periods/${period.id}`, config);
        }
        console.log('✅ Cleanup successful');

        console.log('\n🎉 ALL TIMETABLE TESTS PASSED!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

testTimetable();
