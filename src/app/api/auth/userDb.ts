import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'mockUsers.json');

interface StoredUser {
  cccd: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  dob?: string;
  gender?: string;
  doctorId?: string;
}

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf8');
}

function readUsers(): Record<string, StoredUser> {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch (error) {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export function hashPassword(password: string) {
  return crypto.scryptSync(password, 'medagent_salt', 64).toString('hex');
}

export function findUser(cccd: string) {
  const users = readUsers();
  return users[cccd] || null;
}

export function saveUser(user: StoredUser) {
  const users = readUsers();
  users[user.cccd] = user;
  writeUsers(users);
}

export function getAllUsers() {
  return readUsers();
}
