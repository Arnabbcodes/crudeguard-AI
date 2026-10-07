// Type definitions fallback for VS Code / TypeScript language server
// Provides type declarations for URL imports (https://...) and Deno globals

declare module "https://*" {
  export const serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  export const createClient: (supabaseUrl: string, supabaseKey: string, options?: any) => any;
  const content: any;
  export default content;
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  }
  export const env: Env;
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}
