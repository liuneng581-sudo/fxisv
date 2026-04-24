'use client';
import Link from 'next/link';
export default function HermesMultiagentPage() {
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
          <h1 className="text-[36px] font-semibold mb-6" style={{ color: '#f5f5f7' }}>多智能体协作</h1>
          <div className="space-y-3" style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.8' }}>
            <p>Hermes 的核心是多智能体编排：</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '24px' }}>
              <li>Task Decomposition — 自动拆分复杂任务</li>
              <li>Role Assignment — 为不同 Agent 分配合适的角色</li>
              <li>Result Aggregation — 汇总各 Agent 的执行结果</li>
              <li>Iterative Refinement — 迭代优化直到满足要求</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
