"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MarkdownContent from '@/components/MarkdownContent';
import { useTheme } from '@/components/ThemeProvider';
interface Tutorial { id: number; title: string; content: string; }
export default function HermesDocPage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const [doc, setDoc] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/tutorials?category=Hermes').then(r => r.json()).then(data => {
      const found = (data.list || []).find((t: Tutorial) => t.id === Number(id));
      setDoc(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);
  const bg = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  const textColor = theme === 'dark' ? '#86868b' : '#6e6e73';
  const headingColor = theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
  const linkColor = theme === 'dark' ? '#af52de' : '#8b3dbd';
  if (loading) return <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '44px' }}><div className="max-w-[1024px] mx-auto px-6 py-20 text-center" style={{ color: textColor }}>加载中...</div></div>;
  if (!doc) return <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '44px' }}><div className="max-w-[1024px] mx-auto px-6 py-20 text-center" style={{ color: textColor }}><p>文档不存在</p><Link href="/hermes" style={{ color: linkColor }}>← 返回 Hermes</Link></div></div>;
  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '44px' }}>
      <div className="max-w-[1024px] mx-auto px-6 py-10">
        <Link href="/hermes" className="inline-flex items-center gap-1 text-[13px] mb-8 block" style={{ color: textColor }}>← 返回 Hermes 文档</Link>
        <h1 className="text-[36px] font-semibold mb-8" style={{ color: headingColor }}>{doc.title}</h1>
        <MarkdownContent content={doc.content} theme={theme} />
      </div>
    </div>
  );
}
