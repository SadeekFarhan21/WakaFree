'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Icon({ d, points }: { d?: string[]; points?: string[] }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d?.map((p, i) => <path key={i} d={p} />)}
      {points?.map((p, i) => <polyline key={i} points={p} />)}
    </svg>
  )
}

const TABS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: <Icon d={['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']} />,
  },
  {
    href: '/dashboard#timeline',
    label: 'Timeline',
    icon: <Icon points={['22 12 18 12 15 21 9 3 6 12 2 12']} />,
    desktopOnly: true, // anchors a section hidden on phones
  },
  {
    href: '/dashboard#ai-metrics',
    label: 'AI Metrics',
    icon: <Icon d={['M3 17l6-6 4 4 8-8', 'M17 7h4v4']} />,
    desktopOnly: true,
  },
  {
    href: '#',
    label: 'Settings',
    desktopOnly: true,
    icon: (
      <Icon d={['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z']} />
    ),
  },
]

export default function DashboardTabs() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href.includes('#') || href === '#') return false
    return pathname.startsWith(href)
  }

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
      <div className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`${tab.desktopOnly ? 'hidden md:flex' : 'flex'} shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] transition-colors ${active
                  ? 'border-primary-dim font-medium text-onsurface'
                  : 'border-transparent text-outline hover:text-onsurface-variant'
                }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          )
        })}
      </div>
      <div className="hidden items-center gap-5 sm:flex">
        <a href="#" className="flex items-center gap-1.5 text-[13px] text-outline transition-colors hover:text-onsurface-variant">
          <Icon d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']} />
          Logout
        </a>
      </div>
    </div>
  )
}
