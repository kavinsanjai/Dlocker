import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CHART_COLORS = ['#1f9b76', '#2b73c8', '#f08d49', '#8a6dc4']

function formatBytes(bytes) {
  if (!bytes) {
    return '0 MB'
  }

  const megabytes = bytes / (1024 * 1024)
  return `${megabytes.toFixed(2)} MB`
}

export default function DashboardInsights({ insights, loading }) {
  if (loading) {
    return (
      <article className="summary-card" data-testid="insights-loading">
        <p className="summary-title">Smart Dashboard</p>
        <p className="summary-note">Loading insights...</p>
      </article>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <section className="insights-grid" data-testid="dashboard-insights">
      <article className="summary-card">
        <p className="summary-title">Total Documents</p>
        <p className="summary-value">{insights.total_documents}</p>
        <p className="summary-note">All documents in your locker</p>
      </article>

      <article className="summary-card">
        <p className="summary-title">Storage Usage</p>
        <p className="summary-value">
          {formatBytes(insights.total_storage_bytes)} / {formatBytes(insights.storage_quota_bytes)}
        </p>
        <div className="progress-track" aria-label="Storage usage">
          <div
            className="progress-fill"
            style={{ width: `${insights.storage_usage_percent}%` }}
          ></div>
        </div>
        <p className="summary-note">{insights.storage_usage_percent}% used</p>
      </article>

      <article className="summary-card chart-card">
        <p className="summary-title">File Type Distribution</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={insights.file_type_distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={74}
                paddingAngle={2}
              >
                {insights.file_type_distribution.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="summary-card recent-card">
        <p className="summary-title">Recent Uploads</p>
        <ul className="recent-list">
          {insights.recent_documents.length > 0 ? (
            insights.recent_documents.map((item) => (
              <li key={item.id} className="recent-item">
                <p className="recent-name">{item.file_name}</p>
                <p className="summary-note">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))
          ) : (
            <li className="recent-item">
              <p className="summary-note">No uploads yet.</p>
            </li>
          )}
        </ul>
      </article>
    </section>
  )
}
