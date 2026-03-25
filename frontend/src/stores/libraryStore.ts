import { create } from 'zustand'
import { libraryService, Book } from '../services/library.service'

interface LibraryState {
  books: Book[]
  loading: boolean
  fetchBooks: (params?: any) => Promise<void>
  getBookById: (id: string) => Book | undefined
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  loading: false,
  fetchBooks: async (params = {}) => {
    set({ loading: true })
    try {
      const books = await libraryService.getBooks(params)
      set({ books })
    } finally {
      set({ loading: false })
    }
  },
  getBookById: (id: string) => get().books.find(b => b.id === id),
}))
