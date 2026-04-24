'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, posts, auth } from '@/lib/api';

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'openclaw', label: 'OpenClaw' },
  { value: 'hermes', label: 'Hermes' },
  { value: 'skills', label: 'Skills' },
  { value: 'tools', label: '工具' },
  { value: 'models', label: '模型' },
];

export default function HelpPage() {
  const router = useRouter();
  const [postsList, setPostsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [bannerHovered, setBannerHovered] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('openclaw');
  const [submitting, setSubmitting] = useState(false);
  const [pointsReward, setPointsReward] = useState(0);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const token = getToken();
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadPosts();
  }, [category, keyword]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category) params.category = category;
      if (keyword) params.keyword = keyword;
      const res = await posts.list(params);
      setPostsList(res.list || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setFormError('请填写标题和内容'); return; }
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    if (pointsReward > 0 && user?.points < pointsReward) {
      setFormError(`积分不足，当前余额 ${user.points} 积分`);
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await posts.create(token, { title, content, category: postCategory, points_reward: pointsReward });
      setShowCreate(false);
      setTitle('');
      setContent('');
      setPointsReward(0);
      loadPosts();
    } catch (err: any) { setFormError(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[calc(100vh-44px)]" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Banner Header */}
      <div
        className="relative overflow-hidden"
        style={{ borderBottom: '1px solid #2d2d30' }}
        onMouseEnter={() => setBannerHovered(true)}
        onMouseLeave={() => setBannerHovered(false)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 1 }}>
          <style>{`
            @keyframes floatHelp {
              0% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-12px) scale(1.05); }
              100% { transform: translateY(0) scale(1); }
            }
          `}</style>
          <img
            src="/icons/bee.svg"
            className="w-[200px] h-[200px]"
            alt=""
            style={{
              animation: bannerHovered ? 'floatHelp 2.5s ease-in-out infinite' : 'none',
              opacity: bannerHovered ? 0.065 : 0.045,
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #34c759, transparent)' }} />
        <div className="relative max-w-[720px] mx-auto px-6 pt-10 pb-8">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[12px] font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#34c759' }}>求助</p>
              <h1 className="text-[40px] font-semibold tracking-tight" style={{ color: '#f5f5f7' }}>求助区</h1>
              <p className="text-[15px] mt-2" style={{ color: '#86868b' }}>遇到问题？社区成员一起帮你解决</p>
            </div>
            <button
              onClick={() => { if (!getToken()) { router.push('/login'); return; } setShowCreate(true); }}
              className="px-5 py-2.5 text-[13px] font-medium rounded-full transition-all duration-200 flex items-center gap-2 flex-shrink-0 mb-1"
              style={{ backgroundColor: '#0071e3', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0077ed')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0071e3')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              发布问题
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索问题标题或内容..."
              className="w-full pl-11 pr-4 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-full text-[14px] text-white placeholder-white/25 focus:outline-none focus:border-white/15 transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                  category === c.value
                    ? 'bg-white/10 text-white/80 border border-white/15'
                    : 'text-white/30 hover:text-white/50 border border-transparent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-[720px] mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-white/25 text-[14px]">加载中...</div>
        ) : postsList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/25 text-[14px]">暂无问题</p>
            <p className="text-white/15 text-[12px] mt-1">成为第一个提问的人吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {postsList.map((p) => (
              <Link
                key={p.id}
                href={`/help/${p.id}`}
                className="block px-5 py-4 rounded-xl transition-all duration-200"
                style={{ backgroundColor: '#242426', boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#2a2a2e';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#242426';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium mb-1 truncate" style={{ color: '#f5f5f7' }}>{p.title}</h3>
                    <p className="text-[13px] line-clamp-1 leading-relaxed" style={{ color: '#86868b' }}>{p.content?.replace(/[#`*_\\[\]]/g, '').slice(0, 100)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {p.avatar
                        ? <img src={p.avatar} className="w-5 h-5 rounded-full object-cover flex-shrink-0" alt="" />
                        : <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0" style={{ backgroundColor: '#0071e322', color: '#0071e3' }}>{p.nickname?.[0] || p.email?.[0] || '?'}</span>
                      }
                      <span className="text-[11px]" style={{ color: '#6e6e73' }}>{p.nickname || p.email?.split('@')[0]}</span>
                      <span className="text-[11px]" style={{ color: '#6e6e73' }}>{new Date(p.created_at).toLocaleDateString('zh-CN')}</span>
                      {p.category && <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#34c75922', color: '#34c759' }}>{p.category}</span>}
                      {p.points_reward > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }}>悬 {p.points_reward} 积分</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-[11px] flex-shrink-0 mt-0.5">
                    <span style={{ color: '#86868b' }}>{p.comment_count ?? 0}</span>
                    <span className="text-[10px]" style={{ color: '#6e6e73' }}>回复</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-[560px] bg-[#0d0d0f] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-[18px] font-semibold text-white">发布问题</h2>
                {user && <p className="text-[12px] text-white/30 mt-0.5">当前积分：<span className="text-yellow-400/70">{user.points ?? 0}</span></p>}
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="简明扼要地描述你的问题"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15"
                />
              </div>
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="详细描述你的问题（支持 Markdown）"
                  rows={6}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15 resize-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.slice(1).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setPostCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${postCategory === c.value ? 'bg-white/10 text-white/80 border border-white/15' : 'text-white/30 border border-transparent hover:text-white/50'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                <svg className="w-4 h-4 text-yellow-400/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-[13px] text-white/40">悬赏积分</span>
                <input
                  type="number"
                  min={0}
                  max={user?.points ?? 0}
                  value={pointsReward}
                  onChange={(e) => setPointsReward(Math.max(0, Math.min(user?.points ?? 0, parseInt(e.target.value) || 0)))}
                  placeholder="0"
                  className="flex-1 bg-transparent text-[14px] text-white/70 text-right focus:outline-none"
                />
                <span className="text-[12px] text-white/30">积分</span>
                <span className="text-[11px] text-white/20">（余额 {user?.points ?? 0}）</span>
              </div>
              {formError && <p className="text-[13px] text-red-400/80">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-[14px] font-medium rounded-full border border-transparent transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#0071e3', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0077ed')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0071e3')}
              >
                {submitting ? '发布中...' : '发布问题'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
