import { Router } from 'express';

const router = Router();

// Placeholder for Login
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    // Mock login logic
    res.json({
        token: 'eyJhbGciOiJIUzI1NiIsInR5...',
        user: {
            id: 'USR-129-XJ',
            email,
            role,
            fullName: 'Johnathan Doe'
        }
    });
});

export default router;
