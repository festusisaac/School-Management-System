import React, { useEffect } from 'react'
import { useLibraryStore } from '../../stores/libraryStore'
import { Link } from 'react-router-dom'

export default function BookList() {
  const { books, fetchBooks, loading } = useLibraryStore()

  useEffect(() => { fetchBooks() }, [])

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Books</h2>
      {loading && <div>Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.map((b) => (
          <div key={b.id} className="border p-3 rounded">
            {b.coverPath && <img src={b.coverPath} alt={b.title} className="w-full h-40 object-cover mb-2" />}
            <h3 className="font-medium">{b.title}</h3>
            <p className="text-sm text-gray-600">{b.publisher}</p>
            <div className="mt-2">
              <Link to={`/library/${b.id}`} className="text-indigo-600">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
