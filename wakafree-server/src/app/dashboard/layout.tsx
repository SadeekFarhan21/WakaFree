import DashboardTabs from '@/components/DashboardTabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-bold text-white">
            W
          </div>
          <span className="text-lg font-bold text-white">WakaFree</span>
        </div>
        <DashboardTabs />
      </div>
      {children}
    </div>
  )
}
