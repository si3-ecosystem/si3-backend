"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/webcontent.routes.ts
const express_1 = require("express");
const webcontent_controller_1 = require("../controllers/webcontent.controller");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const router = (0, express_1.Router)();
router.post('/publish', protectMiddleware_1.protect, webcontent_controller_1.publishWebContent);
router.post('/update', protectMiddleware_1.protect, webcontent_controller_1.updateWebContent);
exports.default = router;
