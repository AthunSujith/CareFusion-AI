import mongoose from 'mongoose';
import ClinicalRecord from './models/ClinicalRecord.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import Patient from './models/Patient.js';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefusion_v2';
const PATIENTS = [
    { patientId: 'SW-928', fullName: 'Sarah Williams', dob: new Date('1985-05-15'), age: 38, gender: 'female' as const, bloodType: 'A+', registrationDate: new Date() },
    { patientId: 'PAT-001-X', fullName: 'Test Patient', dob: new Date('1990-01-01'), age: 34, gender: 'male' as const, bloodType: 'O-', registrationDate: new Date() }
];
const USER_ID = 'dr-sarah-chen';
const PATIENT_ID = 'SW-928'; // Changed to match DoctorDashboard default

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Seed Patients
        for (const p of PATIENTS) {
            await Patient.findOneAndUpdate({ patientId: p.patientId }, p, { upsert: true, new: true });
        }
        console.log('✅ Patients seeded');

        // Clear existing records for this patient to avoid duplicates
        await ClinicalRecord.deleteMany({ patientId: PATIENT_ID });
        await ClinicalRecord.deleteMany({ patientId: 'PAT-001-X' });

        const records = [
            {
                userId: USER_ID,
                patientId: 'SW-928',
                recordType: 'imaging',
                timestamp: new Date('2025-12-15'),
                status: 'completed',
                moduleData: {
                    imagePath: 'chest_xray_01.png',
                    prediction: 'NORMAL',
                    confidence: 0.98,
                    observations: 'Clear lung fields, no suspicious opacities. Cardiac silhouette is within normal limits.'
                },
                clinicianNotes: 'Routine screening. No follow-up required.'
            },
            {
                userId: USER_ID,
                patientId: 'PAT-001-X',
                recordType: 'imaging',
                timestamp: new Date('2025-12-16'),
                status: 'completed',
                moduleData: {
                    imagePath: 'brain_scan_01.png',
                    prediction: 'NORMAL',
                    confidence: 0.99,
                    observations: 'No structural abnormalities detected in cerebral parenchyma.'
                },
                clinicianNotes: 'Baseline scan.'
            },
            {
                userId: USER_ID,
                patientId: 'SW-928',
                recordType: 'symptom',
                timestamp: new Date('2026-01-10'),
                status: 'completed',
                moduleData: {
                    symptomText: 'Occasional mild palpitations and fatigue.',
                    aiResponse: {
                        symptoms: ['Palpitations', 'Fatigue'],
                        recommendation: 'Monitor heart rate and stress levels. Consider ECG if symptoms persist.'
                    }
                }
            },
            {
                userId: USER_ID,
                patientId: 'SW-928',
                recordType: 'genomics',
                timestamp: new Date('2026-01-20'),
                status: 'completed',
                moduleData: {
                    vcfPath: 'BRCA_screening.vcf',
                    variants: ['BRCA1:c.123A>G', 'TP53:c.456T>A'],
                    summary: 'Moderate risk variants identified.',
                    interpretation: 'Genetic counseling recommended for risk assessment.'
                }
            }
        ];

        await ClinicalRecord.insertMany(records);
        console.log('✅ Seeding complete: Clinical records added');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seedData();
