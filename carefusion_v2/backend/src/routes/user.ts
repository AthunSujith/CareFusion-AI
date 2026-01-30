import { Router } from 'express';

const router = Router();

router.get('/me', (req, res) => {
    res.json({
        id: 'USR-129-XJ',
        fullName: 'Johnathan Doe',
        role: 'patient',
        bloodType: 'O+',
        age: 34
    });
});

export default router;
