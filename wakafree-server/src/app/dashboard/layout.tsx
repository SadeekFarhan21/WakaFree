import Image from 'next/image'
import Link from 'next/link'
import DashboardTabs from '@/components/DashboardTabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c1117]">
      {/* WakaTime-style dark navbar */}
      <nav className="border-b border-[#373737] bg-[#030711]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 py-3 text-[#e1e7ef]">
              <Image src="/landing/wakatime-white.svg" alt="WakaFree" width={20} height={20} />
              <span className="text-base font-medium">WakaFree</span>
            </Link>
            <DashboardTabs />
          </div>
          <a
            href="https://wakatime.com/plugins"
            className="hidden text-sm text-[#7f8ea3] hover:text-[#e1e7ef] sm:block"
          >
            Plugins
          </a>
        </div>
      </nav>
      {children}
    </div>
  )
}
