import { describe, expect, it } from 'vitest';
import {
  getCartItemsSignature,
  mergeCartItems,
  reconcileCartItems,
  type CartItem,
} from './cart';

function product(
  id: string,
  productId: string,
  quantity: number,
  overrides: Partial<CartItem> = {},
): CartItem {
  return {
    id,
    itemType: 'PRODUCT',
    productId,
    productName: `Product ${productId}`,
    productImage: '',
    price: 100,
    quantity,
    ...overrides,
  };
}

describe('persisted cart synchronization', () => {
  it('merges by semantic identity and prefers server catalog metadata', () => {
    const local = product('local-id', 'product-1', 3, { productName: 'Old name', price: 50 });
    const server = product('server-id', 'product-1', 2, { productName: 'Current name', price: 80 });

    expect(mergeCartItems([local], [server])).toEqual([
      expect.objectContaining({
        id: 'server-id',
        productName: 'Current name',
        price: 80,
        quantity: 3,
      }),
    ]);
  });

  it('is repeatable and does not double quantities after another login', () => {
    const local = product('local-id', 'product-1', 2);
    const server = product('server-id', 'product-1', 2);

    const once = mergeCartItems([local], [server]);
    const twice = mergeCartItems(once, server);

    expect(getCartItemsSignature(twice)).toBe(getCartItemsSignature(once));
    expect(twice[0]?.quantity).toBe(2);
  });

  it('keeps server-only lines while replaying local changes made in flight', () => {
    const localSnapshot = [
      product('local-a', 'product-a', 1),
      product('local-b', 'product-b', 1),
    ];
    const current = [
      product('local-a', 'product-a', 4),
      product('local-c', 'product-c', 2),
    ];
    const persisted = [
      product('server-a', 'product-a', 1),
      product('server-b', 'product-b', 1),
      product('server-d', 'product-d', 3),
    ];

    const reconciled = reconcileCartItems(localSnapshot, current, persisted);

    expect(getCartItemsSignature(reconciled)).toBe([
      'PRODUCT:product-a::4',
      'PRODUCT:product-c::2',
      'PRODUCT:product-d::3',
    ].join('|'));
  });

  it('treats product variants as separate persisted lines', () => {
    const small = product('small', 'product-1', 1, { variantId: 'small' });
    const large = product('large', 'product-1', 2, { variantId: 'large' });

    expect(mergeCartItems([small], [large])).toHaveLength(2);
  });
});
