// The playground runs on Vite (esbuild transpiles JSX/TS at dev time), so it
// needs no build-time types. `@types/react-dom` isn't a dependency of this
// library, so declare the one client entry we use rather than pulling it in.
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export function createRoot(container: Element | null): { render(children: ReactNode): void };
}
