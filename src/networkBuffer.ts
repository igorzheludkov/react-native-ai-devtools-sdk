import { NetworkEntry, NetworkQueryOptions, NetworkStats } from './types';

export class NetworkBuffer {
    private entries: Map<string, NetworkEntry> = new Map();
    private order: string[] = [];
    private maxSize: number;

    constructor(maxSize: number = 500) {
        this.maxSize = maxSize;
    }

    add(entry: NetworkEntry): void {
        if (this.entries.has(entry.id)) {
            return;
        }

        if (this.order.length >= this.maxSize) {
            const oldestId = this.order.shift()!;
            this.entries.delete(oldestId);
        }

        this.entries.set(entry.id, entry);
        this.order.push(entry.id);
    }

    update(id: string, updates: Partial<NetworkEntry>): void {
        const entry = this.entries.get(id);
        if (entry) {
            Object.assign(entry, updates);
        }
    }

    get(id: string): NetworkEntry | null {
        return this.entries.get(id) ?? null;
    }

    query(options?: NetworkQueryOptions): NetworkEntry[] {
        let results = Array.from(this.order)
            .map((id) => this.entries.get(id)!)
            .reverse();

        if (options?.method) {
            const method = options.method.toUpperCase();
            results = results.filter((e) => e.method === method);
        }

        if (options?.urlPattern) {
            const pattern = options.urlPattern.toLowerCase();
            results = results.filter((e) => e.url.toLowerCase().includes(pattern));
        }

        if (options?.status != null) {
            results = results.filter((e) => e.status === options.status);
        }

        if (options?.count != null && options.count > 0) {
            results = results.slice(0, options.count);
        }

        return results;
    }

    getStats(): NetworkStats {
        const all = Array.from(this.entries.values());
        const completed = all.filter((e) => e.completed && !e.error);
        const errors = all.filter((e) => !!e.error);

        const durations = completed
            .map((e) => e.duration)
            .filter((d): d is number => d != null);

        const avgDuration =
            durations.length > 0
                ? durations.reduce((sum, d) => sum + d, 0) / durations.length
                : null;

        const byMethod: Record<string, number> = {};
        for (const entry of all) {
            byMethod[entry.method] = (byMethod[entry.method] || 0) + 1;
        }

        const byStatus: Record<string, number> = {};
        for (const entry of all) {
            if (entry.status != null) {
                const group = `${Math.floor(entry.status / 100)}xx`;
                byStatus[group] = (byStatus[group] || 0) + 1;
            }
        }

        const byDomain: Record<string, number> = {};
        for (const entry of all) {
            try {
                const domain = new URL(entry.url).hostname;
                byDomain[domain] = (byDomain[domain] || 0) + 1;
            } catch {
                // skip malformed URLs
            }
        }

        return {
            total: all.length,
            completed: completed.length,
            errors: errors.length,
            avgDuration,
            byMethod,
            byStatus,
            byDomain,
        };
    }

    clear(): number {
        const count = this.entries.size;
        this.entries.clear();
        this.order = [];
        return count;
    }
}
