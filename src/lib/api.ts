const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchAPI<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// 认证
export const auth = {
  sendCode: (email: string) =>
    fetchAPI<{ success: boolean; message: string }>('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) }),
  register: (data: { email: string; phone: string; password: string; nickname?: string; code: string }) =>
    fetchAPI<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    fetchAPI<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token: string) => fetchAPI<{ user: any }>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  updateProfile: (token: string, data: { nickname?: string; avatar?: string }) =>
    fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  changePassword: (token: string, oldPassword: string, newPassword: string) =>
    fetchAPI('/auth/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }), headers: { Authorization: `Bearer ${token}` } }),
};

// 签到
export const signin = {
  do: (token: string) => fetchAPI('/signin', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  status: (token: string) => fetchAPI<{ signed: boolean; consecutive: number; today_earned: number }>('/signin/status', { headers: { Authorization: `Bearer ${token}` } }),
};

// 积分
export const points = {
  history: (token: string, page = 1) =>
    fetchAPI<{ list: any[]; total: number }>(`/points/history?page=${page}`, { headers: { Authorization: `Bearer ${token}` } }),
  rules: () => fetchAPI<{ rules: any }>('/points/rules', {}),
};

// 用户兑换记录
export const userExchanges = {
  list: (token: string, page = 1) =>
    fetchAPI<{ list: any[]; total: number }>(`/exchanges?page=${page}`, { headers: { Authorization: `Bearer ${token}` } }),
};

// 公开
export const publicApi = {
  posts: (params?: { page?: number; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.category) q.set('category', params.category);
    return fetchAPI<{ list: any[]; total: number }>(`/posts?${q}`, {});
  },
  post: (id: number) => fetchAPI<{ post: any; comments: any[] }>(`/posts/${id}`, {}),
  skills: () => fetchAPI<{ list: any[] }>('/skills', {}),
  tools: () => fetchAPI<{ list: any[] }>('/tools', {}),
  tutorials: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return fetchAPI<{ list: any[] }>(`/tutorials${q}`, {});
  },
  treasures: () => fetchAPI<{ list: any[] }>('/treasures', {}),
};

// 用户操作
export const userActions = {
  createPost: (token: string, data: { category: string; title: string; content: string; images?: string[]; points_reward?: number }) =>
    fetchAPI<{ id: number }>('/posts', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  deletePost: (token: string, id: number) => fetchAPI(`/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  comment: (token: string, postId: number, content: string) =>
    fetchAPI(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }), headers: { Authorization: `Bearer ${token}` } }),
  deleteComment: (token: string, id: number) => fetchAPI(`/comments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  exchangeTreasure: (token: string, treasureId: number) =>
    fetchAPI('/treasures/exchange', { method: 'POST', body: JSON.stringify({ treasure_id: treasureId }), headers: { Authorization: `Bearer ${token}` } }),
};

// 管理后台
export const admin = {
  stats: (token: string) =>
    fetchAPI<{ users: number; posts: number; comments: number; exchanges: number }>('/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
  users: (token: string, page = 1, search?: string) => {
    const q = new URLSearchParams({ page: String(page) });
    if (search) q.set('search', search);
    return fetchAPI<{ list: any[]; total: number }>(`/admin/users?${q}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  updateUser: (token: string, id: number, data: { nickname?: string; avatar?: string; points?: number; role?: string; is_banned?: number }) =>
    fetchAPI(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  pointsHistory: (token: string, userId: number, page = 1) =>
    fetchAPI<{ list: any[]; total: number }>(`/admin/users/${userId}/points-history?page=${page}`, { headers: { Authorization: `Bearer ${token}` } }),
  pointsRules: {
    list: (token: string) =>
      fetchAPI<{ list: any[] }>('/admin/points-rules', { headers: { Authorization: `Bearer ${token}` } }),
    create: (token: string, data: any) =>
      fetchAPI('/admin/points-rules', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: any) =>
      fetchAPI(`/admin/points-rules/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    remove: (token: string, id: number) =>
      fetchAPI(`/admin/points-rules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },
  deleteUser: (token: string, id: number) =>
    fetchAPI(`/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

  tutorials: {
    list: (token: string, category?: string) => {
      const q = category ? `?category=${category}` : '';
      return fetchAPI<{ list: any[] }>(`/admin/tutorials${q}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    create: (token: string, data: { category: string; title: string; content?: string; sort_order?: number }) =>
      fetchAPI<{ id: number }>('/admin/tutorials', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: { title?: string; content?: string; sort_order?: number }) =>
      fetchAPI(`/admin/tutorials/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    delete: (token: string, id: number) =>
      fetchAPI(`/admin/tutorials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },

  skills: {
    list: (token: string) =>
      fetchAPI<{ list: any[] }>('/admin/skills', { headers: { Authorization: `Bearer ${token}` } }),
    create: (token: string, data: { name: string; description?: string; github_url?: string; icon?: string; category?: string; sort_order?: number }) =>
      fetchAPI<{ id: number }>('/admin/skills', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: any) =>
      fetchAPI(`/admin/skills/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    delete: (token: string, id: number) =>
      fetchAPI(`/admin/skills/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },

  tools: {
    list: (token: string) =>
      fetchAPI<{ list: any[] }>('/admin/tools', { headers: { Authorization: `Bearer ${token}` } }),
    create: (token: string, data: { name: string; description?: string; icon?: string; url?: string; category?: string; sort_order?: number }) =>
      fetchAPI<{ id: number }>('/admin/tools', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: any) =>
      fetchAPI(`/admin/tools/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    delete: (token: string, id: number) =>
      fetchAPI(`/admin/tools/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },

  posts: {
    list: (token: string, params?: { page?: number; category?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.category) q.set('category', params.category);
      if (params?.status) q.set('status', params.status);
      return fetchAPI<{ list: any[]; total: number }>(`/admin/posts?${q}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    update: (token: string, id: number, data: { status?: string; title?: string; content?: string }) =>
      fetchAPI(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    delete: (token: string, id: number) =>
      fetchAPI(`/admin/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },

  treasures: {
    list: (token: string) =>
      fetchAPI<{ list: any[] }>('/admin/treasures', { headers: { Authorization: `Bearer ${token}` } }),
    create: (token: string, data: { name: string; description?: string; points_price: number; type?: string; token_amount?: number; stock?: number; sort_order?: number }) =>
      fetchAPI<{ id: number }>('/admin/treasures', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: any) =>
      fetchAPI(`/admin/treasures/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
    delete: (token: string, id: number) =>
      fetchAPI(`/admin/treasures/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  },

  exchanges: {
    list: (token: string, page = 1) =>
      fetchAPI<{ list: any[]; total: number }>(`/admin/exchanges?page=${page}`, { headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, id: number, data: { status: 'approved' | 'rejected' }) =>
      fetchAPI(`/admin/exchanges/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  },
};

// 积分商品
export const treasures = {
  list: () => fetchAPI<{ list: any[] }>('/treasures', {}),
  exchange: (token: string, treasureId: number) =>
    fetchAPI('/treasures/exchange', { method: 'POST', body: JSON.stringify({ treasure_id: treasureId }), headers: { Authorization: `Bearer ${token}` } }),
};

// 技能
export const skills = {
  list: () => fetchAPI<{ list: any[] }>('/skills', {}),
};

// 工具
export const tools = {
  list: () => fetchAPI<{ list: any[] }>('/tools', {}),
};

// 文档
export const tutorials = {
  list: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return fetchAPI<{ list: any[] }>(`/tutorials${q}`, {});
  },
};

// 求助
export const posts = {
  list: (params?: { page?: number; category?: string; keyword?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.category) q.set('category', params.category);
    if (params?.keyword) q.set('keyword', params.keyword);
    return fetchAPI<{ list: any[]; total: number }>(`/posts?${q}`, {});
  },
  detail: (id: number) => fetchAPI<{ post: any; comments: any[] }>(`/posts/${id}`, {}),
  create: (token: string, data: { title: string; content: string; category: string; points_reward?: number; images?: string[] }) =>
    fetchAPI<{ id: number }>('/posts', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  addComment: (token: string, postId: number, content: string) =>
    fetchAPI(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }), headers: { Authorization: `Bearer ${token}` } }),
  delete: (token: string, id: number) =>
    fetchAPI(`/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  deleteComment: (token: string, id: number) =>
    fetchAPI(`/comments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  acceptAnswer: (token: string, postId: number, commentId: number) =>
    fetchAPI(`/posts/${postId}/accept`, { method: 'POST', body: JSON.stringify({ comment_id: commentId }), headers: { Authorization: `Bearer ${token}` } }),
};

// 通知
export const notifications = {
  list: (token: string) =>
    fetchAPI<{ list: any[] }>('/notifications', { headers: { Authorization: `Bearer ${token}` } }),
  unreadCount: (token: string) =>
    fetchAPI<{ count: number }>('/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } }),
  markRead: (token: string, id: number) =>
    fetchAPI(`/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }),
  markAllRead: (token: string) =>
    fetchAPI('/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }),
};

// 通用
export function setToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('token', token);
}
export function clearToken() {
  if (typeof window !== 'undefined') { localStorage.removeItem('token'); localStorage.removeItem('user'); }
}
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
export function getUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
