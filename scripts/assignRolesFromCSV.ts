import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, closeConnection } from '../config/db';
import UserModel, { UserRole } from '../models/usersModel';

dotenv.config();

// Simple, safe CSV line splitter that handles quoted fields and commas inside quotes
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Handle escaped quotes "" inside quoted field
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((s) => s.trim().replace(/^"|"$/g, ''));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function readEmailsFromCSV(filePath: string): Promise<string[]> {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`CSV file not found: ${absPath}`);
  }
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Handle BOM in first line if present
  lines[0] = lines[0].replace(/^\ufeff/, '');

  const header = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf('email');
  if (emailIdx === -1) {
    throw new Error('CSV header must contain an "email" column');
  }

  const emails: Set<string> = new Set();
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (emailIdx < cols.length) {
      const email = (cols[emailIdx] || '').trim();
      if (email) emails.add(email);
    }
  }
  return Array.from(emails);
}

async function assignRoleToEmails(emails: string[], role: UserRole, dryRun = false) {
  let updated = 0;
  let alreadyHad = 0;
  let notFound: string[] = [];

  for (const rawEmail of emails) {
    const email = rawEmail.trim();
    if (!email) continue;

    // Case-insensitive exact match on email
    const emailRegex = new RegExp(`^${escapeRegExp(email)}$`, 'i');

    const user = await UserModel.findOne({ email: emailRegex }).select('email roles');
    if (!user) {
      notFound.push(email);
      continue;
    }

    const hasRole = (user.roles || []).includes(role);
    if (dryRun) {
      if (!hasRole) updated++;
      else alreadyHad++;
      continue;
    }

    if (!hasRole) {
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $addToSet: { roles: role }, settingsUpdatedAt: new Date() },
        { new: true }
      ).select('email roles');
      if (updatedUser) updated++;
    } else {
      alreadyHad++;
    }
  }

  return { updated, alreadyHad, notFound };
}

async function main() {
  const args = process.argv.slice(2);
  const fileArgIdx = Math.max(args.indexOf('--file'), args.indexOf('-f'));
  const roleArgIdx = Math.max(args.indexOf('--role'), args.indexOf('-r'));
  const dryRun = args.includes('--dry-run');

  const filePath = fileArgIdx !== -1 && args[fileArgIdx + 1] ? args[fileArgIdx + 1] : 'Grow3dge Members.csv';
  const roleStr = roleArgIdx !== -1 && args[roleArgIdx + 1] ? args[roleArgIdx + 1] : 'partner';

  if (!Object.values<string>(UserRole as any).includes(roleStr)) {
    console.error(`Invalid role: ${roleStr}. Allowed: ${Object.values(UserRole).join(', ')}`);
    process.exit(1);
  }
  const role = roleStr as UserRole;

  console.log(`\n➡️  Assigning role "${role}" from CSV: ${filePath}${dryRun ? ' (dry-run)' : ''}`);

  await connectDB();
  try {
    const emails = await readEmailsFromCSV(filePath);
    console.log(`Found ${emails.length} unique email(s) in CSV`);

    const { updated, alreadyHad, notFound } = await assignRoleToEmails(emails, role, dryRun);

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
    } else if (dryRun) {
      console.log('\nℹ️  Dry-run complete. No changes were made.');
    }
  } catch (err) {
    console.error('❌ Failed to assign roles from CSV:', err);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  main();
}

