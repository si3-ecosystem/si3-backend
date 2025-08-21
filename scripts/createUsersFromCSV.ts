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

interface CSVUser {
  email: string;
  wallet_address?: string;
  first_name?: string;
  last_name?: string;
  do_not_contact?: boolean;
}

async function parseCSVUsers(filePath: string): Promise<CSVUser[]> {
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
  const walletIdx = header.indexOf('wallet_address');
  const firstNameIdx = header.indexOf('first_name');
  const lastNameIdx = header.indexOf('last_name');
  const doNotContactIdx = header.indexOf('do_not_contact');

  if (emailIdx === -1) {
    throw new Error('CSV header must contain an "email" column');
  }

  const users: CSVUser[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const email = (cols[emailIdx] || '').trim();
    if (!email) continue;

    const doNotContact = doNotContactIdx !== -1 ? 
      (cols[doNotContactIdx] || '').toLowerCase() === 'true' : false;
    
    // Skip users who don't want to be contacted
    if (doNotContact) {
      console.log(`⏭️  Skipping ${email} (do_not_contact: true)`);
      continue;
    }

    const user: CSVUser = { email };
    
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
}

function generateUsername(firstName?: string, lastName?: string, email?: string): string | undefined {
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

async function createUsersFromCSV(users: CSVUser[], role: UserRole, dryRun = false) {
  let created = 0;
  let alreadyExists = 0;
  let errors: string[] = [];

  for (const csvUser of users) {
    try {
      // Check if user already exists (case-insensitive)
      const emailRegex = new RegExp(`^${escapeRegExp(csvUser.email)}$`, 'i');
      const existingUser = await UserModel.findOne({ email: emailRegex });
      
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
      
      const newUser = new UserModel({
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

      await newUser.save();
      created++;
      
      console.log(`✅ Created user: ${csvUser.email} with role: ${role}`);
      
    } catch (error) {
      const errorMsg = `Failed to create ${csvUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  return { created, alreadyExists, errors };
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

  console.log(`\n🚀 Creating users with role "${role}" from CSV: ${filePath}${dryRun ? ' (dry-run)' : ''}`);

  await connectDB();
  try {
    const users = await parseCSVUsers(filePath);
    console.log(`Found ${users.length} valid user(s) in CSV (after filtering do_not_contact)`);

    const { created, alreadyExists, errors } = await createUsersFromCSV(users, role, dryRun);

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
    } else if (dryRun) {
      console.log('\nℹ️  Dry-run complete. No users were created.');
    }
  } catch (err) {
    console.error('❌ Failed to create users from CSV:', err);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  main();
}
