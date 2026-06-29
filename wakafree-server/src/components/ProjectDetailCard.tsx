import { formatSeconds, compactNumber } from '@/lib/compute'
import type { ProjectDetail } from '@/lib/projects'

export interface ProjectMeta {
  repository?: string | null
  url?: string | null
  firstHeartbeat?: string | null
  lastHeartbeat?: string | null
}

export default function ProjectDetailCard({
  project,
  meta,
}: {
  project: ProjectDetail
  meta?: ProjectMeta
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-indigo-400 text-xs">📁</span>
        </div>
        <h3 className="font-semibold text-white truncate">{project.name}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-3 pl-10">{formatSeconds(project.seconds)}</p>

      {/* Split AI vs Human bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden mb-5 bg-gray-800">
        <div className="bg-indigo-500" style={{ width: `${project.aiPercent}%` }} />
        <div className="bg-emerald-500" style={{ width: `${project.humanPercent}%` }} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        <div>
          <p className="text-indigo-400 text-[11px] font-medium uppercase tracking-wide mb-1">⚡ AI Changes</p>
          <p className="text-xl font-bold text-white leading-none">{compactNumber(project.aiChanges)}</p>
          <p className="text-gray-500 text-xs mt-1">{project.aiPercent.toFixed(project.aiPercent < 10 ? 1 : 0)}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wide mb-1">👤 Human Changes</p>
          <p className="text-xl font-bold text-white leading-none">{compactNumber(project.humanChanges)}</p>
          <p className="text-gray-500 text-xs mt-1">{project.humanPercent.toFixed(project.humanPercent < 10 ? 1 : 0)}%</p>
        </div>

        <div>
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wide mb-1">💬 AI Prompts</p>
          <p className="text-xl font-bold text-white leading-none">{project.aiPrompts}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wide mb-1">🗨 AI Sessions</p>
          <p className="text-xl font-bold text-white leading-none">{project.aiSessions}</p>
          <p className="text-gray-500 text-xs mt-1">{project.avgPromptsPerSession} avg prompts</p>
        </div>

        <div>
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wide mb-1">▦ Tokens</p>
          <p className="text-xl font-bold text-white leading-none">
            {compactNumber(project.inputTokens + project.outputTokens)}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {compactNumber(project.inputTokens)} in / {compactNumber(project.outputTokens)} out
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wide mb-1">$ AI Spend</p>
          <p className="text-xl font-bold text-white leading-none">${project.aiSpend.toFixed(2)}</p>
          {project.agentBreakdown.length > 0 && (
            <p className="text-gray-500 text-xs mt-1 truncate">
              {project.agentBreakdown
                .map((a) => `${a.name} $${a.cost.toFixed(a.cost < 1 ? 3 : 2)}`)
                .join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Optional metadata footer */}
      {meta && (meta.lastHeartbeat || meta.repository) && (
        <div className="mt-5 pt-4 border-t border-gray-800 space-y-1">
          {meta.lastHeartbeat && (
            <p className="text-xs text-gray-500">
              Last active: <span className="text-gray-400">{meta.lastHeartbeat}</span>
            </p>
          )}
          {meta.firstHeartbeat && (
            <p className="text-xs text-gray-500">
              First seen: <span className="text-gray-400">{meta.firstHeartbeat}</span>
            </p>
          )}
          {meta.repository && (
            <a
              href={meta.repository}
              className="text-xs text-indigo-400 hover:text-indigo-300 truncate block"
            >
              {meta.repository}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
