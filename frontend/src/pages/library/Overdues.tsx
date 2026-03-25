import React, { useEffect } from 'react'
import { libraryService } from '../../services/library.service'

export default function Overdues() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    setLoading(true)
    libraryService.getOverdues().then(data => setItems(data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Overdue Loans</h2>
      {loading && <div>Loading...</div>}
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.loanId || it.id} className="border p-3 rounded">
            <div><strong>Loan:</strong> {it.loanId || it.id}</div>
            <div><strong>Borrower:</strong> {it.borrowerId}</div>
            <div><strong>Due:</strong> {it.dueAt}</div>
            <div><strong>Calculated Fine:</strong> {it.fine}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
