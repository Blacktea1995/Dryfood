const BASE = '/api';

function getToken() {
  try {
    return localStorage.getItem('df_token');
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {};
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(BASE + path, {
    headers,
    ...options
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code = res.status;
    if (code === 401) {
      // Token het han / khong hop le -> xoa dang nhap
      try {
        localStorage.removeItem('df_token');
        localStorage.removeItem('df_user');
      } catch { /* ignore */ }
    }
    const msg = data?.message || data?.error || 'Yêu cầu thất bại (HTTP ' + res.status + ')';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/me/password', { method: 'PUT', body: JSON.stringify(body) }),

  // Products
  getProducts: (q = '') => request('/products' + (q ? `?q=${encodeURIComponent(q)}` : '')),
  getProductsFiltered: (params = {}) => {
    const p = new URLSearchParams();
    if (params.q) p.set('q', params.q);
    if (params.category) p.set('category', params.category);
    if (params.sort) p.set('sort', params.sort);
    if (params.order) p.set('order', params.order);
    if (params.page !== undefined) p.set('page', params.page);
    if (params.size !== undefined) p.set('size', params.size);
    const qs = p.toString();
    return request('/products' + (qs ? '?' + qs : ''));
  },
  getCategories: () => request('/products/categories'),
  getProduct: (id) => request('/products/' + id),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request('/products/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  adjustStock: (id, delta) => request(`/products/${id}/stock?delta=${delta}`, { method: 'PUT' }),
  deleteProduct: (id) => request('/products/' + id, { method: 'DELETE' }),
  getLowStock: (threshold = 10) => request('/products/low-stock?threshold=' + threshold),

  // Customers
  getCustomers: (q = '') => request('/customers' + (q ? `?q=${encodeURIComponent(q)}` : '')),
  getCustomer: (id) => request('/customers/' + id),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request('/customers/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id) => request('/customers/' + id, { method: 'DELETE' }),

  // Orders
  getOrders: (status = '') => request('/orders' + (status ? `?status=${status}` : '')),
  getOrder: (id) => request('/orders/' + id),
  getOrderTimeline: (id) => request('/orders/' + id + '/timeline'),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrderStatus: (id, status, note) => request('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status, note }) }),
  deleteOrder: (id) => request('/orders/' + id, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
  getRevenue7Days: () => request('/dashboard/revenue-last-7-days'),
  getTopProducts: () => request('/dashboard/top-products'),
  getOrdersByStatus: () => request('/dashboard/orders-by-status'),
  getInventoryLow: () => request('/dashboard/inventory-low'),

  // Vouchers
  getVouchers: () => request('/vouchers'),
  createVoucher: (body) => request('/vouchers', { method: 'POST', body: JSON.stringify(body) }),
  updateVoucher: (id, body) => request('/vouchers/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVoucher: (id) => request('/vouchers/' + id, { method: 'DELETE' }),
  previewVoucher: (code, orderTotal) => request(`/vouchers/discount?code=${encodeURIComponent(code)}&orderTotal=${orderTotal}`),

  // Reviews
  getReviews: (productId) => request('/reviews?productId=' + productId),
  createReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Analytics
  getRfmSegments: () => request('/analytics/rfm'),
  getChurnRisk: () => request('/analytics/churn'),
  getForecast: (days = 7) => request('/analytics/forecast?days=' + days),
  getDemandForecast: () => request('/analytics/demand'),
  getRecommendations: (productId, limit = 5) => request(`/analytics/recommend?productId=${productId}&limit=${limit}`),

  // Export
  exportUrl: (kind) => '/api/export/' + kind + '.csv'
};