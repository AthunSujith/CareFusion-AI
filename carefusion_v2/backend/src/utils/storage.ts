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
        'image',
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
            fs.mkdirSync(folderPath);
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
