'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

interface Model {
  id: number;
  name: string;
  description: string;
  icon: string;
  url: string;
  category: string;
}

async function getModels(): Promise<Model[]> {
  try {
    const res = await fetch('/api/models', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.list || []);
  } catch {
    return [];
  }
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    getModels().then(data => {
      setModels(data);
      setLoading(false);
    });
  }, []);

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div
        className="relative overflow-hidden min-h-[200px]"
        style={{ borderBottom: '1px solid #2d2d30' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <style>{`
            @keyframes floatModels {
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
              animation: hovered ? 'floatModels 2.5s ease-in-out infinite' : 'none',
              opacity: hovered ? 0.065 : 0.045,
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }} />
        <div className="relative max-w-[1024px] mx-auto px-6 pt-12 pb-10">
          <p className="text-[12px] font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#8b5cf6' }}>Models</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3" style={{ color: '#f5f5f7' }}>AI 模型</h1>
          <p className="text-[15px]" style={{ color: '#86868b' }}>全球领先的 AI 大模型一览</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <input
            type="text"
            placeholder="搜索模型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#8b5cf6]/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} className="bg-white/5 rounded-xl p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-lg">暂无模型</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(model => (
              <a
                key={model.id}
                href={model.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/[0.03] rounded-xl p-5 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-200 block"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-start gap-4">
                  {model.icon ? (
                    <img src={model.icon} alt={model.name} className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-white/5" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center flex-shrink-0 text-[#8b5cf6] font-bold text-lg">
                      {model.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-white font-semibold text-sm">{model.name}</h3>
                      {model.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]/80">{model.category}</span>}
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{model.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
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
