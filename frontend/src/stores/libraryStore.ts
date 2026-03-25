import { create } from 'zustand'
import { libraryService, Book, Author, Category, Loan, LibrarySettings } from '../services/library.service'

interface LibraryState {
  books: Book[]
  authors: Author[]
  categories: Category[]
  overdues: Loan[]
  settings: LibrarySettings | null
  loading: boolean
  
  fetchBooks: (params?: any) => Promise<void>
  fetchAuthors: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchOverdues: () => Promise<void>
  fetchSettings: () => Promise<void>
  
  getBookById: (id: string) => Book | undefined
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  authors: [],
  categories: [],
  overdues: [],
  settings: null,
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

  fetchAuthors: async () => {
    set({ loading: true })
    try {
      const authors = await libraryService.getAuthors()
      set({ authors })
    } finally {
      set({ loading: false })
    }
  },

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const categories = await libraryService.getCategories()
      set({ categories })
    } finally {
      set({ loading: false })
    }
  },

  fetchOverdues: async () => {
    set({ loading: true })
    try {
      const overdues = await libraryService.getOverdues()
      set({ overdues })
    } finally {
      set({ loading: false })
    }
  },

  fetchSettings: async () => {
    set({ loading: true })
    try {
      const settings = await libraryService.getSettings()
      set({ settings })
    } finally {
      set({ loading: false })
    }
  },

  getBookById: (id: string) => get().books.find(b => b.id === id),
}))
