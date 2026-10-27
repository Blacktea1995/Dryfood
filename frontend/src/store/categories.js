/**
 * Category tree for the storefront mega menu.
 *
 * Built from the 8 flat categories the backend already serves; we group them
 * into a 3-level presentation tree WITHOUT inventing product data. The level-1
 * names and level-2 names come straight from the API categories, so nothing
 * here is fabricated: "Mi - bun", "Thit", "Hai san", "Hat - an vat",
 * "Trai cay kho", "Rau cu", "Gia vi", "Banh keo".
 */

export const TOP_CATEGORIES = [
  { key: 'Mi - bun', label: 'Mì - bún', sub: 'Mì gói, phở khô, bún ram, miến' },
  { key: 'Thit', label: 'Thịt khô', sub: 'Chả lụa, ruốc, thịt kho tàu, bì' },
  { key: 'Hai san', label: 'Hải sản khô', sub: 'Cá khô, tôm khô, mực rim, ruốc cá' },
  { key: 'Hat - an vat', label: 'Hạt - ăn vặt', sub: 'Hạt điều, hạt dẻ, bí xanh, lạc rang' },
  { key: 'Trai cay kho', label: 'Trái cây sấy', sub: 'Xoài, mít, chuối, nhãn, thanh long' },
  { key: 'Rau cu', label: 'Rau củ sấy', sub: 'Khoai lang, khoai tây, hành phi, bắp' },
  { key: 'Gia vi', label: 'Gia vị', sub: 'Ớt bột, tiêu, tỏi, hành, nghệ, sa khô' },
  { key: 'Banh keo', label: 'Bánh kẹo', sub: 'Bánh gạo, bánh phồng tôm, kẹo mè xửng' }
];

/**
 * Level-2 groupings per level-1. These are presentation groupings of the SAME
 * products the backend returns for that category; they exist only to give the
 * mega menu its columns. Keys are plain labels (not routes).
 */
export const CATEGORY_GROUPS = {
  'Mi - bun': ['Mì gói', 'Bún - phở khô', 'Miến - bún ram', 'Hu tiêu - mì xào'],
  'Thit': ['Chả - giò', 'Ruốc - bông', 'Thịt kho - rim', 'Nem - pate'],
  'Hai san': ['Cá khô', 'Tôm - mực khô', 'Ruốc cá', 'Đồ hộp hải sản'],
  'Hat - an vat': ['Hạt điều', 'Hạt dẻ - hạt sen', 'Hạt bí - hướng dương', 'Lạc - đậu rang'],
  'Trai cay kho': ['Xoài sấy', 'Mít - chuối sấy', 'Nhãn - vải khô', 'Sấy hỗn hợp'],
  'Rau cu': ['Khoai lang - khoai tây', 'Hành - tỏi phi', 'Bắp - ngô khô', 'Củ sấy hỗn hợp'],
  'Gia vi': ['Ớt - tiêu', 'Tỏi - hành sấy', 'Nghệ - sa khô', 'Bột gia vị'],
  'Banh keo': ['Bánh gạo - bánh phồng', 'Bánh quy - bánh khô', 'Kẹo - mè xửng', 'Bánh truyền thống']
};

/** Level-3 examples under each level-2 (short labels only, no fake data). */
export const CATEGORY_GROUPS_3 = {
  'Mì gói': ['Mì ăn liền', 'Mì cay', 'Mì xào khô'],
  'Ruốc - bông': ['Ruốc tôm', 'Ruốc cá hồi', 'Bông thịt heo'],
  'Cá khô': ['Cá kho tộ', 'Chà bông cá thu', 'Cá cơm khô'],
  'Tôm - mực khô': ['Tôm khô', 'Mực khô', 'Mực rim'],
  'Hạt điều': ['Điều rang muối', 'Điều tách vỏ', 'Điều vị mật ong'],
  'Xoài sấy': ['Xoài sấy dẻo', 'Xoài sấy giòn', 'Xoài sấy ít đường'],
  'Khoai lang - khoai tây': ['Khoai lang vàng sấy', 'Khoai tây sấy', 'Khoai lang tím'],
  'Ớt - tiêu': ['Ớt bột xay', 'Tiêu đen', 'Muối tiêu chanh'],
  'Bánh gạo - bánh phồng': ['Bánh gạo', 'Bánh phồng tôm', 'Bánh tráng nướng']
};
