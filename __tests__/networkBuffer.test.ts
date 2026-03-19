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

    it('queries with method filter', () => {
        buffer.add(makeEntry({ id: 'r1', method: 'GET' }));
        buffer.add(makeEntry({ id: 'r2', method: 'POST' }));
        buffer.add(makeEntry({ id: 'r3', method: 'GET' }));

        const results = buffer.query({ method: 'POST' });
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('r2');
    });

    it('queries with urlPattern filter (case-insensitive)', () => {
        buffer.add(makeEntry({ id: 'r1', url: 'https://api.example.com/users' }));
        buffer.add(makeEntry({ id: 'r2', url: 'https://api.example.com/posts' }));

        const results = buffer.query({ urlPattern: 'USERS' });
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('r1');
    });

    it('queries with status filter', () => {
        buffer.add(makeEntry({ id: 'r1', status: 200, completed: true }));
        buffer.add(makeEntry({ id: 'r2', status: 404, completed: true }));

        const results = buffer.query({ status: 404 });
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('r2');
    });

    it('queries with count limit', () => {
        buffer.add(makeEntry({ id: 'r1' }));
        buffer.add(makeEntry({ id: 'r2' }));
        buffer.add(makeEntry({ id: 'r3' }));

        const results = buffer.query({ count: 2 });
        expect(results).toHaveLength(2);
        // newest first
        expect(results[0].id).toBe('r3');
        expect(results[1].id).toBe('r2');
    });

    it('computes stats', () => {
        buffer.add(makeEntry({ id: 'r1', method: 'GET', status: 200, duration: 100, completed: true, url: 'https://api.example.com/a' }));
        buffer.add(makeEntry({ id: 'r2', method: 'POST', status: 201, duration: 200, completed: true, url: 'https://api.example.com/b' }));
        buffer.add(makeEntry({ id: 'r3', method: 'GET', status: 500, error: 'Server Error', completed: true, url: 'https://other.com/c' }));

        const stats = buffer.getStats();
        expect(stats.total).toBe(3);
        expect(stats.completed).toBe(2); // only non-error completed
        expect(stats.errors).toBe(1);
        expect(stats.avgDuration).toBe(150); // (100 + 200) / 2
        expect(stats.byMethod).toEqual({ GET: 2, POST: 1 });
        expect(stats.byStatus).toEqual({ '2xx': 2, '5xx': 1 });
        expect(stats.byDomain['api.example.com']).toBe(2);
        expect(stats.byDomain['other.com']).toBe(1);
    });

    it('clears and returns count', () => {
        buffer.add(makeEntry({ id: 'r1' }));
        buffer.add(makeEntry({ id: 'r2' }));

        const count = buffer.clear();
        expect(count).toBe(2);
        expect(buffer.get('r1')).toBeNull();
        expect(buffer.query()).toHaveLength(0);
    });
});
