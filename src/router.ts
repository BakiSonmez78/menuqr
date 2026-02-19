// ============================================
// Simple Hash Router
// ============================================

type RouteHandler = (params: Record<string, string>) => void;

interface Route {
    pattern: RegExp;
    handler: RouteHandler;
    paramNames: string[];
}

class Router {
    private routes: Route[] = [];
    private notFoundHandler: (() => void) | null = null;

    on(path: string, handler: RouteHandler): Router {
        const paramNames: string[] = [];
        const pattern = path.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        });
        this.routes.push({
            pattern: new RegExp(`^${pattern}$`),
            handler,
            paramNames
        });
        return this;
    }

    notFound(handler: () => void): Router {
        this.notFoundHandler = handler;
        return this;
    }

    navigate(path: string): void {
        window.location.hash = path;
    }

    getCurrentPath(): string {
        return window.location.hash.slice(1) || '/';
    }

    private resolve(): void {
        const path = this.getCurrentPath();

        for (const route of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                const params: Record<string, string> = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                route.handler(params);
                return;
            }
        }

        if (this.notFoundHandler) {
            this.notFoundHandler();
        }
    }

    start(): void {
        window.addEventListener('hashchange', () => this.resolve());
        // Initial route
        if (!window.location.hash) {
            window.location.hash = '/';
        }
        this.resolve();
    }
}

export const router = new Router();
