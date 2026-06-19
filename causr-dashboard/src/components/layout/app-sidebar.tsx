import { Activity, AlertTriangle, LayoutDashboard, ScrollText, Server } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}> = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/services', label: 'Services', icon: Server },
];

export function AppSidebar() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3.5 py-3.5">
        <Activity className="size-5 text-sidebar-primary" />
        <div>
          <p className="text-sm font-semibold tracking-tight">Causr</p>
          <p className="text-xs text-muted-foreground">Observability</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="border-t border-sidebar-border px-3.5 py-2.5 text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1 font-mono">d</kbd> to toggle theme
      </p>
    </aside>
  );
}
