const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Use a known Student ID (from previous Logs or create a dummy)
// Since we don't have the ID handy from logs, we'll try to fetch ALL students first to get an ID.
// But GET /students/ might be broken slightly if user edits were applied? 
// We saw the list endpoint logic was "studentsWithBalance".

async function runTest() {
    try {
        const token = jwt.sign({ id: 'admin_id', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

        console.log('1. Fetching All Students to find a target...');
        const listRes = await axios.get(`${BASE_URL}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!listRes.data || listRes.data.length === 0) {
            console.error('No students found to test.');
            return;
        }

        const targetStudent = listRes.data[0];
        console.log(`Target Student: ${targetStudent.name} (${targetStudent._id})`);

        console.log('2. Fetching Single Student Detail (GET /students/:id)...');
        const detailRes = await axios.get(`${BASE_URL}/students/${targetStudent._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const s = detailRes.data;
        console.log('--------------------------------------------------');
        console.log(`Fetched Student Data:`);
        console.log(`- Balance: ${s.balance}`);
        console.log(`- Active Plans: ${s.activePlans ? s.activePlans.length : 0}`);
        if (s.activePlans) console.log(JSON.stringify(s.activePlans, null, 2));
        console.log('--------------------------------------------------');

        if (s.balance !== undefined) {
            console.log('✅ API is returning balance field.');
        } else {
            console.error('❌ API is MISSING balance field.');
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

runTest();
