/**
 * Storefront presentation config.
 *
 * Only presentation values that are not product data live here. Nothing in this
 * file invents numbers: the mid-page banner states facts that are already true
 * of the shop (free-shipping threshold used by the cart, hotline hours), and the
 * category order is computed from the API at runtime.
 */

/** Vertical rhythm between storefront sections (one spacing token). */
export const SECTION_GAP = 'space-y-10 md:space-y-14';

/** Free-shipping threshold, same value the cart drawer enforces. */
export const FREE_SHIPPING_THRESHOLD = 200000;

/** Mid-page call-to-action strip. Copy only, no invented metrics. */
export const MID_BANNER = {
  title: 'Miễn phí giao hàng cho đơn từ 200.000 ₫',
  sub: 'Đặt hàng hôm nay, xác nhận trong ngày và giao tận nơi trên toàn quốc.',
  ctaLabel: 'Xem sản phẩm',
  ctaHref: '#san-pham'
};

/** Number of products shown per lazy page in the main shop area. */
export const PAGE_SIZE = 24;

/** Maximum products per category carousel. */
export const CAROUSEL_LIMIT = 8;

/** How many category carousels to show on the home page. */
export const HOME_CATEGORY_BLOCKS = 4;

/** Rating only renders when there are enough reviews to be meaningful. */
export const MIN_REVIEWS_FOR_RATING = 3;

/** Low-stock ribbon threshold. */
export const LOW_STOCK_THRESHOLD = 5;

/** Sort options for the shop toolbar. */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng' },
  { value: 'price-desc', label: 'Giá giảm' }
];

/* ============================================================
   Footer / contact facts. Placeholders are explicit so the shop
   owner can fill real values; nothing here invents data.
   ============================================================ */

/** Contact information shown in the footer modals. */
export const CONTACT = {
  hotline: '1900 0000', // TODO chủ cửa hàng: số thật
  hotlineNote: '08h - 20h (Thứ 2 đến Chủ nhật)',
  email: 'Đang cập nhật', // TODO chủ cửa hàng: email thật
  address: 'Đang cập nhật', // TODO chủ cửa hàng: địa chỉ thật
  workHours: '08h - 20h (Thứ 2 đến Chủ nhật)'
};

/** Recruitment: CV inbox (placeholder until the shop provides one). */
export const RECRUIT_EMAIL = 'Đang cập nhật'; // TODO chủ cửa hàng: email nhận CV

/** Store list for the store-system modal. */
export const STORE_LIST = [
  { area: 'Hà Nội', name: 'Cửa hàng DryFood Hoàn Kiếm', address: 'Đang cập nhật', phone: '1900 0000' },
  { area: 'Hồ Chí Minh', name: 'Cửa hàng DryFood Quận 1', address: 'Đang cập nhật', phone: '1900 0000' }
];

/** Return policy numbers (placeholder until confirmed). */
export const RETURN_POLICY = {
  days: 'Đang cập nhật', // TODO chủ cửa hàng: số ngày đổi trả thật
  condition: 'Đang cập nhật'
};

/** Shipping policy numbers (placeholder until confirmed). */
export const SHIPPING = {
  scope: 'Toàn quốc',
  eta: 'Xác nhận trong ngày, giao theo lịch của đơn vị vận chuyển',
  fee: 'Đang cập nhật' // TODO chủ cửa hàng: phí ship thật
};
