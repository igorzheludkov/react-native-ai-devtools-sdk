import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConsoleBuffer } from '../src/consoleBuffer';
import { ConsoleEntry } from '../src/types';

function makeEntry(overrides: Partial<ConsoleEntry> = {}): ConsoleEntry {
    return {
        id: overrides.id ?? `test-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: overrides.timestamp ?? Date.now(),
        level: 'log',
        message: 'test message',
        ...overrides,
    };
}

describe('ConsoleBuffer', () => {
    let buffer: ConsoleBuffer;

    beforeEach(() => {
        buffer = new ConsoleBuffer(5);
    });

    it('stores and retrieves entries', () => {
        buffer.add(makeEntry({ id: 'c1', message: 'hello' }));

        const results = buffer.query();
        expect(results).toHaveLength(1);
        expect(results[0].message).toBe('hello');
    });

    it('returns entries newest first', () => {
        buffer.add(makeEntry({ id: 'c1', message: 'first' }));
        buffer.add(makeEntry({ id: 'c2', message: 'second' }));

        const results = buffer.query();
        expect(results[0].message).toBe('second');
        expect(results[1].message).toBe('first');
    });

    it('evicts oldest when full', () => {
        for (let i = 0; i < 6; i++) {
            buffer.add(makeEntry({ id: `c${i}`, message: `msg-${i}` }));
        }

        const results = buffer.query();
        expect(results).toHaveLength(5);
        // oldest (msg-0) should be evicted
        expect(results.map((r) => r.message)).not.toContain('msg-0');
        expect(results[0].message).toBe('msg-5');
    });

    it('filters by level', () => {
        buffer.add(makeEntry({ id: 'c1', level: 'log', message: 'info msg' }));
        buffer.add(makeEntry({ id: 'c2', level: 'error', message: 'err msg' }));
        buffer.add(makeEntry({ id: 'c3', level: 'warn', message: 'warn msg' }));

        const errors = buffer.query({ level: 'error' });
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('err msg');
    });

    it('filters by text (case-insensitive)', () => {
        buffer.add(makeEntry({ id: 'c1', message: 'User logged in' }));
        buffer.add(makeEntry({ id: 'c2', message: 'Network error occurred' }));
        buffer.add(makeEntry({ id: 'c3', message: 'user signed out' }));

        const results = buffer.query({ text: 'USER' });
        expect(results).toHaveLength(2);
    });

    it('limits results with count', () => {
        buffer.add(makeEntry({ id: 'c1' }));
        buffer.add(makeEntry({ id: 'c2' }));
        buffer.add(makeEntry({ id: 'c3' }));

        const results = buffer.query({ count: 2 });
        expect(results).toHaveLength(2);
    });

    it('combines filters', () => {
        buffer.add(makeEntry({ id: 'c1', level: 'error', message: 'auth failed' }));
        buffer.add(makeEntry({ id: 'c2', level: 'error', message: 'network timeout' }));
        buffer.add(makeEntry({ id: 'c3', level: 'log', message: 'auth success' }));

        const results = buffer.query({ level: 'error', text: 'auth' });
        expect(results).toHaveLength(1);
        expect(results[0].message).toBe('auth failed');
    });

    it('getStats returns level breakdown', () => {
        buffer.add(makeEntry({ id: 'c1', level: 'log' }));
        buffer.add(makeEntry({ id: 'c2', level: 'error' }));
        buffer.add(makeEntry({ id: 'c3', level: 'error' }));
        buffer.add(makeEntry({ id: 'c4', level: 'warn' }));

        const stats = buffer.getStats();
        expect(stats.total).toBe(4);
        expect(stats.byLevel).toEqual({ log: 1, error: 2, warn: 1 });
    });

    it('clears and returns count', () => {
        buffer.add(makeEntry({ id: 'c1' }));
        buffer.add(makeEntry({ id: 'c2' }));
        buffer.add(makeEntry({ id: 'c3' }));

        const count = buffer.clear();
        expect(count).toBe(3);
        expect(buffer.query()).toHaveLength(0);
    });
});
