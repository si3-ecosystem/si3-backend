// src/routes/domain.routes.ts
import { Router } from 'express'
import { publishDomain } from '../controllers/domain.controller'
import { protect } from '../middleware/protectMiddleware'

const router = Router()

router.post('/publish', protect, publishDomain)

export default router