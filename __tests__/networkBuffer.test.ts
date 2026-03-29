import { describe, it, expect, beforeEach } from '@jest/globals';
import { NetworkBuffer } from '../src/networkBuffer';
import { NetworkEntry } from '../src/types';

function makeEntry(overrides: Partial<NetworkEntry> = {}): NetworkEntry {
    return {
        id: overrides.id ?? `test-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: overrides.timestamp ?? Date.now(),
        method: 'GET',
        url: 'https://api.example.com/data',
        requestHeaders: {},
        responseHeaders: {},
        completed: false,
        ...overrides,
    };
}

describe('NetworkBuffer', () => {
    let buffer: NetworkBuffer;

    beforeEach(() => {
        buffer = new NetworkBuffer(5);
    });

    it('stores and retrieves entries', () => {
        const entry = makeEntry({ id: 'req-1' });
        buffer.add(entry);

        expect(buffer.get('req-1')).toEqual(entry);
    });

    it('returns null for missing entries', () => {
        expect(buffer.get('nonexistent')).toBeNull();
    });

    it('evicts oldest when full', () => {
        for (let i = 0; i < 6; i++) {
            buffer.add(makeEntry({ id: `req-${i}` }));
        }

        expect(buffer.get('req-0')).toBeNull();
        expect(buffer.get('req-1')).not.toBeNull();
        expect(buffer.get('req-5')).not.toBeNull();
    });

    it('updates existing entries', () => {
        buffer.add(makeEntry({ id: 'req-1' }));
        buffer.update('req-1', { status: 200, completed: true });

        const updated = buffer.get('req-1')!;
        expect(updated.status).toBe(200);
        expect(updated.completed).toBe(true);
    });

    it('getAll returns entries in insertion order', () => {
        buffer.add(makeEntry({ id: 'r1' }));
        buffer.add(makeEntry({ id: 'r2' }));
        buffer.add(makeEntry({ id: 'r3' }));

        const all = buffer.getAll();
        expect(all).toHaveLength(3);
        expect(all[0].id).toBe('r1');
        expect(all[1].id).toBe('r2');
        expect(all[2].id).toBe('r3');
    });

    it('clears and returns count', () => {
        buffer.add(makeEntry({ id: 'r1' }));
        buffer.add(makeEntry({ id: 'r2' }));

        const count = buffer.clear();
        expect(count).toBe(2);
        expect(buffer.get('r1')).toBeNull();
        expect(buffer.getAll()).toHaveLength(0);
    });
});
