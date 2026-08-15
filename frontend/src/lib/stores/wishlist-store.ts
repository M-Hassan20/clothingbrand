import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  wishlistVariantIds: number[];
  setWishlistVariantIds: (ids: number[]) => void;
  addWishlistVariantId: (id: number) => void;
  removeWishlistVariantId: (id: number) => void;
  hasItem: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistVariantIds: [],
      setWishlistVariantIds: (ids) => set({ wishlistVariantIds: ids }),
      addWishlistVariantId: (id) => {
        const current = get().wishlistVariantIds;
        if (!current.includes(id)) {
          set({ wishlistVariantIds: [...current, id] });
        }
      },
      removeWishlistVariantId: (id) => {
        set({
          wishlistVariantIds: get().wishlistVariantIds.filter((vId) => vId !== id),
        });
      },
      hasItem: (id) => {
        return get().wishlistVariantIds.includes(id);
      },
    }),
    {
      name: 'haus-of-hafsah-wishlist',
    }
  )
);
export default useWishlistStore;
