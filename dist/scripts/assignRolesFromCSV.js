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
function readEmailsFromCSV(filePath) {
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
        if (emailIdx === -1) {
            throw new Error('CSV header must contain an "email" column');
        }
        const emails = new Set();
        for (let i = 1; i < lines.length; i++) {
            const cols = splitCSVLine(lines[i]);
            if (emailIdx < cols.length) {
                const email = (cols[emailIdx] || '').trim();
                if (email)
                    emails.add(email);
            }
        }
        return Array.from(emails);
    });
}
function assignRoleToEmails(emails_1, role_1) {
    return __awaiter(this, arguments, void 0, function* (emails, role, dryRun = false) {
        let updated = 0;
        let alreadyHad = 0;
        let notFound = [];
        for (const rawEmail of emails) {
            const email = rawEmail.trim();
            if (!email)
                continue;
            // Case-insensitive exact match on email
            const emailRegex = new RegExp(`^${escapeRegExp(email)}$`, 'i');
            const user = yield usersModel_1.default.findOne({ email: emailRegex }).select('email roles');
            if (!user) {
                notFound.push(email);
                continue;
            }
            const hasRole = (user.roles || []).includes(role);
            if (dryRun) {
                if (!hasRole)
                    updated++;
                else
                    alreadyHad++;
                continue;
            }
            if (!hasRole) {
                const updatedUser = yield usersModel_1.default.findOneAndUpdate({ _id: user._id }, { $addToSet: { roles: role }, settingsUpdatedAt: new Date() }, { new: true }).select('email roles');
                if (updatedUser)
                    updated++;
            }
            else {
                alreadyHad++;
            }
        }
        return { updated, alreadyHad, notFound };
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
        console.log(`\n➡️  Assigning role "${role}" from CSV: ${filePath}${dryRun ? ' (dry-run)' : ''}`);
        yield (0, db_1.connectDB)();
        try {
            const emails = yield readEmailsFromCSV(filePath);
            console.log(`Found ${emails.length} unique email(s) in CSV`);
            const { updated, alreadyHad, notFound } = yield assignRoleToEmails(emails, role, dryRun);
            console.log('\n📊 Summary');
            console.log(` - Users updated with role "${role}": ${updated}`);
            console.log(` - Users that already had role: ${alreadyHad}`);
            console.log(` - Emails with no matching user: ${notFound.length}`);
            if (notFound.length > 0) {
                console.log('   (showing up to first 20)');
                notFound.slice(0, 20).forEach((e) => console.log(`   • ${e}`));
            }
            if (!dryRun && updated > 0) {
                console.log('\n✅ Role assignment completed.');
            }
            else if (dryRun) {
                console.log('\nℹ️  Dry-run complete. No changes were made.');
            }
        }
        catch (err) {
            console.error('❌ Failed to assign roles from CSV:', err);
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
