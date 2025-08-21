"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../config/db");
const usersModel_1 = __importStar(require("../models/usersModel"));
dotenv_1.default.config();
// Simple, safe CSV line splitter that handles quoted fields and commas inside quotes
function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            // Handle escaped quotes "" inside quoted field
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // skip next quote
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current);
    return result.map((s) => s.trim().replace(/^"|"$/g, ''));
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function parseCSVUsers(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const absPath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.resolve(process.cwd(), filePath);
        if (!fs_1.default.existsSync(absPath)) {
            throw new Error(`CSV file not found: ${absPath}`);
        }
        const content = fs_1.default.readFileSync(absPath, 'utf8');
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0)
            return [];
        // Handle BOM in first line if present
        lines[0] = lines[0].replace(/^\ufeff/, '');
        const header = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
        const emailIdx = header.indexOf('email');
        const walletIdx = header.indexOf('wallet_address');
        const firstNameIdx = header.indexOf('first_name');
        const lastNameIdx = header.indexOf('last_name');
        const doNotContactIdx = header.indexOf('do_not_contact');
        if (emailIdx === -1) {
            throw new Error('CSV header must contain an "email" column');
        }
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = splitCSVLine(lines[i]);
            const email = (cols[emailIdx] || '').trim();
            if (!email)
                continue;
            const doNotContact = doNotContactIdx !== -1 ?
                (cols[doNotContactIdx] || '').toLowerCase() === 'true' : false;
            // Skip users who don't want to be contacted
            if (doNotContact) {
                console.log(`⏭️  Skipping ${email} (do_not_contact: true)`);
                continue;
            }
            const user = { email };
            if (walletIdx !== -1 && cols[walletIdx]) {
                user.wallet_address = cols[walletIdx].trim();
            }
            if (firstNameIdx !== -1 && cols[firstNameIdx]) {
                user.first_name = cols[firstNameIdx].trim();
            }
            if (lastNameIdx !== -1 && cols[lastNameIdx]) {
                user.last_name = cols[lastNameIdx].trim();
            }
            users.push(user);
        }
        return users;
    });
}
function generateUsername(firstName, lastName, email) {
    if (firstName && lastName) {
        return `${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/[^a-z0-9_-]/g, '');
    }
    if (firstName) {
        return firstName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }
    if (email) {
        const emailPart = email.split('@')[0];
        return emailPart.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }
    return undefined;
}
function createUsersFromCSV(users_1, role_1) {
    return __awaiter(this, arguments, void 0, function* (users, role, dryRun = false) {
        let created = 0;
        let alreadyExists = 0;
        let errors = [];
        for (const csvUser of users) {
            try {
                // Check if user already exists (case-insensitive)
                const emailRegex = new RegExp(`^${escapeRegExp(csvUser.email)}$`, 'i');
                const existingUser = yield usersModel_1.default.findOne({ email: emailRegex });
                if (existingUser) {
                    alreadyExists++;
                    continue;
                }
                if (dryRun) {
                    created++;
                    continue;
                }
                // Create new user
                const username = generateUsername(csvUser.first_name, csvUser.last_name, csvUser.email);
                const newUser = new usersModel_1.default({
                    email: csvUser.email,
                    username: username,
                    roles: [role],
                    isVerified: false,
                    isWalletVerified: false,
                    newsletter: true,
                    interests: [],
                    personalValues: [],
                    digitalLinks: [],
                    wallet_address: csvUser.wallet_address || undefined,
                    notificationSettings: {
                        emailUpdates: true,
                        sessionReminder: true,
                        marketingEmails: false,
                        weeklyDigest: true,
                        eventAnnouncements: true,
                    },
                });
                yield newUser.save();
                created++;
                console.log(`✅ Created user: ${csvUser.email} with role: ${role}`);
            }
            catch (error) {
                const errorMsg = `Failed to create ${csvUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }
        return { created, alreadyExists, errors };
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const fileArgIdx = Math.max(args.indexOf('--file'), args.indexOf('-f'));
        const roleArgIdx = Math.max(args.indexOf('--role'), args.indexOf('-r'));
        const dryRun = args.includes('--dry-run');
        const filePath = fileArgIdx !== -1 && args[fileArgIdx + 1] ? args[fileArgIdx + 1] : 'Grow3dge Members.csv';
        const roleStr = roleArgIdx !== -1 && args[roleArgIdx + 1] ? args[roleArgIdx + 1] : 'partner';
        if (!Object.values(usersModel_1.UserRole).includes(roleStr)) {
            console.error(`Invalid role: ${roleStr}. Allowed: ${Object.values(usersModel_1.UserRole).join(', ')}`);
            process.exit(1);
        }
        const role = roleStr;
        console.log(`\n🚀 Creating users with role "${role}" from CSV: ${filePath}${dryRun ? ' (dry-run)' : ''}`);
        yield (0, db_1.connectDB)();
        try {
            const users = yield parseCSVUsers(filePath);
            console.log(`Found ${users.length} valid user(s) in CSV (after filtering do_not_contact)`);
            const { created, alreadyExists, errors } = yield createUsersFromCSV(users, role, dryRun);
            console.log('\n📊 Summary');
            console.log(` - Users created with role "${role}": ${created}`);
            console.log(` - Users that already exist: ${alreadyExists}`);
            console.log(` - Errors: ${errors.length}`);
            if (errors.length > 0) {
                console.log('\n❌ Errors:');
                errors.forEach(error => console.log(`   • ${error}`));
            }
            if (!dryRun && created > 0) {
                console.log('\n✅ User creation completed.');
            }
            else if (dryRun) {
                console.log('\nℹ️  Dry-run complete. No users were created.');
            }
        }
        catch (err) {
            console.error('❌ Failed to create users from CSV:', err);
            process.exitCode = 1;
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
if (require.main === module) {
    main();
}
