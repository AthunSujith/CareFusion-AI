import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v2/patients';

const samplePatient = {
    patientId: 'PAT-001-X',
    fullName: 'Alexander Knight',
    dob: '1985-06-15',
    age: 38,
    placeOfBirth: 'Berlin, Germany',
    gender: 'male',
    allergies: ['Penicillin', 'Peanuts'],
    medicalHistory: ['Asthma', 'Hypertension'],
    bloodType: 'A+',
    emergencyContact: {
        name: 'Elena Knight',
        relationship: 'Spouse',
        phone: '+49-170-1234567'
    }
};

async function testRegistration() {
    try {
        console.log('🚀 Registering sample patient...');
        const response = await axios.post(`${API_URL}/register`, samplePatient);
        console.log('✅ Success!');
        console.log('Patient ID:', response.data.patient.patientId);
        console.log('Storage Initialized at:', response.data.storagePath);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testRegistration();
