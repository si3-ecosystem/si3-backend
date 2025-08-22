"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class EncryptionService {
    constructor() {
        this.algorithm = "aes-256-gcm";
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.secretKey = process.env.ENCRYPTION_SECRET || "your-secret-key-here";
    }
    // Generate random bytes
    generateRandomBytes(length = 32) {
        return crypto_1.default.randomBytes(length);
    }
    // Generate random string
    generateRandomString(length = 32) {
        return crypto_1.default.randomBytes(length).toString("hex");
    }
    // Generate UUID
    generateUUID() {
        return crypto_1.default.randomUUID();
    }
    // Hash password with bcrypt
    hashPassword(password_1) {
        return __awaiter(this, arguments, void 0, function* (password, saltRounds = 12) {
            try {
                return yield bcryptjs_1.default.hash(password, saltRounds);
            }
            catch (error) {
                throw new Error("Password hashing failed");
            }
        });
    }
    // Compare password with hash
    comparePassword(password, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield bcryptjs_1.default.compare(password, hash);
            }
            catch (error) {
                throw new Error("Password comparison failed");
            }
        });
    }
    // Generate JWT token
    generateToken(payload, expiresIn = "7d") {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("JWT_SECRET environment variable is not set");
            }
            const options = {
                expiresIn: expiresIn,
                issuer: process.env.JWT_ISSUER || "your-app",
                audience: process.env.JWT_AUDIENCE || "your-app-users",
            };
            return jsonwebtoken_1.default.sign(payload, jwtSecret, options);
        }
        catch (error) {
            throw new Error("Token generation failed");
        }
    }
    // Verify JWT token
    verifyToken(token) {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            console.log('[encryption] JWT_SECRET available:', !!jwtSecret);
            console.log('[encryption] Token length:', token === null || token === void 0 ? void 0 : token.length);
            if (!jwtSecret) {
                console.log('[encryption] JWT_SECRET not found in environment');
                throw new Error("JWT_SECRET environment variable is not set");
            }
            const result = jsonwebtoken_1.default.verify(token, jwtSecret);
            console.log('[encryption] Token verification successful');
            return result;
        }
        catch (error) {
            console.log('[encryption] Token verification error:', error instanceof Error ? error.message : 'Unknown error');
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Token has expired");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("Invalid token");
            }
            else {
                throw new Error("Token verification failed");
            }
        }
    }
    // Generate refresh token
    generateRefreshToken() {
        return this.generateRandomString(64);
    }
    // Encrypt data
    encrypt(text) {
        try {
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const key = crypto_1.default.scryptSync(this.secretKey, "salt", this.keyLength);
            const cipher = crypto_1.default.createCipheriv(this.algorithm, key, iv);
            cipher.setAAD(Buffer.from("additional-auth-data"));
            let encrypted = cipher.update(text, "utf8", "hex");
            encrypted += cipher.final("hex");
            const authTag = cipher.getAuthTag();
            return {
                encrypted,
                iv: iv.toString("hex"),
                authTag: authTag.toString("hex"),
            };
        }
        catch (error) {
            throw new Error("Encryption failed");
        }
    }
    // Decrypt data
    decrypt(encryptedData) {
        try {
            const { encrypted, iv, authTag } = encryptedData;
            const key = crypto_1.default.scryptSync(this.secretKey, "salt", this.keyLength);
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, key, Buffer.from(iv, "hex"));
            decipher.setAAD(Buffer.from("additional-auth-data"));
            decipher.setAuthTag(Buffer.from(authTag, "hex"));
            let decrypted = decipher.update(encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        }
        catch (error) {
            throw new Error("Decryption failed");
        }
    }
    // Hash data with SHA-256
    hashSHA256(data) {
        return crypto_1.default.createHash("sha256").update(data).digest("hex");
    }
    // Hash data with SHA-512
    hashSHA512(data) {
        return crypto_1.default.createHash("sha512").update(data).digest("hex");
    }
    // Create HMAC
    createHMAC(data, secret = this.secretKey) {
        return crypto_1.default.createHmac("sha256", secret).update(data).digest("hex");
    }
    // Verify HMAC
    verifyHMAC(data, signature, secret = this.secretKey) {
        const expectedSignature = this.createHMAC(data, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
    }
    // Generate secure random password
    generateSecurePassword(length = 16) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto_1.default.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        return password;
    }
    // Generate OTP
    generateOTP(length = 6) {
        const digits = "0123456789";
        let otp = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto_1.default.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }
        return otp;
    }
    // Constant time string comparison
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }
}
exports.EncryptionService = EncryptionService;
const encryptionService = new EncryptionService();
exports.default = encryptionService;
