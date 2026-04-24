'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, posts } from '@/lib/api';

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(err => console.error(err));
  };
  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[11px] text-white/25 font-mono">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100">
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="w-full overflow-x-auto px-5 py-4 text-[13px] text-white/70 font-mono leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ContentRenderer({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
          if (match) return <CodeBlock key={i} code={match[2].trim()} language={match[1]} />;
        }
        const lines = part.split('\n');
        return lines.map((line, j) => {
          if (line.startsWith('### ')) return <h3 key={`${i}-${j}`} className="text-[17px] font-semibold text-white/90 mt-6 mb-2">{line.slice(4)}</h3>;
          if (line.startsWith('## ')) return <h2 key={`${i}-${j}`} className="text-[20px] font-semibold text-white/90 mt-8 mb-3">{line.slice(3)}</h2>;
          if (line.startsWith('- ')) return <li key={`${i}-${j}`} className="text-[14px] text-white/60 ml-4 list-disc">{line.slice(2)}</li>;
          if (line.trim() === '') return null;
          return <p key={`${i}-${j}`} className="text-[14px] text-white/60 leading-relaxed">{line}</p>;
        });
      })}
    </div>
  );
}

export default function HelpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch { return; }
    loadPost();
  }, []);

  const loadPost = async () => {
    try {
      const res = await posts.detail(Number(params.id));
      setPost(res);
    } catch { router.push('/help'); }
    setLoading(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setSubmitting(true);
    try {
      await posts.addComment(token, Number(params.id), comment);
      setComment('');
      loadPost();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async (type: 'post' | 'comment', id: number) => {
    if (!confirm('确认删除？')) return;
    const token = getToken();
    if (!token) return;
    try {
      if (type === 'post') {
        await posts.delete(token, id);
        router.push('/help');
      } else {
        await posts.deleteComment(token, id);
        loadPost();
      }
    } catch (err: any) { alert(err.message); }
  };

  const handleAccept = async (commentId: number) => {
    if (!confirm('确认采纳此回答？积分将自动转账给回答者。')) return;
    const token = getToken();
    if (!token) return;
    try {
      await posts.acceptAnswer(token, Number(params.id), commentId);
      loadPost();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-44px)] flex items-center justify-center bg-black">
        <div className="text-white/30 text-[14px]">加载中...</div>
      </div>
    );
  }

  if (!post) return null;

  const avatarColors = ['#ff6b6b','#feca57','#48dbfb','#1dd1a1','#ff9ff3','#54a0ff','#5f27cd','#00d2d3'];
  const getColor = (id: number) => avatarColors[id % avatarColors.length];

  return (
    <div className="min-h-[calc(100vh-44px)] bg-black">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-[720px] mx-auto px-6 py-6">
          <Link href="/help" className="inline-flex items-center gap-1.5 text-[13px] text-white/30 hover:text-white/60 transition-colors mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>
            返回求助区
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white flex-shrink-0"
              style={{ background: getColor(post.user_id || 0) }}
            >
              {(post.nickname || post.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-[22px] font-semibold text-white">{post.title}</h1>
                {post.category && (
                  <span className="text-[11px] text-white/25 bg-white/5 px-2 py-0.5 rounded-full">{post.category}</span>
                )}
                {post.status === 'solved' && (
                  <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">已解决</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[12px] text-white/30">
                <span>{post.nickname || post.email?.split('@')[0]}</span>
                <span>·</span>
                <span>{new Date(post.created_at).toLocaleString('zh-CN')}</span>
                {post.points_reward > 0 && <span className="text-blue-400/50">{post.points_reward} 积分</span>}
                {(user?.id === post.user_id || user?.role === 'admin') && (
                  <button onClick={() => handleDelete('post', post.id)} className="text-red-400/40 hover:text-red-400/70 ml-2 transition-colors">删除</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 mb-8">
          {post.content ? <ContentRenderer content={post.content} /> : <p className="text-white/30 text-[14px]">暂无内容</p>}
        </div>

        {/* Comments */}
        <div>
          <h2 className="text-[16px] font-semibold text-white/70 mb-5">
            {post.comments?.length || 0} 条回复
          </h2>

          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="写下你的回复..."
                rows={3}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15 resize-none mb-3"
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-5 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white/70 text-[13px] font-medium rounded-full border border-white/10 transition-colors"
              >
                {submitting ? '发送中...' : '发送回复'}
              </button>
            </form>
          ) : (
            <p className="text-[13px] text-white/25 mb-6">
              <Link href="/login" className="text-white/50 hover:text-white/70 underline">登录</Link>后可回复
            </p>
          )}

          {/* Comments list */}
          <div className="space-y-4">
            {(post.comments || []).map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0 mt-0.5"
                  style={{ background: getColor(c.user_id || 0) }}
                >
                  {(c.nickname || c.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] text-white/50 font-medium">{c.nickname || c.email?.split('@')[0]}</span>
                      <span className="text-[11px] text-white/20">{new Date(c.created_at).toLocaleString('zh-CN')}</span>
                      {c.is_best_answer ? (
                        <span className="text-[11px] text-green-400 ml-auto">✓ 已采纳</span>
                      ) : user && String(user.id) === String(post.user_id) && String(user.id) !== String(c.user_id) && post.status !== 'solved' ? (
                        <button onClick={() => handleAccept(c.id)} className="text-[11px] text-blue-400 hover:text-blue-300 ml-auto transition-colors">采纳</button>
                      ) : null}
                      {(String(user?.id) === String(c.user_id) || user?.role === 'admin') && (
                        <button onClick={() => handleDelete('comment', c.id)} className="text-red-400/40 hover:text-red-400/70 ml-2 text-[11px] transition-colors">删除</button>
                      )}
                    </div>
                    <p className="text-[14px] text-white/60 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
