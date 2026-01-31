import fs from 'fs';
import path from 'path';

const BASE_DATA_DIR = 'C:\\CareFusion-AI\\data';

/**
 * Ensures the standard folder structure exists for a specific patient.
 * @param patientId Unique ID of the patient
 */
export const initializePatientStorage = (patientId: string) => {
    const patientDir = path.join(BASE_DATA_DIR, patientId);

    // Subfolders required by the architectural spec
    const subfolders = [
        'analysis',
        'DNA',
        'image/original_image',
        'image/heat_maps',
        'logs',
        'AI_chat',
        'audio',
        'documentation',
        'lab_reports'
    ];

    if (!fs.existsSync(patientDir)) {
        fs.mkdirSync(patientDir, { recursive: true });
    }

    subfolders.forEach(folder => {
        const folderPath = path.join(patientDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });

    return patientDir;
};

/**
 * Gets the absolute path for a specific data type for a patient.
 */
export const getPatientDataPath = (patientId: string, type: string) => {
    return path.join(BASE_DATA_DIR, patientId, type);
};

/**
 * Saves AI analysis result to a JSON file in the patient's analysis folder.
 */
export const saveAnalysisResult = (patientId: string, moduleName: string, data: any) => {
    const analysisDir = getPatientDataPath(patientId, 'analysis');
    if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analysis_module${moduleName}_${timestamp}.json`;
    const filePath = path.join(analysisDir, filename);

    const payload = {
        patientId,
        timestamp: new Date().toISOString(),
        analysis_type: `module${moduleName}`,
        analysis_output: data
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return filePath;
};
