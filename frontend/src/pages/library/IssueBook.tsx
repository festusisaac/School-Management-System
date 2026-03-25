import React, { useState } from 'react'
import { libraryService } from '../../services/library.service'
import { useNavigate } from 'react-router-dom'

export default function IssueBook() {
  const [copyId, setCopyId] = useState('')
  const [borrowerId, setBorrowerId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await libraryService.issueLoan({ copyId, borrowerId, dueAt })
      nav('/library')
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Issue Book</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm">Copy ID</label>
          <input value={copyId} onChange={e => setCopyId(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Borrower ID</label>
          <input value={borrowerId} onChange={e => setBorrowerId(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Due Date</label>
          <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <button disabled={loading} className="btn btn-primary">{loading ? 'Issuing...' : 'Issue'}</button>
      </form>
    </div>
  )
}
