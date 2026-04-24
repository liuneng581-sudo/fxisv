'use client';

import Link from 'next/link';

export default function OpenClawArchPage() {
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
          <h1 className="text-[36px] font-semibold mb-6" style={{ color: '#f5f5f7' }}>核心架构</h1>
          <div className="space-y-3" style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.8' }}>
            <p>OpenClaw 采用模块化架构：</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '24px' }}>
              <li>Agent Engine — 核心推理引擎，支持多模型</li>
              <li>Tool System — 灵活的插件化工具系统</li>
              <li>Memory — 长期记忆与上下文管理</li>
              <li>Chain — 可组合的任务编排链</li>
              <li>Monitor — 完整的可观测性支持</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
