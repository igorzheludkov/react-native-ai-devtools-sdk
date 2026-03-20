import { ConsoleBuffer } from './consoleBuffer';
import { ConsoleEntry } from './types';

type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

const LEVELS: ConsoleLevel[] = ['log', 'warn', 'error', 'info', 'debug'];

let originals: Record<ConsoleLevel, (...args: unknown[]) => void> | null = null;
let idCounter = 0;

function generateId(): string {
    const random = Math.random().toString(36).substring(2, 6);
    return `con-${random}-${++idCounter}`;
}

function formatArgs(args: unknown[]): string {
    return args
        .map((arg) => {
            if (typeof arg === 'string') return arg;
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        })
        .join(' ');
}

export function patchConsole(buffer: ConsoleBuffer): void {
    if (originals) {
        return;
    }

    originals = {} as Record<ConsoleLevel, (...args: unknown[]) => void>;

    for (const level of LEVELS) {
        originals[level] = console[level];

        console[level] = (...args: unknown[]): void => {
            const entry: ConsoleEntry = {
                id: generateId(),
                timestamp: Date.now(),
                level,
                message: formatArgs(args),
            };

            buffer.add(entry);
            originals![level].apply(console, args);
        };
    }
}

export function unpatchConsole(): void {
    if (originals) {
        for (const level of LEVELS) {
            console[level] = originals[level];
        }
        originals = null;
    }
    idCounter = 0;
}
