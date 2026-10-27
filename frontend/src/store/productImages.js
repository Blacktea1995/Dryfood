/**
 * DryFood product imagery — real photographs by category (Wikimedia Commons).
 *
 * Unlike random placeholder services, every URL here is a genuine photo of the
 * right food family (noodles, dried meat, seafood, nuts, dried fruit, veg
 * chips, spices, snacks). Served via Commons Special:FilePath with width
 * scaling, so it always resolves to a JPEG.
 *
 * Fallback chain: category photo -> neutral icon (hidden image). No invented
 * data, no fake previews.
 */

const CATEGORY_PHOTO = {
  'Mi - bun': 'Instant noodles.jpg',
  'Thit': 'Embutidos en una carniceria del Mercado Municipal de Sao Paulo.jpg',
  'Hai san': 'Dried fish in Chittagong 03.jpg',
  'Hat - an vat': 'CASHEW NUTS.jpg',
  'Trai cay kho': 'Mix dried fruit12.jpg',
  'Rau cu': 'Sweet potato chips in Shandong, china.jpg',
  'Gia vi': 'Spices WATERFRONT MARKET.jpg',
  'Banh keo': 'No name cheese rice crackers 2012 (cropped).jpg'
};

/** Second photo per category (for variety between cards of the same family). */
const CATEGORY_PHOTO_ALT = {
  'Mi - bun': 'Instant ramen packages in H Mart.jpg',
  'Thit': 'Pork rind.jpg',
  'Hai san': 'ShreddedSquidSingleStrand.jpg',
  'Hat - an vat': 'Mixed nuts bowl.jpg',
  'Trai cay kho': 'Heap of Sun-dried mango slices.jpg',
  'Rau cu': 'Potato-chips-1.jpg',
  'Gia vi': 'Curcuma longa roots.jpg',
  'Banh keo': 'Drying Javanese rice crackers (karak) in the sun.jpg'
};

const DEFAULT_PHOTO = 'Dried fruit stall in the open.jpg';

/** Wikimedia Commons direct file URL at a given width. */
function commonsUrl(file, w) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
}

/** Square photo for a product. Alternates between primary and secondary per product id. */
export function productImageUrl(product, size = 640) {
  const cat = product?.category;
  const list = [CATEGORY_PHOTO[cat], CATEGORY_PHOTO_ALT[cat], CATEGORY_PHOTO[cat], CATEGORY_PHOTO_ALT[cat]];
  const idx = (Number(product?.id) || 1) % list.length;
  return commonsUrl(list[idx] || DEFAULT_PHOTO, size);
}

/** Stable fallback (same family, first photo), keeps one real image per category. */
export function productImageFallback(product, size = 640) {
  return commonsUrl(CATEGORY_PHOTO[product?.category] || DEFAULT_PHOTO, size);
}

/** Wide photo for category showcase tiles. */
export function categoryImage(category, w = 640, h = 400) {
  return {
    src: commonsUrl(CATEGORY_PHOTO[category] || DEFAULT_PHOTO, Math.max(w, h)),
    fallback: commonsUrl(CATEGORY_PHOTO_ALT[category] || DEFAULT_PHOTO, Math.max(w, h))
  };
}

/** Hero imagery: a real market / dried-food stall photograph. */
export const HERO_IMAGE = {
  src: commonsUrl('Dried fruit stall in the open.jpg', 1200),
  fallback: commonsUrl('Food and Drink Dried Fruits Stall (54504416713).jpg', 1200)
};

/** Auth panel imagery: dried-food market scene. */
export const AUTH_IMAGE = {
  src: commonsUrl('Food and Drink Dried Fruits Stall (54503286272).jpg', 1200),
  fallback: commonsUrl('Dried fish-garlic stall (4353643132).jpg', 1200)
};
