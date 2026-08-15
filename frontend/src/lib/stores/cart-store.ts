import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartDTO } from '@/types/api';

interface CartState {
  isOpen: boolean;
  guestUserId: string;
  cart: CartDTO | null;
  loading: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setCart: (cart: CartDTO | null) => void;
  setLoading: (loading: boolean) => void;
  getEffectiveUserId: (authUserId: string | null) => string;
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      guestUserId: '',
      cart: null,
      loading: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      setCart: (cart) => set({ cart }),
      setLoading: (loading) => set({ loading }),
      getEffectiveUserId: (authUserId) => {
        if (authUserId) return authUserId;
        
        let guestId = get().guestUserId;
        if (!guestId) {
          guestId = generateUUID();
          set({ guestUserId: guestId });
        }
        return guestId;
      },
    }),
    {
      name: 'haus-of-hafsah-cart-metadata',
      partialize: (state) => ({
        guestUserId: state.guestUserId || generateUUID(),
      }),
    }
  )
);
export default useCartStore;
