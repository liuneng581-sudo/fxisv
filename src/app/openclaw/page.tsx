"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tutorials } from '@/lib/api';

interface Tutorial {
  id: number;
  title: string;
  content: string;
  sort_order: number;
}

export default function OpenClawPage() {
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(false);
  const [docs, setDocs] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorials.list('OpenClaw').then(res => {
      setDocs(res.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? docs.filter(d => d.title.includes(query) || d.content.includes(query))
    : docs;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '44px' }}>
      <div className="relative overflow-hidden min-h-[200px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <style>{`
            @keyframes floatBee {
              0% { transform: translateY(0) scale(1) rotate(-3deg); }
              50% { transform: translateY(-12px) scale(1.05) rotate(3deg); }
              100% { transform: translateY(0) scale(1) rotate(-3deg); }
            }
          `}</style>
          <img src="/icons/bee.svg" className="w-[200px] h-[200px]" alt=""
            style={{
              animation: hovered ? 'floatBee 2.5s ease-in-out infinite' : 'none',
              opacity: hovered ? 0.065 : 0.045,
            }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #0071e3, #00c7be)' }} />
        <div className="relative max-w-[1024px] mx-auto px-6 pt-12 pb-10">
          <p className="text-[12px] font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#0071e3' }}>OpenClaw</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3" style={{ color: '#f5f5f7' }}>OpenClaw</h1>
          <p className="text-[15px]" style={{ color: '#86868b' }}>开源 AI 智能体协作框架</p>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-6 py-10">
        <div className="relative mb-8">
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索文档..."
            className="w-full rounded-xl px-4 py-3 pl-10 text-[14px] outline-none"
            style={{ backgroundColor: '#2d2d2e', color: '#f5f5f7', border: '1px solid rgba(255,255,255,0.08)' }} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#86868b' }}>🔍</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p style={{ color: '#86868b' }}>加载中...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#86868b' }}>暂无文档</p>
          ) : (
            filtered.map(doc => (
              <Link key={doc.id} href={`/openclaw/tutorial/${doc.id}`}
                className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 block"
                style={{ backgroundColor: '#242426', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#2a2a2e';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#242426';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="text-[15px] font-medium mb-1" style={{ color: '#f5f5f7' }}>{doc.title}</h3>
                  <p className="text-[13px]" style={{ color: '#86868b' }}>
                    {doc.content.replace(/[#*`\[\]]/g, '').slice(0, 60)}...
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <footer className="py-5 border-t" style={{ backgroundColor: '#161616', borderColor: '#2d2d30' }}>
        <div className="max-w-[1024px] mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mb-3">
            <a href="/openclaw" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">OpenClaw</a>
            <a href="/hermes" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">Hermes</a>
            <a href="/skills" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">Skills</a>
            <a href="/tools" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">工具</a>
            <a href="/models" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">模型</a>
            <a href="/help" className="text-[12px] text-white/25 hover:text-white/45 transition-colors">求助</a>
          </div>
          <p className="text-[11px] text-white/20">© 2026 蜂厂长的开源库</p>
        </div>
      </footer>
    </div>
  );
}
