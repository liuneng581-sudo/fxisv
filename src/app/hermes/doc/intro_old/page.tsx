'use client';
import Link from 'next/link';
export default function HermesIntroPage() {
  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', paddingTop: '44px' }}>
      <div className="max-w-[1024px] mx-auto">
        <div className="px-6 py-4">
          <Link href="/hermes" className="inline-flex items-center gap-1 text-[13px] transition-colors" style={{ color: '#86868b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#86868b')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
            </svg>
            返回 Hermes 文档
          </Link>
        </div>
        <div className="px-6 py-10">
          <h1 className="text-[36px] font-semibold mb-6" style={{ color: '#f5f5f7' }}>简介</h1>
          <div className="space-y-4" style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.8' }}>
            <p>Hermes 是下一代多智能体协作框架，能够将复杂任务自动分解为多个子任务，由不同的 Agent 并行或顺序执行。它特别适合需要多种能力协作的复杂工作流。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
