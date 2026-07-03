'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/projects', label: 'Projects' },
]

export default function DashboardTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center">
      {TABS.map((tab) => {
        const active =
          tab.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-3.5 text-sm transition-colors ${
              active
                ? 'border-[#2595ff] font-medium text-[#e1e7ef]'
                : 'border-transparent text-[#7f8ea3] hover:text-[#e1e7ef]'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
