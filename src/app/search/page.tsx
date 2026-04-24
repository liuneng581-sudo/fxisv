'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/openclaw', label: 'OpenClaw' },
  { href: '/hermes', label: 'Hermes' },
  { href: '/skills', label: 'Skills' },
  { href: '/tools', label: '工具' },
  { href: '/help', label: '求助' },
];

interface SearchResult {
  category: string;
  path: string;
  id?: number;
  title: string;
  href: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allDocs, setAllDocs] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 加载所有文档数据
  useEffect(() => {
    Promise.all([
      fetch('/api/tutorials?category=OpenClaw').then(r => r.json()),
      fetch('/api/tutorials?category=Hermes').then(r => r.json()),
    ]).then(([openclaw, hermes]) => {
      const docs: SearchResult[] = [];

      (openclaw.list || []).forEach((t: any) => {
        docs.push({
          category: 'OpenClaw',
          path: '/openclaw',
          id: t.id,
          title: t.title,
          href: `/openclaw/tutorial/${t.id}`,
        });
      });

      (hermes.list || []).forEach((t: any) => {
        docs.push({
          category: 'Hermes',
          path: '/hermes',
          id: t.id,
          title: t.title,
          href: `/hermes/tutorial/${t.id}`,
        });
      });

      setAllDocs(docs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const found = allDocs.filter(doc =>
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q)
    );
    setResults(found);
  }, [query, allDocs]);

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', paddingTop: '44px' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-11 transition-all duration-300 bg-[rgba(29,29,31,0.88)] backdrop-blur-xl">
        <div className="max-w-[1024px] mx-auto h-full flex items-center justify-between px-5">
          <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity flex-shrink-0">
            <img src="/icons/bee.svg" className="w-6 h-6 mr-2" alt="bee" />
            <span className="text-[13px] text-white font-semibold tracking-wider">蜂厂长的开源库</span>
          </Link>
          <div className="hidden md:flex items-center">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="px-4 py-[7px] text-[13px] text-white/70 hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Search */}
      <div className="max-w-[600px] mx-auto px-6 pt-16">
        <div className="relative mb-8">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文档、工具、模型..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl text-[16px] outline-none"
            style={{ backgroundColor: '#2d2d30', color: '#f5f5f7', border: '1px solid #3d3d40' }}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#86868b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#86868b' }}>
              清除
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <p className="text-center text-[14px]" style={{ color: '#86868b' }}>加载中...</p>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map((r, i) => (
              <Link key={i} href={r.href}
                className="flex items-center gap-3 p-4 rounded-xl block transition-colors"
                style={{ backgroundColor: '#242426' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d2d30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242426')}>
                <span className="text-[13px] px-2 py-0.5 rounded" style={{ backgroundColor: '#333336', color: '#86868b' }}>{r.category}</span>
                <span style={{ color: '#f5f5f7' }}>{r.title}</span>
              </Link>
            ))}
          </div>
        ) : query ? (
          <p className="text-center text-[14px]" style={{ color: '#86868b' }}>未找到相关结果</p>
        ) : (
          <div>
            <p className="text-[13px] mb-4" style={{ color: '#86868b' }}>快捷分类</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/openclaw"
                className="p-4 rounded-xl text-center transition-colors"
                style={{ backgroundColor: '#242426' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d2d30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242426')}>
                <span className="text-[15px] font-medium" style={{ color: '#f5f5f7' }}>OpenClaw</span>
              </Link>
              <Link href="/hermes"
                className="p-4 rounded-xl text-center transition-colors"
                style={{ backgroundColor: '#242426' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d2d30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242426')}>
                <span className="text-[15px] font-medium" style={{ color: '#f5f5f7' }}>Hermes</span>
              </Link>
              <Link href="/skills"
                className="p-4 rounded-xl text-center transition-colors"
                style={{ backgroundColor: '#242426' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d2d30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242426')}>
                <span className="text-[15px] font-medium" style={{ color: '#f5f5f7' }}>Skills</span>
              </Link>
              <Link href="/tools"
                className="p-4 rounded-xl text-center transition-colors"
                style={{ backgroundColor: '#242426' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d2d30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242426')}>
                <span className="text-[15px] font-medium" style={{ color: '#f5f5f7' }}>工具</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
