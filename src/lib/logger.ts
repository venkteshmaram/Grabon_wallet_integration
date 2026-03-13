import fs from 'fs';
import path from 'path';

export function logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug.log'), logEntry);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
}
