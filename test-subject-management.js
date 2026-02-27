
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testSubjectManagement() {
    console.log('🧪 Testing Subject Management...\n');

    try {
        // Step 1: Login
        const uniqueEmail = 'admin_test_1765839075701@sms.school';
        const password = 'TestAdmin@123';

        console.log('1️⃣  Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: password,
        });

        const loginData = loginResponse.data.data ? loginResponse.data.data : loginResponse.data;
        const accessToken = loginData.access_token;
        const config = { headers: { Authorization: `Bearer ${accessToken}` } };
        console.log('✅ Logged in');

        // Step 2: Create a Subject Group (Prerequisite)
        console.log('\n2️⃣  Creating Subject Group...');
        const groupName = `Sciences ${Date.now()}`;
        const createGroupResponse = await axios.post(`${API_URL}/academics/subject-groups`, {
            name: groupName,
            description: "Science Subjects",
            isActive: true
        }, config);
        let newGroup = createGroupResponse.data.data ? createGroupResponse.data.data : createGroupResponse.data;
        console.log(`✅ Subject Group created: ${newGroup.name} (ID: ${newGroup.id})`);

        // Step 3: Create Subject
        console.log('\n3️⃣  Creating Subject...');
        const createSubjectResponse = await axios.post(`${API_URL}/academics/subjects`, {
            name: "Physics",
            code: `PHY${Date.now()}`, // Ensure unique code
            groupId: newGroup.id,
            isCore: true,
            isActive: true
        }, config);
        let newSubject = createSubjectResponse.data.data ? createSubjectResponse.data.data : createSubjectResponse.data;
        console.log(`✅ Subject created: ${newSubject.name} (${newSubject.code})`);

        // Step 4: Verify in List
        console.log('\n4️⃣  Verifying Subject in List...');
        const getAllResponse = await axios.get(`${API_URL}/academics/subjects`, config);
        const allSubjects = getAllResponse.data.data ? getAllResponse.data.data : getAllResponse.data;
        const foundSubject = allSubjects.find(s => s.id === newSubject.id);

        if (foundSubject) {
            console.log(`✅ Found subject: ${foundSubject.name} in Group: ${foundSubject.group ? foundSubject.group.name : 'N/A'}`);
        } else {
            throw new Error('Subject NOT found in list!');
        }

        // Step 5: Update Subject
        console.log('\n5️⃣  Updating Subject...');
        const updateResponse = await axios.put(`${API_URL}/academics/subjects/${newSubject.id}`, {
            name: "Advanced Physics",
        }, config);
        const updatedSubject = updateResponse.data.data ? updateResponse.data.data : updateResponse.data;
        console.log(`✅ Subject updated: ${updatedSubject.name}`);

        if (updatedSubject.name !== "Advanced Physics") throw new Error('Update failed');

        // Step 6: Toggle Status
        console.log('\n6️⃣  Toggling Status...');
        const toggleResponse = await axios.patch(`${API_URL}/academics/subjects/${newSubject.id}/toggle-status`, {}, config);
        const toggledSubject = toggleResponse.data.data ? toggleResponse.data.data : toggleResponse.data;
        console.log(`✅ Status toggled. New Status: ${toggledSubject.isActive}`);

        // Step 7: Delete Subject
        console.log('\n7️⃣  Deleting Subject...');
        await axios.delete(`${API_URL}/academics/subjects/${newSubject.id}`, config);
        console.log('✅ Subject deleted');

        // Verify Deletion
        try {
            await axios.get(`${API_URL}/academics/subjects/${newSubject.id}`, config);
            throw new Error('Subject still exists after deletion!');
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log('✅ Verified: Subject fetch returns 404 (Not Found)');
            } else {
                throw err;
            }
        }

        console.log('\n🎉 ALL SUBJECT TESTS PASSED!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

testSubjectManagement();
