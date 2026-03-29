import { ConsoleEntry } from './types';

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

    getAll(): ConsoleEntry[] {
        return [...this.entries];
    }

    clear(): number {
        const count = this.entries.length;
        this.entries = [];
        return count;
    }
}
