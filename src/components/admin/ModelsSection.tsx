'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-utils';

interface Model {
  id?: number;
  name: string;
  description: string;
  icon: string;
  url: string;
  category: string;
  sort_order: number;
  image: string;
}

export default function ModelsSection({ token }: { token: string }) {
  const [list, setList] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [form, setForm] = useState<Model>({ name: '', description: '', icon: '', url: '', category: '', sort_order: 0, image: '' });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/models', token);
      setList(data.list || []);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '🤖', url: '', category: '', sort_order: 0, image: '' });
    setShowForm(true);
  };

  const openEdit = (item: Model) => {
    setEditing(item);
    setForm(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setMsg('请输入名称'); return; }
    try {
      if (editing?.id) {
        await apiFetch(`/admin/models/${editing.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
        setMsg('更新成功');
      } else {
        await apiFetch('/admin/models', token, { method: 'POST', body: JSON.stringify(form) });
        setMsg('添加成功');
      }
      setShowForm(false);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await apiFetch(`/admin/models/${id}`, token, { method: 'DELETE' });
      setMsg('已删除');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">AI 模型</h2>
          <p className="text-[13px] text-[#86868b] mt-1">共 {list.length} 条</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-[#0071e3] text-white text-[13px] font-medium rounded-lg hover:bg-[#0077ed]">+ 添加模型</button>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}
      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              <th className="text-left p-4 text-[#86868b] font-medium">图标</th>
              <th className="text-left p-4 text-[#86868b] font-medium">名称</th>
              <th className="text-left p-4 text-[#86868b] font-medium">描述</th>
              <th className="text-left p-4 text-[#86868b] font-medium">分类</th>
              <th className="text-left p-4 text-[#86868b] font-medium">排序</th>
              <th className="text-left p-4 text-[#86868b] font-medium">图片</th>
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
              : list.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[#86868b]">暂无模型</td></tr>
              : list.map(item => (
                <tr key={item.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                  <td className="p-4 text-[20px]">{item.icon || '—'}</td>
                  <td className="p-4 text-white font-medium">{item.name}</td>
                  <td className="p-4 text-white/60 max-w-[200px] truncate">{item.description || '—'}</td>
                  <td className="p-4 text-white/60">{item.category || '—'}</td>
                  <td className="p-4 text-white/60">{item.sort_order}</td>
                  <td className="p-4">{item.image ? <img src={item.image} className="w-8 h-8 rounded object-cover" alt="" /> : '—'}</td>
                  <td className="p-4">
                    <button onClick={() => openEdit(item)} className="text-[12px] text-[#2997ff] hover:underline mr-3">编辑</button>
                    <button onClick={() => handleDelete(item.id!)} className="text-[12px] text-red-400 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#1d1d1f] rounded-2xl p-6 w-full max-w-lg border border-[#2d2d2f] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-5">{editing ? '编辑模型' : '添加模型'}</h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">名称 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              {/* Description */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">描述</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3] resize-none" />
              </div>
              {/* Icon (emoji) */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">图标</label>
                <div className="flex gap-2">
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🤖" className="flex-1 px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
                  <button type="button" onClick={() => { const emojis = ['🤖','🧩','🛠️','📖','💡','🔥','⚡','🎯','🚀','⭐','💎','🎪','🎭','🎨','📦','🔧','🌐','📱','💻','🖥️','🌟','💫','🎉','🎊','🔮','🗝️']; setForm({ ...form, icon: emojis[Math.floor(Math.random() * emojis.length)] }); }} className="px-3 py-2 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[16px] hover:bg-[#3d3d3f]">🎲</button>
                </div>
              </div>
              {/* URL */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">链接</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://" className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              {/* Category */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">分类</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="例如：LLM、CV、Audio" className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              {/* Sort order */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">排序</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
              </div>
              {/* Image upload */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">图片</label>
                {form.image && <img src={form.image} className="w-full max-w-[200px] h-[150px] object-cover rounded-lg mb-2 bg-[#2d2d2f]" alt="" />}
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] cursor-pointer hover:border-[#0071e3] transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  <span className="text-white">{uploading ? '上传中...' : (form.image ? '更换图片' : '上传图片')}</span>
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    if (file.size > 300 * 1024) { setMsg('图片不能超过 300KB'); return; }
                    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
                    if (!allowed.includes(file.type)) { setMsg('只支持 JPG/PNG/GIF/WEBP 格式'); return; }
                    setUploading(true); setMsg('');
                    try {
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || '上传失败');
                      setForm((prev: any) => ({ ...prev, image: data.url }));
                      setMsg('图片上传成功');
                    } catch (err: any) { setMsg(err.message); }
                    setUploading(false);
                  }} disabled={uploading} className="hidden" />
                </label>
                {form.image && <button onClick={() => setForm({ ...form, image: '' })} className="ml-2 text-[12px] text-red-400 hover:underline">移除</button>}
              </div>
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
