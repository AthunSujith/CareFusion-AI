import Patient from '../models/Patient.js';
import { initializePatientStorage } from '../utils/storage.js';
import { upload } from '../utils/upload.js';


const router = Router();

// Create new patient and their data structure
router.post('/register', async (req, res) => {
    try {
        const patientData = req.body;

        // 1. Save to Database
        const newPatient = new Patient(patientData);
        await newPatient.save();

        // 2. Initialize physical folder structure
        const storagePath = initializePatientStorage(newPatient.patientId);

        res.status(201).json({
            message: 'Patient registered and storage initialized',
            patient: newPatient,
            storagePath
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get patient details
router.get('/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.id });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Upload document to patient folder
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { patientId, folderType } = req.body;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        res.json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            path: req.file.path,
            type: folderType
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

