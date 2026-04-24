'use client';

import Link from 'next/link';

export default function OpenClawIntroPage() {
  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', paddingTop: '44px' }}>
      <div className="max-w-[1024px] mx-auto">
        <div className="px-6 py-4">
          <Link href="/openclaw" className="inline-flex items-center gap-1 text-[13px] transition-colors" style={{ color: '#86868b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#86868b')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
            </svg>
            返回 OpenClaw 文档
          </Link>
        </div>

        <div className="px-6 py-10">
          <h1 className="text-[36px] font-semibold mb-6" style={{ color: '#f5f5f7' }}>简介</h1>
          <div className="space-y-4" style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.8' }}>
            <p>OpenClaw 是一个企业级 AI Agent 开发框架，专为构建、部署和管理生产级别的 AI Agent 应用而设计。它提供了完整的工具链，包括 Agent 编排、多模型接入、长期记忆、工具调用等核心能力。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
