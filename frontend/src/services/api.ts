import axios from 'axios';
import type { 
  User, LoginCredentials, AuthResponse, 
  Category, MenuItem, Table, Order, OrderItem,
  InventoryItem, InventoryTransaction, Employee, Attendance, Salary,
  Expense, Supplier, Payment, DailyReport, DashboardSummary, AIInsight,
  BulkUserCreatePayload, BulkUserCreateResponse, PaymentReceipt, PublicMenuQrResponse, BusinessSettings,
  RestaurantSignupPayload, RestaurantSignupResponse
} from '@/types';

type CreateOrderPayload = {
  order_type: string;
  table_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  special_instructions?: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    special_instructions?: string;
  }>;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    api.post('/auth/login', credentials).then(res => res.data),

  signupRestaurant: (payload: RestaurantSignupPayload): Promise<RestaurantSignupResponse> =>
    api.post('/auth/signup', payload).then(res => res.data),
  
  register: (userData: Partial<User>): Promise<User> =>
    api.post('/auth/register', userData).then(res => res.data),
  
  getMe: (): Promise<User> =>
    api.get('/auth/me').then(res => res.data),
  
  logout: (): Promise<void> =>
    api.post('/auth/logout').then(res => res.data),
};

// User Service
export const userService = {
  getUsers: (params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> =>
    api.get('/users', { params }).then(res => res.data),
  
  getUser: (id: number): Promise<User> =>
    api.get(`/users/${id}`).then(res => res.data),
  
  createUser: (userData: Partial<User>): Promise<User> =>
    api.post('/users', userData).then(res => res.data),

  createUsersBulk: (bulkData: BulkUserCreatePayload): Promise<BulkUserCreateResponse> =>
    api.post('/users/bulk', bulkData).then(res => res.data),
  
  updateUser: (id: number, userData: Partial<User>): Promise<User> =>
    api.put(`/users/${id}`, userData).then(res => res.data),
  
  deleteUser: (id: number): Promise<void> =>
    api.delete(`/users/${id}`).then(res => res.data),
};

// Menu Service
export const menuService = {
  getCategories: (includeInactive?: boolean): Promise<Category[]> =>
    api.get('/menu/categories', { params: { include_inactive: includeInactive } }).then(res => res.data),
  
  createCategory: (data: Partial<Category>): Promise<Category> =>
    api.post('/menu/categories', data).then(res => res.data),
  
  updateCategory: (id: number, data: Partial<Category>): Promise<Category> =>
    api.put(`/menu/categories/${id}`, data).then(res => res.data),
  
  deleteCategory: (id: number): Promise<void> =>
    api.delete(`/menu/categories/${id}`).then(res => res.data),
  
  getMenuItems: (params?: { category_id?: number; available_only?: boolean; search?: string }): Promise<MenuItem[]> =>
    api.get('/menu/items', { params }).then(res => res.data),
  
  getMenuItem: (id: number): Promise<MenuItem> =>
    api.get(`/menu/items/${id}`).then(res => res.data),
  
  createMenuItem: (data: Partial<MenuItem>): Promise<MenuItem> =>
    api.post('/menu/items', data).then(res => res.data),

  uploadImage: async (file: File): Promise<{ image_url: string; absolute_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/menu/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  updateMenuItem: (id: number, data: Partial<MenuItem>): Promise<MenuItem> =>
    api.put(`/menu/items/${id}`, data).then(res => res.data),
  
  deleteMenuItem: (id: number): Promise<void> =>
    api.delete(`/menu/items/${id}`).then(res => res.data),
  
  toggleAvailability: (id: number): Promise<{ is_available: boolean }> =>
    api.patch(`/menu/items/${id}/toggle-availability`).then(res => res.data),
  
  getTopSelling: (params?: { limit?: number; days?: number }): Promise<{ top_items: any[] }> =>
    api.get('/menu/analytics/top-selling', { params }).then(res => res.data),
};

export const publicMenuService = {
  getCategories: (): Promise<Category[]> =>
    axios.get(`${API_BASE_URL}/menu/public/categories`).then(res => res.data),

  getMenuItems: (params?: { category_id?: number; search?: string }): Promise<MenuItem[]> =>
    axios.get(`${API_BASE_URL}/menu/public/items`, { params }).then(res => res.data),

  getQRCode: (size?: number): Promise<PublicMenuQrResponse> =>
    axios.get(`${API_BASE_URL}/menu/public/qr-code`, { params: { size } }).then(res => res.data),
};

// Table Service
export const tableService = {
  getTables: (status?: string): Promise<Table[]> =>
    api.get('/tables', { params: { status } }).then(res => res.data),
  
  getAvailableTables: (): Promise<Table[]> =>
    api.get('/tables/available').then(res => res.data),
  
  getTable: (id: number): Promise<Table> =>
    api.get(`/tables/${id}`).then(res => res.data),
  
  createTable: (data: Partial<Table>): Promise<Table> =>
    api.post('/tables', data).then(res => res.data),
  
  updateTable: (id: number, data: Partial<Table>): Promise<Table> =>
    api.put(`/tables/${id}`, data).then(res => res.data),
  
  deleteTable: (id: number): Promise<void> =>
    api.delete(`/tables/${id}`).then(res => res.data),
  
  updateStatus: (id: number, status: string): Promise<Table> =>
    api.patch(`/tables/${id}/status`, null, { params: { status } }).then(res => res.data),
};

// Order Service
export const orderService = {
  getOrders: (params?: { status?: string; order_type?: string; table_id?: number; date_from?: string; date_to?: string; skip?: number; limit?: number }): Promise<Order[]> =>
    api.get('/orders', { params }).then(res => res.data),
  
  getActiveOrders: (): Promise<Order[]> =>
    api.get('/orders/active').then(res => res.data),
  
  getOrder: (id: number): Promise<Order> =>
    api.get(`/orders/${id}`).then(res => res.data),
  
  getOrderByNumber: (orderNumber: string): Promise<Order> =>
    api.get(`/orders/by-number/${orderNumber}`).then(res => res.data),
  
  createOrder: (data: CreateOrderPayload): Promise<Order> =>
    api.post('/orders', data).then(res => res.data),
  
  updateOrder: (id: number, data: Partial<Order>): Promise<Order> =>
    api.put(`/orders/${id}`, data).then(res => res.data),
  
  updateStatus: (id: number, status: string, reason?: string): Promise<Order> =>
    api.patch(`/orders/${id}/status`, { status, reason }).then(res => res.data),
  
  addItem: (orderId: number, item: Partial<OrderItem>): Promise<Order> =>
    api.post(`/orders/${orderId}/items`, item).then(res => res.data),
  
  removeItem: (orderId: number, itemId: number): Promise<Order> =>
    api.delete(`/orders/${orderId}/items/${itemId}`).then(res => res.data),
};

// Kitchen Service
export const kitchenService = {
  getOrders: (): Promise<Order[]> =>
    api.get('/kitchen/orders').then(res => res.data),
  
  getPendingOrders: (): Promise<Order[]> =>
    api.get('/kitchen/orders/pending').then(res => res.data),
  
  getCookingOrders: (): Promise<Order[]> =>
    api.get('/kitchen/orders/cooking').then(res => res.data),
  
  getReadyOrders: (): Promise<Order[]> =>
    api.get('/kitchen/orders/ready').then(res => res.data),
  
  startCooking: (orderId: number): Promise<Order> =>
    api.patch(`/kitchen/orders/${orderId}/start-cooking`).then(res => res.data),
  
  markReady: (orderId: number): Promise<Order> =>
    api.patch(`/kitchen/orders/${orderId}/mark-ready`).then(res => res.data),

  pickupOrder: (orderId: number): Promise<Order> =>
    api.patch(`/kitchen/orders/${orderId}/pickup`).then(res => res.data),
  
  getStats: (): Promise<any> =>
    api.get('/kitchen/stats').then(res => res.data),
};

// Inventory Service
export const inventoryService = {
  getItems: (params?: { low_stock_only?: boolean; is_active?: boolean; search?: string }): Promise<InventoryItem[]> =>
    api.get('/inventory/items', { params }).then(res => res.data),
  
  getLowStock: (): Promise<{ low_stock_items: InventoryItem[]; count: number }> =>
    api.get('/inventory/items/low-stock').then(res => res.data),
  
  getItem: (id: number): Promise<InventoryItem> =>
    api.get(`/inventory/items/${id}`).then(res => res.data),
  
  createItem: (data: Partial<InventoryItem>): Promise<InventoryItem> =>
    api.post('/inventory/items', data).then(res => res.data),
  
  updateItem: (id: number, data: Partial<InventoryItem>): Promise<InventoryItem> =>
    api.put(`/inventory/items/${id}`, data).then(res => res.data),
  
  deleteItem: (id: number): Promise<void> =>
    api.delete(`/inventory/items/${id}`).then(res => res.data),
  
  addStock: (id: number, quantity: number, unitCost: number, notes?: string): Promise<InventoryItem> =>
    api.post(`/inventory/items/${id}/add-stock`, null, { params: { quantity, unit_cost: unitCost, notes } }).then(res => res.data),
  
  adjustStock: (id: number, newQuantity: number, reason: string): Promise<InventoryItem> =>
    api.post(`/inventory/items/${id}/adjust`, null, { params: { new_quantity: newQuantity, reason } }).then(res => res.data),
  
  recordWastage: (id: number, quantity: number, reason: string): Promise<InventoryItem> =>
    api.post(`/inventory/items/${id}/wastage`, null, { params: { quantity, reason } }).then(res => res.data),
  
  getTransactions: (params?: { item_id?: number; transaction_type?: string; limit?: number }): Promise<InventoryTransaction[]> =>
    api.get('/inventory/transactions', { params }).then(res => res.data),
  
  getValue: (): Promise<{ total_value: number }> =>
    api.get('/inventory/value').then(res => res.data),
};

// Employee Service
export const employeeService = {
  getEmployees: (params?: { status?: string; role?: string; search?: string }): Promise<Employee[]> =>
    api.get('/employees', { params }).then(res => res.data),
  
  getEmployee: (id: number): Promise<Employee> =>
    api.get(`/employees/${id}`).then(res => res.data),
  
  createEmployee: (data: Partial<Employee>): Promise<Employee> =>
    api.post('/employees', data).then(res => res.data),
  
  updateEmployee: (id: number, data: Partial<Employee>): Promise<Employee> =>
    api.put(`/employees/${id}`, data).then(res => res.data),
  
  deleteEmployee: (id: number): Promise<void> =>
    api.delete(`/employees/${id}`).then(res => res.data),
  
  getAttendance: (params?: { employee_id?: number; date_from?: string; date_to?: string }): Promise<Attendance[]> =>
    api.get('/employees/attendance/records', { params }).then(res => res.data),
  
  recordAttendance: (data: Partial<Attendance>): Promise<Attendance> =>
    api.post('/employees/attendance', data).then(res => res.data),
  
  updateAttendance: (id: number, data: Partial<Attendance>): Promise<Attendance> =>
    api.put(`/employees/attendance/${id}`, data).then(res => res.data),
  
  getAttendanceSummary: (employeeId: number, month: number, year: number): Promise<any> =>
    api.get(`/employees/${employeeId}/attendance-summary`, { params: { month, year } }).then(res => res.data),
  
  getSalaries: (params?: { employee_id?: number; month?: number; year?: number; is_paid?: boolean }): Promise<Salary[]> =>
    api.get('/employees/salaries', { params }).then(res => res.data),
  
  createSalary: (data: Partial<Salary>): Promise<Salary> =>
    api.post('/employees/salaries', data).then(res => res.data),
  
  updateSalary: (id: number, data: Partial<Salary>): Promise<Salary> =>
    api.put(`/employees/salaries/${id}`, data).then(res => res.data),
  
  processPayment: (id: number): Promise<Salary> =>
    api.post(`/employees/salaries/${id}/pay`).then(res => res.data),
  
  autoGenerateSalary: (employeeId: number, month: number, year: number): Promise<Salary> =>
    api.post(`/employees/${employeeId}/auto-generate-salary`, null, { params: { month, year } }).then(res => res.data),
};

// Payment Service
export const paymentService = {
  getPayments: (params?: { status?: string; payment_method?: string; date_from?: string; date_to?: string }): Promise<Payment[]> =>
    api.get('/payments', { params }).then(res => res.data),
  
  getPayment: (id: number): Promise<Payment> =>
    api.get(`/payments/${id}`).then(res => res.data),
  
  createPayment: (data: Partial<Payment>): Promise<Payment> =>
    api.post('/payments', data).then(res => res.data),
  
  updatePayment: (id: number, data: Partial<Payment>): Promise<Payment> =>
    api.put(`/payments/${id}`, data).then(res => res.data),
  
  processRefund: (id: number, amount: number, reason?: string): Promise<Payment> =>
    api.post(`/payments/${id}/refund`, { amount, reason }).then(res => res.data),

  getReceipt: (id: number): Promise<PaymentReceipt> =>
    api.get(`/payments/${id}/receipt`).then(res => res.data),
  
  getDailySummary: (reportDate?: string): Promise<any> =>
    api.get('/payments/daily/summary', { params: { report_date: reportDate } }).then(res => res.data),
};

// Expense Service
export const expenseService = {
  getExpenses: (params?: { category?: string; date_from?: string; date_to?: string }): Promise<Expense[]> =>
    api.get('/expenses', { params }).then(res => res.data),
  
  getExpense: (id: number): Promise<Expense> =>
    api.get(`/expenses/${id}`).then(res => res.data),
  
  createExpense: (data: Partial<Expense>): Promise<Expense> =>
    api.post('/expenses', data).then(res => res.data),
  
  updateExpense: (id: number, data: Partial<Expense>): Promise<Expense> =>
    api.put(`/expenses/${id}`, data).then(res => res.data),
  
  deleteExpense: (id: number): Promise<void> =>
    api.delete(`/expenses/${id}`).then(res => res.data),
  
  getSuppliers: (params?: { is_active?: string; search?: string }): Promise<Supplier[]> =>
    api.get('/expenses/suppliers', { params }).then(res => res.data),
  
  getSupplier: (id: number): Promise<Supplier> =>
    api.get(`/expenses/suppliers/${id}`).then(res => res.data),
  
  createSupplier: (data: Partial<Supplier>): Promise<Supplier> =>
    api.post('/expenses/suppliers', data).then(res => res.data),
  
  updateSupplier: (id: number, data: Partial<Supplier>): Promise<Supplier> =>
    api.put(`/expenses/suppliers/${id}`, data).then(res => res.data),
  
  deleteSupplier: (id: number): Promise<void> =>
    api.delete(`/expenses/suppliers/${id}`).then(res => res.data),
};

// Report Service
export const reportService = {
  getDailyReport: (reportDate?: string): Promise<DailyReport> =>
    api.get('/reports/daily', { params: { report_date: reportDate } }).then(res => res.data),
  
  getMonthlyReport: (month?: number, year?: number): Promise<any> =>
    api.get('/reports/monthly', { params: { month, year } }).then(res => res.data),
  
  getSalesReport: (dateFrom?: string, dateTo?: string): Promise<any> =>
    api.get('/reports/sales', { params: { date_from: dateFrom, date_to: dateTo } }).then(res => res.data),
  
  getInventoryReport: (): Promise<any> =>
    api.get('/reports/inventory').then(res => res.data),
  
  getEmployeeReport: (month?: number, year?: number): Promise<any> =>
    api.get('/reports/employees', { params: { month, year } }).then(res => res.data),
  
  getDashboardSummary: (): Promise<DashboardSummary> =>
    api.get('/reports/dashboard').then(res => res.data),
  
  getProfitLoss: (dateFrom?: string, dateTo?: string): Promise<any> =>
    api.get('/reports/profit-loss', { params: { date_from: dateFrom, date_to: dateTo } }).then(res => res.data),
};

// AI Service
export const aiService = {
  getBusinessInsights: (): Promise<any> =>
    api.get('/ai/insights').then(res => res.data),
  
  getDemandPrediction: (): Promise<any> =>
    api.get('/ai/demand-prediction').then(res => res.data),
  
  getMenuOptimization: (): Promise<any> =>
    api.get('/ai/menu-optimization').then(res => res.data),
  
  chatAssistant: (question: string): Promise<any> =>
    api.post('/ai/chat', null, { params: { question } }).then(res => res.data),
  
  getDailyBriefing: (): Promise<any> =>
    api.get('/ai/daily-briefing').then(res => res.data),
  
  getDashboardInsights: (): Promise<{ insights: AIInsight[] }> =>
    api.get('/ai/dashboard-insights').then(res => res.data),
};

export const systemService = {
  getBusinessSettings: (): Promise<BusinessSettings> =>
    api.get('/system/business-settings').then((res) => res.data),

  updateBusinessSettings: (payload: BusinessSettings): Promise<BusinessSettings> =>
    api.put('/system/business-settings', payload).then((res) => res.data),
};

export const resolveMediaUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default api;
