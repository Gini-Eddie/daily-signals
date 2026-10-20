// Creates only a missing personal owner account; never changes the habit store.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, scryptSync, createHash } = require('node:crypto');
require('dotenv').config({ quiet: true });
const email = process.env.OWNER_EMAIL || process.argv[2];
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Provide OWNER_EMAIL or an email argument.');
const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(dir, { recursive: true });
const accountFile = path.join(dir, 'account.json');
if (fs.existsSync(accountFile)) throw new Error('An account already exists. Nothing was changed.');
const password = randomBytes(18).toString('base64url');
const recovery = randomBytes(24).toString('hex');
const salt = randomBytes(16).toString('hex');
const account = { email: email.trim().toLowerCase(), password: salt + ':' + scryptSync(password, salt, 64).toString('hex'), recovery: createHash('sha256').update(recovery).digest('hex'), role: 'owner', must_change_password: true };
const accessFile = path.join(dir, 'owner-access.txt');
fs.writeFileSync(accessFile, `Daily Signals — private owner access\n\nEmail: ${account.email}\nInitial password: ${password}\nRecovery code: ${recovery}\n\nSign in and choose your own password. Save the recovery code in your password manager.\nThis file contains private credentials. Keep it private and delete it after saving them.\n`, { mode: 0o600, flag: 'wx' });
fs.writeFileSync(accountFile, JSON.stringify(account, null, 2), { mode: 0o600, flag: 'wx' });
console.log('Owner account created. Private credentials saved to: ' + accessFile);
