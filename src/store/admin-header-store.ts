import { create } from 'zustand'

interface AdminHeaderState {
  /** Button label — empty string hides the button */
  label: string
  /** Click handler for the header "Add New" button */
  onClick: (() => void) | null
  /** Call from each admin page to register its Add New action */
  setAddNew: (label: string, onClick: (() => void) | null) => void
}

export const useAdminHeaderStore = create<AdminHeaderState>((set) => ({
  label: '',
  onClick: null,
  setAddNew: (label, onClick) => set({ label, onClick }),
}))