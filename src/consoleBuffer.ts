import { ConsoleEntry, ConsoleQueryOptions } from './types';

export class ConsoleBuffer {
    private entries: ConsoleEntry[] = [];
    private maxSize: number;

    constructor(maxSize: number = 500) {
        this.maxSize = maxSize;
    }

    add(entry: ConsoleEntry): void {
        if (this.entries.length >= this.maxSize) {
            this.entries.shift();
        }
        this.entries.push(entry);
    }

    query(options?: ConsoleQueryOptions): ConsoleEntry[] {
        let results = [...this.entries].reverse();

        if (options?.level) {
            results = results.filter((e) => e.level === options.level);
        }

        if (options?.text) {
            const text = options.text.toLowerCase();
            results = results.filter((e) => e.message.toLowerCase().includes(text));
        }

        if (options?.count != null && options.count > 0) {
            results = results.slice(0, options.count);
        }

        return results;
    }

    getStats(): { total: number; byLevel: Record<string, number> } {
        const byLevel: Record<string, number> = {};
        for (const entry of this.entries) {
            byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
        }
        return { total: this.entries.length, byLevel };
    }

    clear(): number {
        const count = this.entries.length;
        this.entries = [];
        return count;
    }
}
