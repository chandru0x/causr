import type { ReactNode } from 'react'
import { TestDataNoticeModal } from '../test-data-notice/TestDataNoticeModal'
import './LunarisShell.css'

type LunarisShellProps = {
  children: ReactNode
}

export function LunarisShell({ children }: LunarisShellProps) {
  return (
    <div className="lunaris-shell" data-theme="lunaris">
      <TestDataNoticeModal />
      <div className="lunaris-shell__main">{children}</div>
    </div>
  )
}
