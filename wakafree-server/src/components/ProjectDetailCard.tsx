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
    <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-[#2595ff]/20 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-[#3b82f6] text-xs">📁</span>
        </div>
        <h3 className="font-semibold text-[#e1e7ef] truncate">{project.name}</h3>
      </div>
      <p className="text-sm text-[#7f8ea3] mb-3 pl-10">{formatSeconds(project.seconds)}</p>

      {/* Split AI vs Human bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden mb-5 bg-[#1d283a]">
        <div className="bg-[#2595ff]" style={{ width: `${project.aiPercent}%` }} />
        <div className="bg-emerald-500" style={{ width: `${project.humanPercent}%` }} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        <div>
          <p className="text-[#3b82f6] text-[11px] font-medium uppercase tracking-wide mb-1">⚡ AI Changes</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">{compactNumber(project.aiChanges)}</p>
          <p className="text-[#7f8ea3] text-xs mt-1">{project.aiPercent.toFixed(project.aiPercent < 10 ? 1 : 0)}%</p>
        </div>
        <div>
          <p className="text-[#7f8ea3] text-[11px] font-medium uppercase tracking-wide mb-1">👤 Human Changes</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">{compactNumber(project.humanChanges)}</p>
          <p className="text-[#7f8ea3] text-xs mt-1">{project.humanPercent.toFixed(project.humanPercent < 10 ? 1 : 0)}%</p>
        </div>

        <div>
          <p className="text-[#7f8ea3] text-[11px] font-medium uppercase tracking-wide mb-1">💬 AI Prompts</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">{project.aiPrompts}</p>
        </div>
        <div>
          <p className="text-[#7f8ea3] text-[11px] font-medium uppercase tracking-wide mb-1">🗨 AI Sessions</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">{project.aiSessions}</p>
          <p className="text-[#7f8ea3] text-xs mt-1">{project.avgPromptsPerSession} avg prompts</p>
        </div>

        <div>
          <p className="text-[#7f8ea3] text-[11px] font-medium uppercase tracking-wide mb-1">▦ Tokens</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">
            {compactNumber(project.inputTokens + project.outputTokens)}
          </p>
          <p className="text-[#7f8ea3] text-xs mt-1">
            {compactNumber(project.inputTokens)} in / {compactNumber(project.outputTokens)} out
          </p>
        </div>
        <div>
          <p className="text-[#7f8ea3] text-[11px] font-medium uppercase tracking-wide mb-1">$ AI Spend</p>
          <p className="text-xl font-bold text-[#e1e7ef] leading-none">${project.aiSpend.toFixed(2)}</p>
          {project.agentBreakdown.length > 0 && (
            <p className="text-[#7f8ea3] text-xs mt-1 truncate">
              {project.agentBreakdown
                .map((a) => `${a.name} $${a.cost.toFixed(a.cost < 1 ? 3 : 2)}`)
                .join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Optional metadata footer */}
      {meta && (meta.lastHeartbeat || meta.repository) && (
        <div className="mt-5 pt-4 border-t border-[#1d283a] space-y-1">
          {meta.lastHeartbeat && (
            <p className="text-xs text-[#7f8ea3]">
              Last active: <span className="text-[#e1e7ef]">{meta.lastHeartbeat}</span>
            </p>
          )}
          {meta.firstHeartbeat && (
            <p className="text-xs text-[#7f8ea3]">
              First seen: <span className="text-[#e1e7ef]">{meta.firstHeartbeat}</span>
            </p>
          )}
          {meta.repository && (
            <a
              href={meta.repository}
              className="text-xs text-[#3b82f6] hover:text-[#2595ff] truncate block"
            >
              {meta.repository}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
