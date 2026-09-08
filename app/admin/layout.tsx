import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-paper-bg text-ink">{children}</div>
}
