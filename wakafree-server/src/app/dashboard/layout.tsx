import DashboardTabs from '@/components/DashboardTabs'

function CodeMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-outline-variant bg-surface/80 backdrop-blur-xl">
        {/* Row 1: brand */}
        <div className="mx-auto flex max-w-7xl items-center px-6 pt-3 pb-2">
          <a href="/dashboard" className="flex items-center gap-2 text-onsurface">
            <CodeMark />
            <span className="text-lg font-semibold tracking-tight">WakaFree</span>
          </a>
        </div>
        {/* Row 2: section tabs */}
        <DashboardTabs />
      </nav>
      {children}
    </div>
  )
}
