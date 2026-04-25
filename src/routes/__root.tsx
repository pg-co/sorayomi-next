import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { Client as UrqlClient } from 'urql';
import type { QueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell/app-shell';
import { Toaster } from 'sonner';

export interface RouterContext {
  urql: UrqlClient;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
    </AppShell>
  );
}
