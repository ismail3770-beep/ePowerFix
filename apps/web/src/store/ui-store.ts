import { create } from 'zustand'

interface UIState {
  activeSection: 'home' | 'services' | 'shop' | 'tools' | 'projects'
  setActiveSection: (section: UIState['activeSection']) => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  serviceBookingOpen: boolean
  setServiceBookingOpen: (open: boolean) => void
  bookingServiceId: string | null
  setBookingServiceId: (id: string | null) => void
  productDetailOpen: boolean
  setProductDetailOpen: (open: boolean) => void
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  projectDetailOpen: boolean
  setProjectDetailOpen: (open: boolean) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  checkoutOpen: boolean
  setCheckoutOpen: (open: boolean) => void
  adminOpen: boolean
  setAdminOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchCategory: string
  setSearchCategory: (c: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  serviceBookingOpen: false,
  setServiceBookingOpen: (open) => set({ serviceBookingOpen: open }),
  bookingServiceId: null,
  setBookingServiceId: (id) => set({ bookingServiceId: id }),
  productDetailOpen: false,
  setProductDetailOpen: (open) => set({ productDetailOpen: open }),
  selectedProductId: null,
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  projectDetailOpen: false,
  setProjectDetailOpen: (open) => set({ projectDetailOpen: open }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  checkoutOpen: false,
  setCheckoutOpen: (open) => set({ checkoutOpen: open }),
  adminOpen: false,
  setAdminOpen: (open) => set({ adminOpen: open }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchCategory: 'All',
  setSearchCategory: (c) => set({ searchCategory: c }),
}))
