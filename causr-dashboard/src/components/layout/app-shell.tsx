import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="w-full flex-1 px-3.5 py-5 md:px-5 lg:px-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
