import React, { useState } from 'react'
import { libraryService } from '../../services/library.service'
import { useNavigate } from 'react-router-dom'

export default function ReturnBook() {
  const [loanId, setLoanId] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await libraryService.returnLoan(loanId)
      nav('/library/overdues')
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Return Book</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm">Loan ID</label>
          <input value={loanId} onChange={e => setLoanId(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <button disabled={loading} className="btn btn-primary">{loading ? 'Processing...' : 'Return'}</button>
      </form>
    </div>
  )
}
