'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api-utils';
const ModelsSection = dynamic<{ token: string }>(() => import('@/components/admin/ModelsSection').then(m => m.default), { ssr: false, loading: () => null });

const TreasuresSection = dynamic<{ token: string }>(() => import('@/components/admin/TreasuresSection').then(m => m.default), { ssr: false, loading: () => null });

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

// ─── Auth Gate ─────────────────────────────────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== 'admin') {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 text-sm">验证中...</div>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── Sidebar ───────────────────────────────────────────────────────
const TABS = [
  { value: 'users', label: '用户', icon: '👥' },
  { value: 'exchanges', label: '兑换', icon: '💰' },
  { value: 'tutorials', label: '文档', icon: '📖' },
  { value: 'skills', label: '技能', icon: '🧩' },
  { value: 'tools', label: '工具', icon: '🛠️' },
  { value: 'posts', label: '求助', icon: '💬' },
  { value: 'models', label: '模型', icon: '🤖' },
  { value: 'treasures', label: '商品', icon: '🎁' },
  { value: 'points_rules', label: '积分规则', icon: '📊' },
];

// ─── Users Section ────────────────────────────────────────────────
function UsersSection({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [kw, setKw] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState({ nickname: '', phone: '', avatar: '', points: 0, role: 'user', is_banned: 0, reason: '' });
  const [msg, setMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [phList, setPhList] = useState<any[]>([]);
  const [phTotal, setPhTotal] = useState(0);
  const [phPage, setPhPage] = useState(1);
  const [phLoading, setPhLoading] = useState(false);
  const PAGE_SIZE = 15;

  const load = useCallback(async (p = 1, keyword = kw) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/users?page=${p}&limit=${PAGE_SIZE}&keyword=${encodeURIComponent(keyword)}`, token);
      setUsers(data.list || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token, kw]);

  useEffect(() => { load(1, kw); }, []);

  const loadPointsHistory = async (userId: number, p = 1) => {
    setPhLoading(true);
    try {
      const data = await apiFetch(`/admin/users/${userId}/points-history?page=${p}&limit=10`, token);
      setPhList(data.list || []);
      setPhTotal(data.total || 0);
      setPhPage(p);
    } catch (err) { console.error('loadPointsHistory', err); }
    setPhLoading(false);
  };

  const handleSearch = (v: string) => {
    setKw(v);
    load(1, v);
  };

  const startEdit = (u: any) => {
    setEditId(u.id);
    setEdit({ nickname: u.nickname || '', phone: u.phone || '', avatar: u.avatar || '', points: u.points || 0, role: u.role || 'user', is_banned: u.is_banned || 0, reason: '' });
      setShowHistory(false);
  };

  const saveEdit = async () => {
    try {
      await apiFetch(`/admin/users/${editId}`, token, { method: 'PUT', body: JSON.stringify({ ...edit, reason: edit.reason }) });
      setEditId(null);
      setMsg('保存成功');
      load(page, kw);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">用户管理</h2>
          <p className="text-[13px] text-[#86868b] mt-1">共 {total} 位用户</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={kw}
            onChange={e => handleSearch(e.target.value)}
            placeholder="搜索用户..."
            className="px-4 py-2 bg-[#1d1d1f] border border-[#2d2d2f] rounded-lg text-[13px] text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0071e3] w-48"
          />
        </div>
      </div>

      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}

      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              <th className="text-left p-4 text-[#86868b] font-medium">用户</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden md:table-cell">邮箱</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden lg:table-cell">手机号</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden lg:table-cell">积分</th>
              <th className="text-left p-4 text-[#86868b] font-medium">角色</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden xl:table-cell">注册时间</th>
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">暂无数据</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2d2d2f] flex items-center justify-center text-[16px] flex-shrink-0">
                      {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /> : <img src="/icons/bee.svg" className="w-8 h-8 rounded-full" alt="" />}
                    </div>
                    <span className="text-white font-medium">{u.nickname || '—'}</span>
                  </div>
                </td>
                <td className="p-4 text-[#86868b] hidden md:table-cell">{u.email}</td>
                <td className="p-4 text-[#86868b] hidden lg:table-cell">{u.phone || '—'}</td>
                <td className="p-4 hidden xl:table-cell">
                  <span className="text-[#ff9500] font-medium">{u.points ?? 0}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${u.role === 'admin' ? 'bg-[#0071e3]/20 text-[#2997ff]' : 'bg-[#2d2d2f] text-[#86868b]'}`}>
                    {u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                  {u.is_banned === 1 && <span className="ml-1 px-2 py-0.5 rounded text-[11px] bg-red-500/20 text-red-400">封禁</span>}
                </td>
                <td className="p-4 text-[#86868b] hidden xl:table-cell">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="p-4">
                  {editId === u.id ? (
                    <div className="flex items-center gap-2">
                      <button onClick={saveEdit} className="px-3 py-1 bg-[#0071e3] text-white text-[12px] rounded-lg hover:bg-[#0077ed]">保存</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1 bg-[#2d2d2f] text-[#86868b] text-[12px] rounded-lg hover:bg-[#3d3d3f]">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(u)} className="px-3 py-1 text-[12px] text-[#2997ff] hover:underline">编辑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditId(null)}>
          <div className="bg-[#1d1d1f] rounded-2xl p-6 w-full max-w-md border border-[#2d2d2f]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-5">编辑用户</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">昵称</label>
                <input value={edit.nickname} onChange={e => setEdit({ ...edit, nickname: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">手机号</label>
                <input value={edit.phone || ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">头像 URL</label>
                <input value={edit.avatar} onChange={e => setEdit({ ...edit, avatar: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">积分</label>
                <input type="number" value={edit.points} onChange={e => setEdit({ ...edit, points: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">变更原因（可选）</label>
                <input value={edit.reason || ''} onChange={e => setEdit({ ...edit, reason: e.target.value })} placeholder="如：活动奖励、补偿等" className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0071e3]" />
              </div>
              <div className="border-t border-[#3d3d3f] pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-[#86868b]">积分记录</span>
                  <button onClick={() => { if (!showHistory) { setShowHistory(true); if (editId) loadPointsHistory(editId, 1); } else { setShowHistory(false); } }} className="text-[12px] text-[#0071e3] hover:text-[#0077ed] transition-colors">{showHistory ? '收起' : '查看'}</button>
                </div>
                {showHistory && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {phLoading ? (
                      <div className="text-center py-3 text-[12px] text-[#6e6e73]">加载中...</div>
                    ) : phList.length === 0 ? (
                      <div className="text-center py-3 text-[12px] text-[#6e6e73]">暂无记录</div>
                    ) : (
                      <>
                        {phList.map((h) => (
                          <div key={h.id} className="flex justify-between items-center py-1.5 border-b border-[#2d2d2f] last:border-0">
                            <div>
                              <p className="text-[12px] text-white/60">{h.description || h.type}</p>
                              <p className="text-[11px] text-white/25">{new Date(h.created_at).toLocaleString('zh-CN')}</p>
                            </div>
                            <span className={`text-[13px] font-medium ${h.amount > 0 ? 'text-green-400' : 'text-white/40'}`}>
                              {h.amount > 0 ? '+' : ''}{h.amount}
                            </span>
                          </div>
                        ))}
                        {phTotal > 10 && (
                          <div className="flex justify-center gap-2 pt-2">
                            <button disabled={phPage <= 1} onClick={() => editId && loadPointsHistory(editId, phPage - 1)} className="text-[11px] text-[#86868b] hover:text-white disabled:opacity-30">上一页</button>
                            <span className="text-[11px] text-[#6e6e73]">{phPage}/{Math.ceil(phTotal / 10)}</span>
                            <button disabled={phPage * 10 >= phTotal} onClick={() => editId && loadPointsHistory(editId, phPage + 1)} className="text-[11px] text-[#86868b] hover:text-white disabled:opacity-30">下一页</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">角色</label>
                <select value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]">
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={edit.is_banned === 1} onChange={e => setEdit({ ...edit, is_banned: e.target.checked ? 1 : 0 })} className="w-4 h-4 accent-[#0071e3]" />
                <span className="text-[13px] text-white">封禁用户</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-[#0071e3] text-white text-[14px] font-medium rounded-lg hover:bg-[#0077ed]">保存</button>
              <button onClick={() => { setEditId(null); setShowHistory(false); }} className="flex-1 py-2.5 bg-[#2d2d2f] text-[#86868b] text-[14px] rounded-lg hover:bg-[#3d3d3f]">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">上一页</button>
          <span className="text-[13px] text-[#86868b]">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
          <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => load(page + 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">下一页</button>
        </div>
      )}
    </div>
  );
}

// ─── Points Rules Section ──────────────────────────────────────────
function PointsRulesSection({ token }: { token: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ category: 'earn', action: '', points: 0, description: '', sort_order: 0 });
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/points-rules', token);
      setRules(data.list || []);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await apiFetch(`/admin/points-rules/${editing.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/admin/points-rules', token, { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ category: 'earn', action: '', points: 0, description: '', sort_order: 0 });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleEdit = (r: any) => {
    setEditing(r);
    setForm({ category: r.category, action: r.action, points: r.points, description: r.description || '', sort_order: r.sort_order });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await apiFetch(`/admin/points-rules/${id}`, token, { method: 'DELETE' });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const grouped = { earn: rules.filter((r: any) => r.category === 'earn'), spend: rules.filter((r: any) => r.category === 'spend'), other: rules.filter((r: any) => r.category === 'other') };
  const catLabels = { earn: '获取积分', spend: '消耗积分', other: '其他' };
  const catColors = { earn: 'text-green-400', spend: 'text-yellow-400', other: 'text-blue-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-semibold text-white tracking-tight">积分规则</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ category: 'earn', action: '', points: 0, description: '', sort_order: 0 }); setMsg(''); }} className="px-4 py-2 bg-[#0071e3] text-white text-[13px] rounded-lg hover:bg-[#0077ed]">新增规则</button>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-red-400 border border-[#2d2d2f]">{msg}</div>}

      {showForm && (
        <div className="mb-6 bg-[#1d1d1f] rounded-2xl p-5 border border-[#2d2d2f]">
          <h3 className="text-[16px] font-medium text-white mb-4">{editing ? '编辑规则' : '新增规则'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] text-[#86868b] mb-1.5">分类</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]">
                <option value="earn">获取积分</option>
                <option value="spend">消耗积分</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-[#86868b] mb-1.5">积分值</label>
              <input type="number" value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
            </div>
            <div>
              <label className="block text-[12px] text-[#86868b] mb-1.5">动作名称</label>
              <input value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} placeholder="如：每日签到" className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0071e3]" />
            </div>
            <div>
              <label className="block text-[12px] text-[#86868b] mb-1.5">排序</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] text-[#86868b] mb-1.5">描述</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="描述说明" className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0071e3]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-5 py-2 bg-[#0071e3] text-white text-[13px] rounded-lg hover:bg-[#0077ed]">{editing ? '保存' : '添加'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setMsg(''); }} className="px-5 py-2 bg-[#2d2d2f] text-[#86868b] text-[13px] rounded-lg hover:bg-[#3d3d3f]">取消</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-10 text-[#6e6e73]">加载中...</div> : (
        <div className="space-y-6">
          {(['earn', 'spend', 'other'] as const).map(cat => grouped[cat].length > 0 && (
            <div key={cat}>
              <h3 className={'text-[14px] font-medium mb-3 ' + catColors[cat]}>{catLabels[cat]}</h3>
              <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#2d2d2f]">
                      <th className="text-left p-4 text-[#86868b] font-medium">动作</th>
                      <th className="text-left p-4 text-[#86868b] font-medium">描述</th>
                      <th className="text-left p-4 text-[#86868b] font-medium w-20">积分</th>
                      <th className="text-left p-4 text-[#86868b] font-medium w-20">排序</th>
                      <th className="text-right p-4 text-[#86868b] font-medium w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cat].map((r: any) => (
                      <tr key={r.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/50 transition-colors">
                        <td className="p-4 text-white/80">{r.action}</td>
                        <td className="p-4 text-white/40">{r.description}</td>
                        <td className="p-4 text-white/60">{r.points > 0 ? '+' : ''}{r.points}</td>
                        <td className="p-4 text-white/40">{r.sort_order}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleEdit(r)} className="text-[#0071e3] hover:text-[#0077ed] mr-3">编辑</button>
                          <button onClick={() => handleDelete(r.id)} className="text-red-400/60 hover:text-red-400">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exchanges Section ──────────────────────────────────────────────
function ExchangesSection({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [phList, setPhList] = useState<any[]>([]);
  const [phTotal, setPhTotal] = useState(0);
  const [phPage, setPhPage] = useState(1);
  const [phLoading, setPhLoading] = useState(false);
  const PAGE_SIZE = 15;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/exchanges?page=${p}&limit=${PAGE_SIZE}`, token);
      setList(data.list || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(1); }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await apiFetch(`/admin/exchanges/${id}`, token, { method: 'PUT', body: JSON.stringify({ status }) });
      setMsg(status === 'approved' ? '已通过' : '已拒绝');
      load(page);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-white tracking-tight">积分兑换</h2>
        <p className="text-[13px] text-[#86868b] mt-1">共 {total} 条记录</p>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}
      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              <th className="text-left p-4 text-[#86868b] font-medium">用户</th>
              <th className="text-left p-4 text-[#86868b] font-medium">商品</th>
              <th className="text-left p-4 text-[#86868b] font-medium">消耗积分</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden md:table-cell">Token</th>
              <th className="text-left p-4 text-[#86868b] font-medium">状态</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden lg:table-cell">时间</th>
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">暂无数据</td></tr>
            ) : list.map(e => (
              <tr key={e.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                <td className="p-4"><span className="text-white">{e.nickname || e.email?.split('@')[0] || '—'}</span></td>
                <td className="p-4 text-white">{e.treasure_name || '—'}</td>
                <td className="p-4 text-[#ff9500] font-medium">-{e.points_spent}</td>
                <td className="p-4 text-[#86868b] hidden md:table-cell">{e.token_amount || '—'}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${e.status === 'approved' ? 'bg-green-500/20 text-green-400' : e.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {e.status === 'approved' ? '已通过' : e.status === 'rejected' ? '已拒绝' : '待处理'}
                  </span>
                </td>
                <td className="p-4 text-[#86868b] hidden lg:table-cell">{new Date(e.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="p-4">
                  {e.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(e.id, 'approved')} className="px-3 py-1 text-[12px] bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">通过</button>
                      <button onClick={() => handleAction(e.id, 'rejected')} className="px-3 py-1 text-[12px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">拒绝</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">上一页</button>
          <span className="text-[13px] text-[#86868b]">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
          <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => load(page + 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">下一页</button>
        </div>
      )}
    </div>
  );
}

// ─── CRUD List Editor (tutorials/skills/tools) ──────────────────────
function CrudSection({ token, endpoint, columns, emptyLabel }: {
  token: string;
  endpoint: 'tutorials' | 'skills' | 'tools';
  columns: Array<{ key: string; label: string; type?: string }>;
  emptyLabel: string;
}) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [phList, setPhList] = useState<any[]>([]);
  const [phTotal, setPhTotal] = useState(0);
  const [phPage, setPhPage] = useState(1);
  const [phLoading, setPhLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/${endpoint}`, token);
      setList(data.list || []);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token, endpoint]);

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    const empty: Record<string, string> = {};
    columns.forEach(c => { empty[c.key] = ''; });
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await apiFetch(`/admin/${endpoint}/${editing.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
        setMsg('更新成功');
      } else {
        await apiFetch(`/admin/${endpoint}`, token, { method: 'POST', body: JSON.stringify(form) });
        setMsg('添加成功');
      }
      setShowForm(false);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await apiFetch(`/admin/${endpoint}/${id}`, token, { method: 'DELETE' });
      setMsg('已删除');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">{columns.find(c => c.key === 'name' || c.key === 'title')?.label || endpoint}</h2>
          <p className="text-[13px] text-[#86868b] mt-1">共 {list.length} 条</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-[#0071e3] text-white text-[13px] font-medium rounded-lg hover:bg-[#0077ed]">+ 添加</button>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}
      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              {columns.map(c => <th key={c.key} className="text-left p-4 text-[#86868b] font-medium">{c.label}</th>)}
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={columns.length + 1} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
              : list.length === 0 ? <tr><td colSpan={columns.length + 1} className="p-8 text-center text-[#86868b]">{emptyLabel}</td></tr>
              : list.map(item => (
                <tr key={item.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="p-4 text-white">
                      {c.type === 'image' && item[c.key] ? <img src={item[c.key]} className="w-8 h-8 rounded object-cover" alt="" /> : (item[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="p-4">
                    <button onClick={() => openEdit(item)} className="text-[12px] text-[#2997ff] hover:underline mr-3">编辑</button>
                    <button onClick={() => handleDelete(item.id)} className="text-[12px] text-red-400 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#1d1d1f] rounded-2xl p-6 w-full max-w-lg border border-[#2d2d2f] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-5">{editing ? '编辑' : '添加'}</h3>
            <div className="space-y-4">
              {columns.map(c => (
                <div key={c.key}>
                  <label className="block text-[12px] text-[#86868b] mb-1.5">{c.label}</label>
                  {c.type === 'textarea' ? (
                    <textarea value={form[c.key] || ''} onChange={e => setForm({ ...form, [c.key]: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3] resize-none" />
                  ) : c.type === 'emoji' ? (
                    <div className="flex gap-2">
                      <input value={form[c.key] || ''} onChange={e => setForm({ ...form, [c.key]: e.target.value })} placeholder="选择或输入emoji" className="flex-1 px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
                      <button type="button" onClick={() => { const emojis = ['🤖','🧩','🛠️','📖','💡','🔥','⚡','🎯','🚀','⭐','💎','🎪','🎭','🎨','📦','🔧','🌐','📱','💻','🖥️']; const pick = emojis[Math.floor(Math.random() * emojis.length)]; setForm({ ...form, [c.key]: pick }); }} className="px-3 py-2 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[16px] hover:bg-[#3d3d3f]">🎲</button>
                    </div>
                  ) : (
                    <input value={form[c.key] || ''} onChange={e => setForm({ ...form, [c.key]: e.target.value })} type={c.type === 'number' ? 'number' : 'text'} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[#0071e3] text-white text-[14px] font-medium rounded-lg hover:bg-[#0077ed]">保存</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-[#2d2d2f] text-[#86868b] text-[14px] rounded-lg hover:bg-[#3d3d3f]">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Posts Section ──────────────────────────────────────────────────
function PostsSection({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [phList, setPhList] = useState<any[]>([]);
  const [phTotal, setPhTotal] = useState(0);
  const [phPage, setPhPage] = useState(1);
  const [phLoading, setPhLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const PAGE_SIZE = 15;

  const load = useCallback(async (p = 1, status = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (status) params.append('status', status);
      const data = await apiFetch(`/admin/posts?${params}`, token);
      setList(data.list || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { load(1, filter); }, []);

  const handleAction = async (id: number, status: string) => {
    try {
      await apiFetch(`/admin/posts/${id}`, token, { method: 'PUT', body: JSON.stringify({ status }) });
      setMsg(status === 'approved' ? '已通过' : status === 'solved' ? '已标记解决' : '已删除');
      load(page, filter);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">求助管理</h2>
          <p className="text-[13px] text-[#86868b] mt-1">共 {total} 条</p>
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); load(1, e.target.value); }} className="px-4 py-2 bg-[#1d1d1f] border border-[#2d2d2f] rounded-lg text-[13px] text-white focus:outline-none">
          <option value="">全部</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="solved">已解决</option>
        </select>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}
      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              <th className="text-left p-4 text-[#86868b] font-medium">标题</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden md:table-cell">作者</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden lg:table-cell">悬赏</th>
              <th className="text-left p-4 text-[#86868b] font-medium">状态</th>
              <th className="text-left p-4 text-[#86868b] font-medium hidden xl:table-cell">时间</th>
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
              : list.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">暂无数据</td></tr>
              : list.map(p => (
                <tr key={p.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                  <td className="p-4 text-white max-w-xs truncate">{p.title}</td>
                  <td className="p-4 text-[#86868b] hidden md:table-cell">{p.nickname || p.email?.split('@')[0] || '—'}</td>
                  <td className="p-4 text-[#ff9500] hidden lg:table-cell">{p.points_reward ?? 0}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : p.status === 'solved' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {p.status === 'approved' ? '已通过' : p.status === 'solved' ? '已解决' : '待审核'}
                    </span>
                  </td>
                  <td className="p-4 text-[#86868b] hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {p.status === 'pending' && <button onClick={() => handleAction(p.id, 'approved')} className="px-2 py-1 text-[11px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">通过</button>}
                      {p.status === 'approved' && <button onClick={() => handleAction(p.id, 'solved')} className="px-2 py-1 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30">解决</button>}
                      <button onClick={() => handleAction(p.id, 'deleted')} className="px-2 py-1 text-[11px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">上一页</button>
          <span className="text-[13px] text-[#86868b]">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
          <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => load(page + 1)} className="px-4 py-2 text-[13px] text-white bg-[#1d1d1f] rounded-lg disabled:opacity-30 hover:bg-[#2d2d2f]">下一页</button>
        </div>
      )}
    </div>
  );
}
// ─── Admin Page ────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const token = getToken();

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UsersSection token={token || ""} />;
      case 'exchanges': return <ExchangesSection token={token || ""} />;
      case 'tutorials': return <CrudSection token={token || ""} endpoint="tutorials" emptyLabel="暂无文档" columns={[
        { key: 'title', label: '标题' },
        { key: 'category', label: '分类' },
        { key: 'content', label: '内容', type: 'textarea' },
        { key: 'sort_order', label: '排序', type: 'number' },
      ]} />;
      case 'skills': return <CrudSection token={token || ""} endpoint="skills" emptyLabel="暂无技能" columns={[
        { key: 'name', label: '名称' },
        { key: 'description', label: '描述' },
        { key: 'github_url', label: 'GitHub' },
        { key: 'icon', label: '图标', type: 'emoji' },
        { key: 'sort_order', label: '排序', type: 'number' },
      ]} />;
      case 'tools': return <CrudSection token={token || ""} endpoint="tools" emptyLabel="暂无工具" columns={[
        { key: 'name', label: '名称' },
        { key: 'description', label: '描述' },
        { key: 'url', label: '链接' },
        { key: 'icon', label: '图标', type: 'emoji' },
        { key: 'category', label: '分类' },
      ]} />;
      case 'posts': return <PostsSection token={token || ""} />;
      case 'models': return <ModelsSection token={token || ""} />;
      case 'treasures': return <TreasuresSection token={token || ""} />;
      case 'points_rules': return <PointsRulesSection token={token || ""} />;
      default: return <UsersSection token={token || ""} />;
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-[#1d1d1f] border-b border-[#2d2d2f]">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-[15px] text-[#86868b] hover:text-white transition-colors">← 返回首页</a>
              <span className="text-[#3d3d3f]">|</span>
              <h1 className="text-[15px] font-semibold text-white">管理后台</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#86868b]">管理员</span>
              <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); location.href = '/'; }} className="text-[13px] text-red-400 hover:text-red-300">退出</button>
            </div>
          </div>
        </div>
        <div className="flex max-w-[1600px] mx-auto">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r border-[#2d2d2f] min-h-[calc(100vh-57px)]">
            <nav className="p-3 space-y-0.5">
              {TABS.map(tab => (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${activeTab === tab.value ? 'bg-[#0071e3] text-white' : 'text-[#86868b] hover:bg-[#2d2d2f] hover:text-white'}`}>
                  <span className="text-[15px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>
          {/* Content */}
          <div className="max-w-[1600px] mx-auto px-6 py-10 flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

