'use client';
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from '@/lib/api-utils';
function TreasuresSection({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const TREASURE_COLS = [
    { key: 'name', label: '名称' },
    { key: 'description', label: '描述' },
    { key: 'points_price', label: '积分价', type: 'number' },
    { key: 'token_amount', label: 'Token量', type: 'number' },
    { key: 'stock', label: '库存' },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/treasures', token);
      setList(data.list || []);
    } catch { setMsg('加载失败'); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    const empty: Record<string, string> = {};
    TREASURE_COLS.forEach(c => { empty[c.key] = ''; });
    empty.image = '';
    setForm(empty);
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (item: any) => { setEditing(item); setForm({ ...item }); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await apiFetch(`/admin/treasures/${editing.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
        setMsg('更新成功');
      } else {
        await apiFetch('/admin/treasures', token, { method: 'POST', body: JSON.stringify(form) });
        setMsg('添加成功');
      }
      setShowForm(false);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await apiFetch(`/admin/treasures/${id}`, token, { method: 'DELETE' });
      setMsg('已删除');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">积分商品</h2>
          <p className="text-[13px] text-[#86868b] mt-1">共 {list.length} 件商品</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-[#0071e3] text-white text-[13px] font-medium rounded-lg hover:bg-[#0077ed]">+ 添加</button>
      </div>
      {msg && <div className="mb-4 px-4 py-3 bg-[#1d1d1f] rounded-lg text-[13px] text-[#86868b] border border-[#2d2d2f]">{msg}</div>}
      <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#2d2d2f]">
              <th className="text-left p-4 text-[#86868b] font-medium">图片</th>
              {TREASURE_COLS.map(c => <th key={c.key} className="text-left p-4 text-[#86868b] font-medium">{c.label}</th>)}
              <th className="text-left p-4 text-[#86868b] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={TREASURE_COLS.length + 2} className="p-8 text-center text-[#86868b]">加载中...</td></tr>
              : list.length === 0 ? <tr><td colSpan={TREASURE_COLS.length + 2} className="p-8 text-center text-[#86868b]">暂无数据</td></tr>
              : list.map(item => (
                <tr key={item.id} className="border-b border-[#2d2d2f] last:border-0 hover:bg-[#2d2d2f]/40 transition-colors">
                  <td className="p-4">
                    {item.image ? (
                      <img src={item.image} className="w-16 h-12 object-cover rounded-lg bg-[#2d2d2f]" alt="" />
                    ) : (
                      <div className="w-16 h-12 bg-[#2d2d2f] rounded-lg flex items-center justify-center text-[#86868b] text-[10px]">无图</div>
                    )}
                  </td>
                  {TREASURE_COLS.map(c => <td key={c.key} className="p-4 text-white">{item[c.key] ?? '—'}</td>)}
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
          <div className="bg-[#1d1d1f] rounded-2xl p-6 w-full max-w-lg border border-[#2d2d2f]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white mb-5">{editing ? '编辑' : '添加'}商品</h3>
            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-[12px] text-[#86868b] mb-1.5">商品图片 <span className="text-[10px] text-[#555]">(400×300, 最大300KB)</span></label>
                {form.image && (
                  <img src={form.image} className="w-full max-w-[200px] h-[150px] object-cover rounded-lg mb-2 bg-[#2d2d2f]" alt="" />
                )}
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] cursor-pointer hover:border-[#0071e3] transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  <span className="text-white">{uploading ? '上传中...' : (form.image ? '更换图片' : '上传图片')}</span>
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    if (file.size > 300 * 1024) { setMsg('图片不能超过 300KB'); return; }
                    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
                    if (!allowed.includes(file.type)) { setMsg('只支持 JPG/PNG/GIF/WEBP 格式'); return; }
                    setUploading(true);
                    setMsg('');
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
                {form.image && (
                  <button onClick={() => setForm({ ...form, image: '' })} className="ml-2 text-[12px] text-red-400 hover:underline">移除</button>
                )}
              </div>
              {TREASURE_COLS.map(c => (
                <div key={c.key}>
                  <label className="block text-[12px] text-[#86868b] mb-1.5">{c.label}</label>
                  <input value={form[c.key] ?? ''} onChange={e => setForm({ ...form, [c.key]: e.target.value })} type={c.type === 'number' ? 'number' : 'text'} className="w-full px-4 py-2.5 bg-[#2d2d2f] border border-[#3d3d3f] rounded-lg text-[14px] text-white focus:outline-none focus:border-[#0071e3]" />
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
export default TreasuresSection;