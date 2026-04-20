// Minimal XMLHttpRequest mock with EventTarget semantics for testing the
// XHR interceptor. Intentionally hand-rolled to keep the SDK zero-dep.

type ResponseType = '' | 'text' | 'json' | 'arraybuffer' | 'blob' | 'document';

export interface LoadOptions {
    status: number;
    statusText?: string;
    body?: unknown;
    headers?: Record<string, string>;
    responseURL?: string;
}

export class MockXMLHttpRequest extends EventTarget {
    public static instances: MockXMLHttpRequest[] = [];

    public readyState = 0;
    public status = 0;
    public statusText = '';
    public responseType: ResponseType = '';
    public response: unknown = null;
    public responseText = '';
    public responseURL = '';
    public timeout = 0;
    public withCredentials = false;

    private _method = '';
    private _url = '';
    private _async = true;
    private _user: string | null = null;
    private _password: string | null = null;
    private _requestHeaders: Record<string, string> = {};
    private _responseHeaders: Record<string, string> = {};
    private _sent = false;
    public _sentBody: unknown = undefined;

    open(
        method: string,
        url: string,
        async = true,
        user: string | null = null,
        password: string | null = null,
    ): void {
        this._method = method;
        this._url = url;
        this._async = async;
        this._user = user;
        this._password = password;
        this.readyState = 1;
    }

    setRequestHeader(name: string, value: string): void {
        this._requestHeaders[name] = value;
    }

    send(body?: unknown): void {
        this._sentBody = body;
        this._sent = true;
        MockXMLHttpRequest.instances.push(this);
    }

    getAllResponseHeaders(): string {
        return Object.entries(this._responseHeaders)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n');
    }

    getResponseHeader(name: string): string | null {
        const lower = name.toLowerCase();
        for (const [k, v] of Object.entries(this._responseHeaders)) {
            if (k.toLowerCase() === lower) {
                return v;
            }
        }
        return null;
    }

    abort(): void {
        this.dispatchEvent(new Event('abort'));
    }

    // Test helpers ---------------------------------------------------------

    _getMethod(): string {
        return this._method;
    }
    _getUrl(): string {
        return this._url;
    }
    _getRequestHeaders(): Record<string, string> {
        return { ...this._requestHeaders };
    }
    _getCredentials(): { user: string | null; password: string | null } {
        return { user: this._user, password: this._password };
    }

    _fireLoad(opts: LoadOptions): void {
        this.status = opts.status;
        this.statusText = opts.statusText ?? '';
        this._responseHeaders = opts.headers ?? {};
        this.responseURL = opts.responseURL ?? this._url;
        if (this.responseType === '' || this.responseType === 'text') {
            this.responseText = typeof opts.body === 'string' ? opts.body : '';
            this.response = this.responseText;
        } else {
            this.response = opts.body ?? null;
        }
        this.readyState = 4;
        this.dispatchEvent(new Event('load'));
    }

    _fireError(): void {
        this.dispatchEvent(new Event('error'));
    }

    _fireTimeout(): void {
        this.dispatchEvent(new Event('timeout'));
    }
}

export function installMockXHR(): void {
    MockXMLHttpRequest.instances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).XMLHttpRequest = MockXMLHttpRequest;
}

export function uninstallMockXHR(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).XMLHttpRequest;
    MockXMLHttpRequest.instances = [];
}

export function lastInstance(): MockXMLHttpRequest {
    const xhr = MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1];
    if (!xhr) {
        throw new Error('No XHR instance has been sent');
    }
    return xhr;
}
