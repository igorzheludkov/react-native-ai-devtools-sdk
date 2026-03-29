import { NetworkEntry } from './types';

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

    getAll(): NetworkEntry[] {
        return this.order.map((id) => this.entries.get(id)!);
    }

    clear(): number {
        const count = this.entries.size;
        this.entries.clear();
        this.order = [];
        return count;
    }
}
