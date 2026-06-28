import fs from 'fs';
import path from 'path';

// Resolve the database path relative to workspace root
const DB_PATH = path.join(process.cwd(), 'src/app/api/auth/mockUsers.json');

// Memory cache to keep in-memory sync fast (and support export const mockUsers object if needed by other components)
export const mockUsers: Record<string, any> = {};

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

export function getMockUsers(): Record<string, any> {
  ensureDbFile();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    
    // Sync memory cache
    Object.keys(mockUsers).forEach(key => delete mockUsers[key]);
    Object.assign(mockUsers, parsed);
    
    return parsed;
  } catch (e) {
    console.error("Failed to read mockUsers.json database:", e);
    return mockUsers;
  }
}

export function saveMockUser(cccd: string, user: any) {
  ensureDbFile();
  try {
    const users = getMockUsers();
    users[cccd] = user;
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    
    // Update memory cache
    mockUsers[cccd] = user;
  } catch (e) {
    console.error("Failed to write mockUsers.json database:", e);
  }
}
