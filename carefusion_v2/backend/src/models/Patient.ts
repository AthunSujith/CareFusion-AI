import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
    patientId: string; // Unique Clinical ID (e.g., CF-1001)
    fullName: string;
    dob: Date;
    age: number;
    placeOfBirth: string;
    gender: 'male' | 'female' | 'other';
    registrationDate: Date;

    // Clinical Details
    allergies: string[];
    medicalHistory: string[];
    bloodType: string;

    // Emergency Contact
    emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
    };

    // Metadata
    lastUpdated: Date;
}

const PatientSchema: Schema = new Schema({
    patientId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    placeOfBirth: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    registrationDate: { type: Date, default: Date.now },

    allergies: [{ type: String }],
    medicalHistory: [{ type: String }],
    bloodType: { type: String },

    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },

    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Set lastUpdated on save via timestamps logic or just remove if redundant


export default mongoose.model<IPatient>('Patient', PatientSchema);
