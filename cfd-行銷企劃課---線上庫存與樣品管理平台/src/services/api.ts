import { MainCategory, ProductModel, VariantSKU, BorrowRecord, StockTransaction } from '../types/inventory';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'manager' | 'user';
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  details: string;
  ip_address: string;
  created_at: string;
}

class ApiService {
  private getToken(): string | null {
    try {
      return localStorage.getItem('cfd_auth_token');
    } catch {
      return null;
    }
  }

  public setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem('cfd_auth_token', token);
      } else {
        localStorage.removeItem('cfd_auth_token');
      }
    } catch {}
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      credentials: 'include',
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMsg = data.error || `伺服器回應錯誤 (${response.status})`;
      const error = new Error(errorMsg);
      (error as any).status = response.status;
      (error as any).code = data.code;
      throw error;
    }

    return data as T;
  }

  // --- Auth APIs ---
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string; message: string }> {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(
    email: string,
    password: string,
    name: string,
    department: string
  ): Promise<{ user: UserProfile; token: string; message: string }> {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, department }),
    });
    this.setToken(res.token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {}
    this.setToken(null);
  }

  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await this.request<{ user: UserProfile }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // --- Categories & Products APIs ---
  async getCategories(): Promise<MainCategory[]> {
    const res = await this.request<{ categories: MainCategory[] }>('/api/categories');
    return res.categories;
  }

  async getProducts(params?: { category?: string; subcategory?: string; q?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.subcategory) query.set('subcategory', params.subcategory);
    if (params?.q) query.set('q', params.q);

    const res = await this.request<{ products: any[] }>(`/api/products?${query.toString()}`);
    return res.products;
  }

  async createProduct(data: {
    categoryId: string;
    subCategory?: string;
    productCode: string;
    productName: string;
    material?: string;
    dimensions?: string;
    variantCode?: string;
    variantName?: string;
    initialStock?: number;
  }): Promise<{ message: string; productId: string; productCode: string }> {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(
    id: string,
    data: {
      productName?: string;
      material?: string;
      dimensions?: string;
      description?: string;
      expectedUpdatedAt?: string;
    }
  ): Promise<{ message: string; updatedAt: string }> {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // --- SKU Variants & Stock APIs ---
  async updateVariant(
    skuCode: string,
    data: {
      newTotalStock?: number;
      locationBin?: string;
      customImage?: string;
      reason?: string;
    }
  ): Promise<{ message: string; totalStock: number }> {
    return this.request(`/api/variants/${encodeURIComponent(skuCode)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVariant(skuCode: string): Promise<{ message: string }> {
    return this.request(`/api/variants/${encodeURIComponent(skuCode)}`, {
      method: 'DELETE',
    });
  }

  // --- Borrow Records APIs ---
  async getBorrows(params?: { status?: string; categoryId?: string }): Promise<BorrowRecord[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.categoryId) query.set('categoryId', params.categoryId);

    const res = await this.request<{ borrows: BorrowRecord[] }>(`/api/borrows?${query.toString()}`);
    return res.borrows;
  }

  async submitBorrow(data: {
    categoryId: string;
    categoryName: string;
    subCategory?: string;
    modelCode: string;
    modelName: string;
    skuCode: string;
    variantName: string;
    borrower: string;
    department: string;
    quantity: number;
    purpose: string;
    expectedReturnDate: string;
    notes?: string;
  }): Promise<{ message: string; borrowId: string; borrowNumber: string }> {
    return this.request('/api/borrows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBorrowStatus(
    id: string,
    action: 'approve' | 'reject' | 'return',
    auditComment?: string
  ): Promise<{ message: string }> {
    return this.request(`/api/borrows/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ action, auditComment }),
    });
  }

  async deleteBorrow(id: string): Promise<{ message: string }> {
    return this.request(`/api/borrows/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Management & Audit Logs APIs ---
  async getTransactions(): Promise<StockTransaction[]> {
    const res = await this.request<{ transactions: StockTransaction[] }>('/api/inventory/transactions');
    return res.transactions;
  }

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await this.request<{ logs: AuditLogItem[] }>('/api/audit-logs');
    return res.logs;
  }

  async getUsers(): Promise<any[]> {
    const res = await this.request<{ users: any[] }>('/api/users');
    return res.users;
  }

  async updateUserRole(id: string, role: 'admin' | 'manager' | 'user'): Promise<{ message: string }> {
    return this.request(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getBackup(): Promise<any> {
    return this.request('/api/backup');
  }

  // --- Notices APIs (新品通知與動態) ---
  async getNotices(): Promise<any[]> {
    const res = await this.request<{ notices: any[] }>('/api/notices');
    return res.notices;
  }

  async markNoticeAsRead(id: string): Promise<{ message: string }> {
    return this.request(`/api/notices/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNoticesAsRead(): Promise<{ message: string }> {
    return this.request('/api/notices/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotice(id: string): Promise<{ message: string }> {
    return this.request(`/api/notices/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
