import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { libraryService, Book } from '../../services/library.service'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    if (!id) return
    libraryService.getBook(id).then(setBook)
  }, [id])

  if (!book) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <Link to="/library" className="text-sm text-indigo-600">Back to list</Link>
      <h2 className="text-2xl font-semibold mt-2">{book.title}</h2>
      {book.coverPath && <img src={book.coverPath} alt={book.title} className="w-48 h-64 object-cover my-4" />}
      <p className="text-sm text-gray-700">{book.description}</p>
      <div className="mt-4">
        <strong>ISBN:</strong> {book.isbn} <br />
        <strong>Publisher:</strong> {book.publisher}
      </div>
    </div>
  )
}
