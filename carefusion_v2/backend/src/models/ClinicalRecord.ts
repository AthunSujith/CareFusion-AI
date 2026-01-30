import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicalRecord extends Document {
    userId: string;
    patientId: string;
    recordType: 'imaging' | 'genomics' | 'symptom' | 'temporal';
    timestamp: Date;

    // Module-specific data
    moduleData: {
        // Module 2: Imaging
        imagePath?: string;
        prediction?: string;
        confidence?: number;
        observations?: string;

        // Module 3: Genomics
        vcfPath?: string;
        variants?: string[];
        summary?: string;
        interpretation?: string;

        // Module 1: Symptom
        symptomText?: string;
        aiResponse?: any;

        // Module 4: Temporal
        temporalData?: any;
    };

    // Physician notes
    clinicianNotes?: string;

    // Metadata
    analysisId?: string;
    status: 'draft' | 'completed' | 'archived';
}

const ClinicalRecordSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true, ref: 'Patient' },
    patientName: String, // Denormalized for quick view
    recordType: {
        type: String,
        required: true,
        enum: ['imaging', 'genomics', 'symptom', 'temporal']
    },
    timestamp: { type: Date, default: Date.now },

    moduleData: {
        // Imaging
        imagePath: String,
        prediction: String,
        confidence: Number,
        observations: String,

        // Genomics
        vcfPath: String,
        variants: [String],
        summary: String,
        interpretation: String,

        // Symptom
        symptomText: String,
        aiResponse: Schema.Types.Mixed,

        // Temporal
        temporalData: Schema.Types.Mixed
    },

    clinicianNotes: String,
    analysisId: String,
    status: { type: String, enum: ['draft', 'completed', 'archived'], default: 'draft' }
}, {
    timestamps: true
});

// Indexes for efficient querying
ClinicalRecordSchema.index({ userId: 1, patientId: 1, timestamp: -1 });
ClinicalRecordSchema.index({ recordType: 1, status: 1 });

export default mongoose.model<IClinicalRecord>('ClinicalRecord', ClinicalRecordSchema);
