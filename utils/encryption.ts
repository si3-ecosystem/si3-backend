import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

interface TokenPayload {
  [key: string]: any;
}

class EncryptionService {
  private readonly algorithm: string = "aes-256-gcm";
  private readonly keyLength: number = 32; // 256 bits
  private readonly ivLength: number = 16; // 128 bits
  private readonly secretKey: string;

  constructor() {
    this.secretKey = process.env.ENCRYPTION_SECRET || "your-secret-key-here";
  }

  // Generate random bytes
  generateRandomBytes(length: number = 32): Buffer {
    return crypto.randomBytes(length);
  }

  // Generate random string
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  // Generate UUID
  generateUUID(): string {
    return crypto.randomUUID();
  }

  // Hash password with bcrypt
  async hashPassword(
    password: string,
    saltRounds: number = 12
  ): Promise<string> {
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error("Password hashing failed");
    }
  }

  // Compare password with hash
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error("Password comparison failed");
    }
  }

  // Generate JWT token
  generateToken(payload: TokenPayload, expiresIn = "7d"): string {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      const options: jwt.SignOptions = {
        expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
        issuer: process.env.JWT_ISSUER || "your-app",
        audience: process.env.JWT_AUDIENCE || "your-app-users",
      };

      return jwt.sign(payload, jwtSecret, options);
    } catch (error) {
      throw new Error("Token generation failed");
    }
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      return jwt.verify(token, jwtSecret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      } else {
        throw new Error("Token verification failed");
      }
    }
  }

  // Generate refresh token
  generateRefreshToken(): string {
    return this.generateRandomString(64);
  }

  // Encrypt data
  encrypt(text: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const key = crypto.scryptSync(this.secretKey, "salt", this.keyLength);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        key,
        iv
      ) as crypto.CipherGCM;
      cipher.setAAD(Buffer.from("additional-auth-data"));

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      throw new Error("Encryption failed");
    }
  }

  // Decrypt data
  decrypt(encryptedData: EncryptedData): string {
    try {
      const { encrypted, iv, authTag } = encryptedData;

      const key = crypto.scryptSync(this.secretKey, "salt", this.keyLength);
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, "hex")
      ) as crypto.DecipherGCM;
      decipher.setAAD(Buffer.from("additional-auth-data"));
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error("Decryption failed");
    }
  }

  // Hash data with SHA-256
  hashSHA256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  // Hash data with SHA-512
  hashSHA512(data: string): string {
    return crypto.createHash("sha512").update(data).digest("hex");
  }

  // Create HMAC
  createHMAC(data: string, secret: string = this.secretKey): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  // Verify HMAC
  verifyHMAC(
    data: string,
    signature: string,
    secret: string = this.secretKey
  ): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  }

  // Generate secure random password
  generateSecurePassword(length: number = 16): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  // Generate OTP
  generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }

    return otp;
  }

  // Constant time string comparison
  constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

const encryptionService = new EncryptionService();

export default encryptionService;
export { EncryptionService, type EncryptedData, type TokenPayload };
