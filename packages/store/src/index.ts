// @epowerfix/store — Shared Zustand stores
// Storage adapters allow web (localStorage) and mobile (AsyncStorage) to
// share the persisted cart implementation.

export { getStorage, setStorage } from './storage';
export {
  getCartItemEntityId,
  getCartItemKey,
  getCartItemsSignature,
  mergeCartItems,
  normalizeCartItem,
  reconcileCartItems,
  toOrderItemPayload,
  useCartStore,
} from './cart';
export type {
  CartItem,
  CartItemInput,
  CartItemType,
  OrderItemPayload,
} from './cart';
