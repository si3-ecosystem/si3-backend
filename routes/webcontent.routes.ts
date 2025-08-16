// src/routes/webcontent.routes.ts
import { Router } from 'express'
import { publishWebContent, updateWebContent } from '../controllers/webcontent.controller'
import { protect } from '../middleware/protectMiddleware'

const router = Router()

router.post('/publish', protect, publishWebContent)
router.post('/update',  protect, updateWebContent)

export default router
