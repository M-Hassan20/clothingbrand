import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistItemResponse } from '../api/wishlist';

interface WishlistState {
  wishlistVariantIds: number[];
  guestWishlistItems: WishlistItemResponse[];
  setWishlistVariantIds: (ids: number[]) => void;
  addWishlistVariantId: (id: number) => void;
  removeWishlistVariantId: (id: number) => void;
  addGuestWishlistItem: (item: WishlistItemResponse) => void;
  hasItem: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistVariantIds: [],
      guestWishlistItems: [],
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
          guestWishlistItems: get().guestWishlistItems.filter((item) => item.productVariant.id !== id),
        });
      },
      addGuestWishlistItem: (item) => {
        const currentItems = get().guestWishlistItems;
        if (!currentItems.some((i) => i.productVariant.id === item.productVariant.id)) {
          set({ guestWishlistItems: [...currentItems, item] });
        }
        get().addWishlistVariantId(item.productVariant.id);
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
