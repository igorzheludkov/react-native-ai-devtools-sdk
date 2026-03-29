import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConsoleBuffer } from '../src/consoleBuffer';
import { patchConsole, unpatchConsole } from '../src/consoleInterceptor';

describe('consoleInterceptor', () => {
    let buffer: ConsoleBuffer;
    let originalLog: typeof console.log;
    let originalWarn: typeof console.warn;
    let originalError: typeof console.error;

    beforeEach(() => {
        unpatchConsole();
        buffer = new ConsoleBuffer();
        originalLog = console.log;
        originalWarn = console.warn;
        originalError = console.error;
    });

    afterEach(() => {
        unpatchConsole();
    });

    it('captures console.log', () => {
        patchConsole(buffer);
        console.log('hello world');

        const entries = buffer.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe('log');
        expect(entries[0].message).toBe('hello world');
    });

    it('captures console.warn', () => {
        patchConsole(buffer);
        console.warn('warning message');

        const entries = buffer.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe('warn');
        expect(entries[0].message).toBe('warning message');
    });

    it('captures console.error', () => {
        patchConsole(buffer);
        console.error('error occurred');

        const entries = buffer.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe('error');
        expect(entries[0].message).toBe('error occurred');
    });

    it('captures console.info', () => {
        patchConsole(buffer);
        console.info('info message');

        const entries = buffer.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe('info');
    });

    it('captures console.debug', () => {
        patchConsole(buffer);
        console.debug('debug message');

        const entries = buffer.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe('debug');
    });

    it('formats multiple arguments', () => {
        patchConsole(buffer);
        console.log('count:', 42, { key: 'value' });

        const entries = buffer.getAll();
        expect(entries[0].message).toBe('count: 42 {"key":"value"}');
    });

    it('preserves original console output', () => {
        const mockLog = jest.fn() as jest.Mock<(...args: unknown[]) => void>;
        console.log = mockLog;

        patchConsole(buffer);
        console.log('test');

        expect(mockLog).toHaveBeenCalledWith('test');
    });

    it('unpatchConsole restores originals', () => {
        patchConsole(buffer);
        expect(console.log).not.toBe(originalLog);

        unpatchConsole();
        expect(console.log).toBe(originalLog);
        expect(console.warn).toBe(originalWarn);
        expect(console.error).toBe(originalError);
    });

    it('is idempotent', () => {
        patchConsole(buffer);
        const patched = console.log;

        patchConsole(buffer);
        expect(console.log).toBe(patched);
    });
});
