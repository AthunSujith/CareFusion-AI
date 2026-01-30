import express from 'express';
import multer from 'multer';
import { PythonService } from '../services/pythonService.js';
import ClinicalRecord from '../models/ClinicalRecord.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Professional medical data storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.userId || 'anonymous';
        const userRoot = process.env.USER_DATA_ROOT || path.join(process.cwd(), 'data', 'users');
        const uploadDir = path.join(userRoot, userId, 'vault');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '9242880000') },
});

/**
 * SECURITY MIDDLEWARE: Verify Clinical Identity
 */
const verifyClinician = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== 'Bearer clinical-access-token-2026') {
        console.warn('🚨 Unauthorized Access Attempt Detected at AI Node');
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Valid Clinical Access Token Required for AI Handshake.'
        });
    }
    next();
};

// Apply security to all AI/Clinical routes
router.use(verifyClinician);

/**
 * MODULE 1: Symptom AI (Audio/Text)
 */
router.post('/module1/analyze', upload.single('audio_file'), async (req, res) => {
    try {
        const file = req.file;
        const { userId, textInput } = req.body;
        console.log(`🤖 AI Node Bridge: Module 1 invoked for user ${userId}`);

        let result;
        if (file) {
            console.log(`🎤 Audio payload received for Module 1: ${file.filename}`);
            result = await PythonService.executeModule1("", file.path);
        } else {
            result = await PythonService.executeModule1(textInput || "");
        }

        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            inference_context: 'Reasoning_Sys',
            result
        });
    } catch (error: any) {
        console.error('Module 1 Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Module 1 Failure' });
    }
});

/**
 * MODULE 2: Imaging AI (File Upload)
 */
router.post('/module2/scan', upload.single('medical_image'), async (req, res) => {
    try {
        const file = req.file;
        const { userId } = req.body;

        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No image payload detected' });
        }

        console.log(`📸 AI Node Bridge: Imaging payload received: ${file.filename}`);

        // Execute Imaging Pipeline
        const result = await PythonService.executeModule2(file.path);

        res.json({
            status: 'success',
            analysis_id: `SCAN-${Date.now()}`,
            original_payload: file.filename,
            ...result
        });

    } catch (error: any) {
        console.error('Module 2 Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Module 2 Failure' });
    }
});

/**
 * MODULE 3: DNA Analysis
 */
router.post('/module3/dna', upload.single('vcf_file'), async (req, res) => {
    try {
        const file = req.file;
        const { userId } = req.body;

        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No VCF payload detected' });
        }

        console.log(`🧬 AI Node Bridge: DNA payload received: ${file.filename}`);

        const result = await PythonService.executeModule3(file.path);

        res.json({
            status: 'success',
            ...result
        });
    } catch (error: any) {
        console.error('Module 3 Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Module 3 Failure' });
    }
});

/**
 * MODULE 4: Temporal Analysis
 */
router.post('/module4/temporal', async (req, res) => {
    try {
        const { userId, userData } = req.body;
        console.log(`⏳ AI Node Bridge: Module 4 invoked for user ${userId}`);

        const result = await PythonService.executeModule4(userData || {});

        res.json({
            status: 'success',
            ...result
        });
    } catch (error: any) {
        console.error('Module 4 Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Module 4 Failure' });
    }
});

/**
 * SAVE IMAGING RECORD
 */
router.post('/records/imaging/save', async (req, res) => {
    try {
        const { userId, patientId, imagePath, prediction, confidence, observations, analysisId } = req.body;

        const record = new ClinicalRecord({
            userId,
            patientId: patientId || 'SW-928',
            recordType: 'imaging',
            analysisId,
            moduleData: {
                imagePath,
                prediction,
                confidence,
                observations
            },
            clinicianNotes: observations,
            status: 'completed'
        });

        await record.save();

        res.json({
            status: 'success',
            message: 'Imaging record saved successfully',
            recordId: record._id
        });
    } catch (error: any) {
        console.error('Save Imaging Record Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to save record' });
    }
});

/**
 * SAVE GENOMICS RECORD
 */
router.post('/records/genomics/save', async (req, res) => {
    try {
        const { userId, patientId, vcfPath, variants, summary, interpretation, fileName } = req.body;

        const record = new ClinicalRecord({
            userId,
            patientId: patientId || 'SW-928',
            recordType: 'genomics',
            moduleData: {
                vcfPath: vcfPath || fileName,
                variants,
                summary,
                interpretation
            },
            clinicianNotes: interpretation,
            status: 'completed'
        });

        await record.save();

        res.json({
            status: 'success',
            message: 'Genomics record saved successfully',
            recordId: record._id
        });
    } catch (error: any) {
        console.error('Save Genomics Record Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to save record' });
    }
});

/**
 * SAVE SYMPTOM RECORD
 */
router.post('/records/symptom/save', async (req, res) => {
    try {
        const { userId, patientId, symptomText, aiResponse } = req.body;

        const record = new ClinicalRecord({
            userId,
            patientId: patientId || 'SW-928',
            recordType: 'symptom',
            moduleData: {
                symptomText,
                aiResponse
            },
            status: 'completed'
        });

        await record.save();

        res.json({
            status: 'success',
            message: 'Symptom record saved successfully',
            recordId: record._id
        });
    } catch (error: any) {
        console.error('Save Symptom Record Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to save record' });
    }
});

/**
 * GET USER RECORDS
 */
router.get('/records/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { recordType, patientId } = req.query;

        const query: any = { userId };
        if (recordType) query.recordType = recordType;
        if (patientId) query.patientId = patientId;

        const records = await ClinicalRecord.find(query)
            .sort({ timestamp: -1 })
            .limit(100);

        res.json({
            status: 'success',
            count: records.length,
            records
        });
    } catch (error: any) {
        console.error('Get Records Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to retrieve records' });
    }
});

/**
 * DOWNLOAD PDF REPORT
 */
router.get('/records/:recordId/pdf', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await ClinicalRecord.findById(recordId);

        if (!record) {
            return res.status(404).json({ status: 'error', message: 'Record not found' });
        }

        // Generate simple text-based report (you can enhance this with a PDF library later)
        const reportContent = `
CAREFUSION AI - CLINICAL REPORT
================================

Record ID: ${record._id}
Patient ID: ${record.patientId}
Record Type: ${record.recordType.toUpperCase()}
Date: ${record.timestamp.toISOString()}

${record.recordType === 'imaging' ? `
IMAGING ANALYSIS
----------------
Prediction: ${record.moduleData.prediction || 'N/A'}
Confidence: ${record.moduleData.confidence ? (record.moduleData.confidence * 100).toFixed(2) + '%' : 'N/A'}

Clinical Observations:
${record.moduleData.observations || 'No observations recorded'}
` : ''}

${record.recordType === 'genomics' ? `
GENOMIC ANALYSIS
----------------
VCF File: ${record.moduleData.vcfPath || 'N/A'}

Detected Variants:
${record.moduleData.variants?.join('\n') || 'No variants detected'}

Summary:
${record.moduleData.summary || 'No summary available'}

Clinical Interpretation:
${record.moduleData.interpretation || 'No interpretation recorded'}
` : ''}

${record.recordType === 'symptom' ? `
SYMPTOM ANALYSIS
----------------
Patient Input: ${record.moduleData.symptomText || 'N/A'}

AI Response:
${JSON.stringify(record.moduleData.aiResponse, null, 2)}
` : ''}

================================
Generated by CareFusion AI System
        `;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="clinical-report-${record._id}.txt"`);
        res.send(reportContent);

    } catch (error: any) {
        console.error('Download PDF Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to generate report' });
    }
});

export default router;

