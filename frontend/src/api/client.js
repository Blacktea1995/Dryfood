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

  // Products
  getProducts: (q = '') => request('/products' + (q ? `?q=${encodeURIComponent(q)}` : '')),
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
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrderStatus: (id, status) => request('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteOrder: (id) => request('/orders/' + id, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
  getRevenue7Days: () => request('/dashboard/revenue-last-7-days'),
  getTopProducts: () => request('/dashboard/top-products'),
  getOrdersByStatus: () => request('/dashboard/orders-by-status'),
  getInventoryLow: () => request('/dashboard/inventory-low')
};