import { supabase } from '@/lib/supabase'
import { formatSeconds } from '@/lib/compute'
import { aggregateProjectDetails, type WakaProject } from '@/lib/projects'
import ProjectDetailCard, { type ProjectMeta } from '@/components/ProjectDetailCard'

export const dynamic = 'force-dynamic'

interface DailyRow {
  date: string
  data: { projects?: WakaProject[] }
}

interface WakaMetaProject {
  name: string
  repository?: string | null
  url?: string | null
  human_readable_first_heartbeat_at?: string | null
  human_readable_last_heartbeat_at?: string | null
}

async function getProjects() {
  const [{ data: rows, error }, { data: metaRows }] = await Promise.all([
    supabase
      .from('waka_daily')
      .select('date, data')
      .order('date', { ascending: false })
      .limit(365),
    supabase.from('waka_meta').select('key, data').eq('key', 'projects'),
  ])

  if (error || !rows) return null

  const typed = rows as DailyRow[]

  // Full per-project aggregation across ALL stored history.
  const details = aggregateProjectDetails(typed, 100)

  // Metadata (repo, first/last heartbeat) keyed by project name.
  const metaList = (metaRows?.[0]?.data as WakaMetaProject[] | undefined) ?? []
  const metaByName = new Map<string, ProjectMeta>()
  for (const p of metaList) {
    metaByName.set(p.name, {
      repository: p.repository,
      url: p.url,
      firstHeartbeat: p.human_readable_first_heartbeat_at,
      lastHeartbeat: p.human_readable_last_heartbeat_at,
    })
  }

  const totalSeconds = details.reduce((s, p) => s + p.seconds, 0)
  const totalSpend = details.reduce((s, p) => s + p.aiSpend, 0)

  return {
    projects: details,
    metaByName,
    totalSeconds,
    totalSpend,
    daysStored: typed.length,
  }
}

export default async function ProjectsPage() {
  const data = await getProjects()

  if (!data || data.projects.length === 0) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mt-2 mb-2">Projects</h1>
        <p className="text-gray-500 text-sm">No project data yet. Run a sync first.</p>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-sm text-gray-500">
          {data.projects.length} projects · across {data.daysStored} days
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Tracked</p>
          <p className="text-2xl font-bold text-white">{formatSeconds(data.totalSeconds)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Projects</p>
          <p className="text-2xl font-bold text-white">{data.projects.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total AI Spend</p>
          <p className="text-2xl font-bold text-white">${data.totalSpend.toFixed(2)}</p>
        </div>
      </div>

      {/* Per-project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.projects.map((project) => (
          <ProjectDetailCard
            key={project.name}
            project={project}
            meta={data.metaByName.get(project.name)}
          />
        ))}
      </div>
    </main>
  )
}
