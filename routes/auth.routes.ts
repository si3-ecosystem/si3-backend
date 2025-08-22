// src/routes/auth.routes.ts
import  Router  from 'express';
import {
  checkAuth as validateToken,
  verifyEmailOTP as loginUser,
} from '../controllers/authController';

// Stub function for approveUser
const approveUser = (req: any, res: any) => {
  res.status(200).json({ message: 'User approved' });
};
import { protect } from '../middleware/protectMiddleware';

const router = Router();

router.get('/approve', approveUser);
router.post('/login', loginUser);
router.get('/validate-token', protect, validateToken);

export default router;
