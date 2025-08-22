"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/domain.routes.ts
const express_1 = require("express");
const domain_controller_1 = require("../controllers/domain.controller");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const router = (0, express_1.Router)();
router.post('/publish', protectMiddleware_1.protect, domain_controller_1.publishDomain);
exports.default = router;
