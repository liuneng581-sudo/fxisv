'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const PIXEL_BEE_SVG = `<svg viewBox="0 0 1024 1024" style="image-rendering:pixelated;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg"><path d="M860.8 512.83h59.96v59.96H860.8zM800.86 632.73h59.95v59.96h-59.95z" fill="#333333"></path><path d="M800.86 572.78h59.95v59.95h-59.95z" fill="#333333"></path><path d="M800.86 512.83h59.95v59.96h-59.95zM800.86 452.88h59.95v59.95h-59.95zM740.9 692.68h59.96v59.96H740.9z" fill="#333333"></path><path d="M740.9 632.73h59.96v59.96H740.9zM740.9 572.78h59.96v59.95H740.9z" fill="#F2A825"></path><path d="M740.9 512.83h59.96v59.96H740.9zM740.9 452.88h59.96v59.95H740.9z" fill="#F2A825"></path><path d="M740.9 392.92h59.96v59.96H740.9zM680.95 752.64h59.95v59.95h-59.95z" fill="#333333"></path><path d="M680.95 692.68h59.95v59.96h-59.95z" fill="#F2A825"></path><path d="M680.95 632.73h59.95v59.96h-59.95z" fill="#F2A825"></path><path d="M680.95 572.78h59.95v59.95h-59.95z" fill="#FFCD50"></path><path d="M680.95 512.83h59.95v59.96h-59.95zM680.95 452.88h59.95v59.95h-59.95z" fill="#F2A825"></path><path d="M680.95 392.92h59.95v59.96h-59.95z" fill="#333333"></path><path d="M680.95 332.98h59.95v59.95h-59.95zM680.95 273.02h59.95v59.96h-59.95z" fill="#333333"></path><path d="M680.95 213.08h59.95v59.95h-59.95zM621 752.64h59.96v59.95H621zM621 692.68h59.96v59.96H621z" fill="#333333"></path><path d="M621 632.73h59.96v59.96H621zM621 572.78h59.96v59.95H621z" fill="#333333"></path><path d="M621 512.83h59.96v59.96H621zM621 452.88h59.96v59.95H621z" fill="#333333"></path><path d="M621 392.92h59.96v59.96H621z" fill="#FFCD50"></path><path d="M621 332.98h59.96v59.95H621z" fill="#333333"></path><path d="M621 273.02h59.96v59.96H621z" fill="#75C7F9"></path><path d="M621 213.08h59.96v59.95H621zM621 153.12h59.96v59.96H621zM561.05 752.64H621v59.95h-59.95z" fill="#333333"></path><path d="M561.05 692.68H621v59.96h-59.95z" fill="#F2A825"></path><path d="M561.05 632.73H621v59.96h-59.95zM561.05 572.78H621v59.95h-59.95z" fill="#F2A825"></path><path d="M561.05 512.83H621v59.96h-59.95zM561.05 452.88H621v59.95h-59.95z" fill="#F2A825"></path><path d="M561.05 392.92H621v59.96h-59.95z" fill="#333333"></path><path d="M561.05 332.98H621v59.95h-59.95zM561.05 273.02H621v59.96h-59.95z" fill="#333333"></path><path d="M561.05 213.08H621v59.95h-59.95zM501.1 752.64h59.96v59.95H501.1z" fill="#333333"></path><path d="M501.1 692.68h59.96v59.96H501.1z" fill="#FFCD50"></path><path d="M501.1 632.73h59.96v59.96H501.1zM501.1 572.78h59.96v59.95H501.1z" fill="#FFCD50"></path><path d="M501.1 512.83h59.96v59.96H501.1zM501.1 452.88h59.96v59.95H501.1zM501.1 392.92h59.96v59.96H501.1z" fill="#FFCD50"></path><path d="M501.1 332.98h59.96v59.95H501.1z" fill="#333333"></path><path d="M501.1 273.02h59.96v59.96H501.1z" fill="#75C7F9"></path><path d="M501.1 213.08h59.96v59.95H501.1z" fill="#BBE7FF"></path><path d="M501.1 153.12h59.96v59.96H501.1zM441.15 752.64h59.95v59.95h-59.95zM441.15 692.68h59.95v59.96h-59.95z" fill="#333333"></path><path d="M441.15 632.73h59.95v59.96h-59.95zM441.15 572.78h59.95v59.95h-59.95z" fill="#333333"></path><path d="M441.15 512.83h59.95v59.96h-59.95zM441.15 452.88h59.95v59.95h-59.95z" fill="#333333"></path><path d="M441.15 392.92h59.95v59.96h-59.95z" fill="#FFD578"></path><path d="M441.15 332.98h59.95v59.95h-59.95z" fill="#333333"></path><path d="M441.15 273.02h59.95v59.96h-59.95z" fill="#BBE7FF"></path><path d="M441.15 213.08h59.95v59.95h-59.95zM441.15 153.12h59.95v59.96h-59.95zM381.2 752.64h59.96v59.95H381.2z" fill="#333333"></path><path d="M381.2 692.68h59.96v59.96H381.2z" fill="#FFCD50"></path><path d="M381.2 632.73h59.96v59.96H381.2z" fill="#FFD7D7"></path><path d="M381.2 572.78h59.96v59.95H381.2z" fill="#FF8D8D"></path><path d="M381.2 512.83h59.96v59.96H381.2zM381.2 452.88h59.96v59.95H381.2z" fill="#FFCD50"></path><path d="M381.2 392.92h59.96v59.96H381.2z" fill="#333333"></path><path d="M381.2 332.98h59.96v59.95H381.2zM381.2 273.02h59.96v59.96H381.2z" fill="#333333"></path><path d="M381.2 213.08h59.96v59.95H381.2zM321.25 752.64h59.95v59.95h-59.95z" fill="#333333"></path><path d="M321.25 692.68h59.95v59.96h-59.95z" fill="#FFCD50"></path><path d="M321.25 632.73h59.95v59.96h-59.95zM321.25 572.78h59.95v59.95h-59.95z" fill="#FFAEAE"></path><path d="M321.25 512.83h59.95v59.96h-59.95zM321.25 452.88h59.95v59.95h-59.95zM321.25 392.92h59.95v59.96h-59.95z" fill="#FFCD50"></path><path d="M321.25 332.98h59.95v59.95h-59.95zM261.29 752.64h59.96v59.95h-59.96z" fill="#333333"></path><path d="M261.29 692.68h59.96v59.96h-59.96z" fill="#FFCD50"></path><path d="M261.29 632.73h59.96v59.96h-59.96zM261.29 572.78h59.96v59.95h-59.96z" fill="#FFCD50"></path><path d="M261.29 512.83h59.96v59.96h-59.96zM261.29 452.88h59.96v59.95h-59.96z" fill="#333333"></path><path d="M261.29 392.92h59.96v59.96h-59.96z" fill="#FFD578"></path><path d="M261.29 332.98h59.96v59.95h-59.96zM201.34 692.68h59.96v59.96h-59.96z" fill="#333333"></path><path d="M201.34 632.73h59.96v59.96h-59.96zM201.34 572.78h59.96v59.95h-59.96z" fill="#FFCD50"></path><path d="M201.34 512.83h59.96v59.96h-59.96zM201.34 452.88h59.96v59.95h-59.96z" fill="#FFD578"></path><path d="M201.34 392.92h59.96v59.96h-59.96z" fill="#333333"></path><path d="M201.34 332.98h59.96v59.95h-59.96zM201.34 273.02h59.96v59.96h-59.96zM141.39 632.73h59.95v59.96h-59.95zM141.39 572.78h59.95v59.95h-59.95z" fill="#333333"></path><path d="M141.39 512.83h59.95v59.96h-59.95zM141.39 452.88h59.95v59.95h-59.95zM141.39 213.08h59.95v59.95h-59.95z" fill="#333333"></path></svg>`;

interface SearchDoc {
  title: string;
  category: string;
  href: string;
}

export default function HomePage() {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [allDocs, setAllDocs] = useState<SearchDoc[]>([]);

  useEffect(() => {
    if (show) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setVisible(false);
    }
  }, [show]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Load all tutorials from API
  useEffect(() => {
    Promise.all([
      fetch('/api/tutorials?category=OpenClaw').then(r => r.json()),
      fetch('/api/tutorials?category=Hermes').then(r => r.json()),
    ]).then(([openclaw, hermes]) => {
      const docs: SearchDoc[] = [];

      (openclaw.list || []).forEach((t: any) => {
        docs.push({
          title: t.title,
          category: 'OpenClaw',
          href: `/openclaw/tutorial/${t.id}`,
        });
      });

      (hermes.list || []).forEach((t: any) => {
        docs.push({
          title: t.title,
          category: 'Hermes',
          href: `/hermes/tutorial/${t.id}`,
        });
      });

      setAllDocs(docs);
    }).catch(console.error);
  }, []);

  const filtered = query.trim()
    ? allDocs.filter(d =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="overflow-x-hidden">
      <style>{`
        @keyframes bee-float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-24px) rotate(3deg); }
        }
      `}</style>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#1a1a1a', minHeight: 'calc(100vh - 44px)' }}
      >
        <div className="relative z-10 text-center text-white max-w-[1200px] mx-auto px-6 py-8">
          {/* Logo - pixel bee */}
          <div className="mb-8 flex justify-center" style={{ width: 96, height: 96, margin: '0 auto 2rem' }}>
            <div
              dangerouslySetInnerHTML={{ __html: PIXEL_BEE_SVG }}
              style={{ width: 96, height: 96, animation: 'bee-float 4s ease-in-out infinite' }}
            />
          </div>

          {/* Eyebrow */}
          <p className="text-[15px] text-[#86868b] mb-3 font-light tracking-[0.25em] uppercase">
            蜂厂长的开源库
          </p>

          {/* Title */}
          <h1 className="text-[40px] md:text-[60px] font-semibold tracking-tight leading-[1.1]" style={{ color: '#f5f5f7' }}>
            探索 Agent 的{' '}
            <button
              onClick={() => setShow(true)}
              className="bg-gradient-to-r from-[#0071e3] to-[#00d4ff] bg-clip-text hover:opacity-80 transition-opacity cursor-pointer"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline' }}
            >
              无限进步
            </button>
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] text-[#86868b] mt-5">
            专注 AI Agent 与大模型应用的开源项目库
          </p>
        </div>
      </section>

      {/* Footer */}
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
          <p className="text-[11px] text-white/20">
            © 2026 蜂厂长的开源库
          </p>
        </div>
      </footer>

      {/* Search Modal */}
      {show && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ paddingTop: '15vh' }}
          onClick={() => setShow(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              opacity: visible ? 1 : 0,
            }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-[580px] mx-4 overflow-hidden transition-all duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(-12px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Apple Spotlight style search bar */}
            <div
              className="flex items-center gap-3 px-4 rounded-2xl"
              style={{
                backgroundColor: 'rgba(40,40,42,0.72)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Search icon */}
              <svg className="w-5 h-5 flex-shrink-0 opacity-50" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索文档、工具、模型..."
                className="flex-1 py-4 bg-transparent text-[17px] text-white placeholder-[#86868b] outline-none"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif', letterSpacing: '-0.01em' }}
              />
              <button
                onClick={() => setShow(false)}
                className="text-[12px] text-[#86868b] px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 hover:text-white/70"
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                Esc
              </button>
            </div>

            {/* Results */}
            {filtered.length > 0 && (
              <div
                className="mt-2 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(36,36,38,0.72)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                }}
              >
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {filtered.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      onClick={() => { setShow(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 text-[15px] text-[#e5e5e7] hover:bg-white/[0.06] transition-colors"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                    >
                      <svg className="w-4 h-4 flex-shrink-0 opacity-40" fill="none" stroke="#fff" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[11px] px-2 py-0.5 rounded flex-shrink-0 font-medium" style={{ backgroundColor: 'rgba(0,113,227,0.85)', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                        {doc.category}
                      </span>
                      <span>{doc.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && filtered.length === 0 && (
              <div
                className="mt-2 rounded-2xl px-4 py-10 text-center"
                style={{
                  backgroundColor: 'rgba(36,36,38,0.72)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                }}
              >
                <p className="text-[15px] text-[#86868b]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                  未找到 "{query}" 相关结果
                </p>
              </div>
            )}

            {!query.trim() && (
              <div className="mt-3 flex items-center justify-center gap-6 text-[12px] text-[#6e6e73]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                <span>↑↓ 导航</span>
                <span>↵ 打开</span>
                <span>Esc 关闭</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
