export default function ActivityLogTable({ logs, loading }) {
  if (loading) {
    return <p className="empty-state">Loading activity...</p>
  }

  if (!logs.length) {
    return <p className="empty-state">No recent activity.</p>
  }

  return (
    <div className="documents-grid" data-testid="activity-logs">
      <table className="documents-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Document</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.action}</td>
              <td>{entry.file_name}</td>
              <td>{new Date(entry.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
