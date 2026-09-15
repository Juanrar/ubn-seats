import type { ReactNode } from 'react'
import { AdminTabs } from '@/components/admin/AdminTabs'

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <AdminTabs />
    </>
  )
}
