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

    it('stores entries', () => {
        buffer.add(makeEntry({ id: 'c1', message: 'hello' }));

        const results = buffer.getAll();
        expect(results).toHaveLength(1);
        expect(results[0].message).toBe('hello');
    });

    it('returns entries in insertion order', () => {
        buffer.add(makeEntry({ id: 'c1', message: 'first' }));
        buffer.add(makeEntry({ id: 'c2', message: 'second' }));

        const results = buffer.getAll();
        expect(results[0].message).toBe('first');
        expect(results[1].message).toBe('second');
    });

    it('evicts oldest when full', () => {
        for (let i = 0; i < 6; i++) {
            buffer.add(makeEntry({ id: `c${i}`, message: `msg-${i}` }));
        }

        const results = buffer.getAll();
        expect(results).toHaveLength(5);
        expect(results.map((r) => r.message)).not.toContain('msg-0');
        expect(results[0].message).toBe('msg-1');
    });

    it('clears and returns count', () => {
        buffer.add(makeEntry({ id: 'c1' }));
        buffer.add(makeEntry({ id: 'c2' }));
        buffer.add(makeEntry({ id: 'c3' }));

        const count = buffer.clear();
        expect(count).toBe(3);
        expect(buffer.getAll()).toHaveLength(0);
    });

    it('getAll returns a copy, not a reference', () => {
        buffer.add(makeEntry({ id: 'c1' }));

        const first = buffer.getAll();
        const second = buffer.getAll();
        expect(first).not.toBe(second);
        expect(first).toEqual(second);
    });
});
