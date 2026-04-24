'use client';
import Link from 'next/link';
export default function HermesInstallPage() {
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
          <h1 className="text-[36px] font-semibold mb-6" style={{ color: '#f5f5f7' }}>快速开始</h1>
          <div className="space-y-4" style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.8' }}>
            <p>安装 Hermes：</p>
            <pre className="p-4 rounded-xl text-[13px] overflow-x-auto" style={{ backgroundColor: '#1d1d1f', color: '#f5f5f7', fontFamily: 'ui-monospace, monospace' }}>
{`npm install hermes-ai`}
            </pre>
            <p>创建多智能体任务：</p>
            <pre className="p-4 rounded-xl text-[13px] overflow-x-auto" style={{ backgroundColor: '#1d1d1f', color: '#f5f5f7', fontFamily: 'ui-monospace, monospace' }}>
{`import { Hermes } from 'hermes-ai';

const hermes = new Hermes({
  agents: [
    { role: 'researcher', model: 'claude' },
    { role: 'writer', model: 'gpt-4' },
    { role: 'reviewer', model: 'claude' },
  ],
});

const result = await hermes.run('写一篇关于 AI 的博客');`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
