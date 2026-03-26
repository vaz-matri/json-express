import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Prevent top-level await from crashing the process before the mock takes over
const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(join(__dirname, '../fixtures'));

import { logServerStart, logPortChangeMessage } from '../../src/services/logger-service.js';

// Mock the config module and jsonRoutes so we can control what the logger sees
vi.mock('../../src/db/config-store.js', () => ({
    getConfig: vi.fn((key) => {
        if (key === 'port') return 3000;
        if (key === 'protocol') return 'http';
    })
}));

vi.mock('../../src/services/json-routes-service.js', () => ({
    default: { users: {}, posts: {} }
}));

describe('Logger Service (logger-service.js)', () => {
    let consoleSpy;

    beforeEach(() => {
        // Spy on console.log and prevent it from actually printing during tests
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        vi.clearAllMocks();
    });

    describe('logServerStart', () => {
        it('should log standard HTTP startup messages', () => {
            logServerStart();
            
            // Should be called 3 times (messages + empty line)
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            expect(consoleSpy).toHaveBeenCalledWith('🚀 Server running on http://localhost:3000');
            expect(consoleSpy).toHaveBeenCalledWith('💚 Health check: http://localhost:3000/health');
        });
    });

    describe('logPortChangeMessage', () => {
        it('should log a warning if the port changed', () => {
            // Our mock returns 3000 as the mapped port
            logPortChangeMessage(8080); // Simulate that user originally requested 8080
            
            expect(consoleSpy).toHaveBeenCalledWith('⚠️  Port 8080 was busy, using 3000 instead');
        });

        it('should not log a warning if the port matches exactly', () => {
            logPortChangeMessage(3000); 
            
            // Should only log the empty spacer line `console.log()`
            expect(consoleSpy).toHaveBeenCalledTimes(1); 
            expect(consoleSpy).toHaveBeenCalledWith(); 
        });
    });
});
