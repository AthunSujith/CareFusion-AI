import express from 'express';
import multer from 'multer';
import { PythonService } from '../services/pythonService.js';
import ClinicalRecord from '../models/ClinicalRecord.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { getPatientDataPath, saveAnalysisResult } from '../utils/storage.js';

dotenv.config();

const router = express.Router();

// Professional medical data storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { patientId } = req.body;
        const pId = patientId || 'anonymous';

        let subfolder = 'vault';
        if (file.fieldname === 'audio_file') subfolder = 'audio';
        else if (file.fieldname === 'medical_image') subfolder = 'image/original_image';
        else if (file.fieldname === 'vcf_file') subfolder = 'DNA';

        const uploadDir = getPatientDataPath(pId, subfolder);

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
        const { patientId, textInput, userId } = req.body;
        const pId = patientId || 'anonymous';

        console.log(`🤖 AI Node Bridge: Module 1 invoked for patient ${pId}`);

        let result;
        if (file) {
            console.log(`🎤 Audio payload received for Module 1: ${file.path}`);
            result = await PythonService.executeModule1("", file.path);
        } else {
            result = await PythonService.executeModule1(textInput || "");
        }

        // Save result as JSON file for persistent review
        saveAnalysisResult(pId, '1', result);

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
        const { patientId, userId } = req.body;
        const pId = patientId || 'anonymous';

        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No image payload detected' });
        }

        console.log(`📸 AI Node Bridge: Imaging payload received: ${file.path}`);

        // Heatmap output directory
        const heatmapDir = getPatientDataPath(pId, 'image/heat_maps');
        if (!fs.existsSync(heatmapDir)) fs.mkdirSync(heatmapDir, { recursive: true });

        // Execute Imaging Pipeline
        const result = await PythonService.executeModule2(file.path, heatmapDir);

        // Save result as JSON file
        saveAnalysisResult(pId, '2', result);

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
        const { patientId, userId } = req.body;
        const pId = patientId || 'anonymous';

        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No VCF payload detected' });
        }

        console.log(`🧬 AI Node Bridge: DNA payload received: ${file.path}`);

        const result = await PythonService.executeModule3(file.path);

        // Save result as JSON file
        saveAnalysisResult(pId, '3', result);

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
router.post('/module4/temporal', upload.single('audio_file'), async (req, res) => {
    try {
        const file = req.file;
        const { patientId, textInput, userId } = req.body;
        const pId = patientId || 'anonymous';

        console.log(`⏳ AI Node Bridge: Module 4 invoked for patient ${pId}`);

        let observation = textInput || "";
        if (file) {
            // If audio is sent, we should transcribe it or pass to Module 4 if it handles audio
            // For now, Module 4 temporal_analysis.py takes user_id and observation_text
            // We'll use Module 1's audio_text function via PythonService if needed, but the user said
            // "audio is sent, saves, and then it goes to module 4 script"
            console.log(`🎤 Temporal audio received: ${file.path}`);
            // We'll pass the file path as the observation for now, or use automated transcription
            observation = `[AUDIO_OBSERVATION] ${file.path}`;
        }

        const result = await PythonService.executeModule4(pId, observation);

        // Save result as JSON file
        saveAnalysisResult(pId, '4', result);

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
        console.log('📝 Saving Imaging Record:', req.body);
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
        console.log('📝 Saving Genomics Record:', req.body);
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
        console.log('📝 Saving Symptom Record:', req.body);
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

/**
 * GENERAL AI CHAT: MedGemma 1.5 4B (Text/PDF)
 */
router.post('/chat/general', upload.single('pdf_doc'), async (req, res) => {
    try {
        const file = req.file;
        const { prompt, patientId } = req.body;
        const pId = patientId || 'anonymous';

        console.log(`💬 AI Chat Node: General query received (PDF: ${!!file})`);

        const result = await PythonService.executeGeneralChat(prompt || "Please summarize the document.", file?.path);

        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            result
        });
    } catch (error: any) {
        console.error('General Chat Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'General Chat Failure' });
    }
});

export default router;

