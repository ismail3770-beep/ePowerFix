/**
 * Shared aspect ratio for ALL product / project / kit card images across the
 * storefront, so cards line up cleanly in mixed grids (e.g. on the home page
 * where FlashDeals, ShopSection and PremiumCard may all appear together).
 *
 * Change this single constant to resize every storefront card image at once.
 *
 * `aspect-[4/5.2]` is a slightly-portrait ratio that already matches the
 * PremiumCard / ShopSection / ProjectsSection — adopting it everywhere makes
 * the grids visually consistent.
 */
export const CARD_IMAGE_ASPECT = 'aspect-[4/5.2]' as const

/**
 * Inner padding for the card image frame. Smaller than the outer card padding
 * so the image dominates the card while still leaving breathing room.
 */
export const CARD_IMAGE_PADDING = 'p-2 sm:p-2.5' as const

/**
 * Object-fit mode. Use `object-contain` for product photos (don't crop) and
 * `object-cover` for lifestyle/banner-style images.
 */
export const CARD_IMAGE_FIT = 'object-contain' as const
