'use client'

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
    href: '/dashboard#timeline',
    label: 'Timeline',
    icon: <Icon points={['22 12 18 12 15 21 9 3 6 12 2 12']} />,
  },
  {
    href: '/dashboard#ai-metrics',
    label: 'AI Metrics',
    icon: <Icon d={['M3 17l6-6 4 4 8-8', 'M17 7h4v4']} />,
  },
]

export default function DashboardTabs() {
  return (
    <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6">
      <div className="hidden items-center md:flex">
        {TABS.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-[13px] text-outline transition-colors hover:text-onsurface-variant"
          >
            {tab.icon}
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  )
}
