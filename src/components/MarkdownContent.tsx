"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useCallback } from 'react';
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [code]);
  return <button onClick={onClick} title="复制代码" style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>{copied ? '已复制' : '复制'}</button>;
}
export default function MarkdownContent({ content, theme = 'dark' }: { content: string; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const codeBg = isDark ? '#1d1d1f' : '#f5f5f7';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const linkColor = isDark ? '#0071e3' : '#0066cc';
  const headingColor = isDark ? '#ffffff' : '#1d1d1f';
  const muted = isDark ? '#86868b' : '#6e6e73';
  const inlineCodeBg = isDark ? '#2d2d2f' : '#eeeeef';
  return (
    <div style={{ color: isDark ? '#f5f5f7' : '#1d1d1f', lineHeight: '1.8', fontSize: '15px' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({ className, children }) {
          const isBlock = !!(className && className.includes('language-'));
          const codeStr = String(children).replace(/\n$/, '');
          if (!isBlock) return <code style={{ background: inlineCodeBg, padding: '2px 6px', borderRadius: '4px', fontSize: '0.875em', fontFamily: 'ui-monospace,monospace' }}>{children}</code>;
          return (<div style={{ position: 'relative', margin: '1.2em 0' }}><CopyButton code={codeStr} /><pre style={{ background: codeBg, border: `1px solid ${borderColor}`, borderRadius: '10px', padding: '16px', overflowX: 'auto', fontSize: '14px' }}><code style={{ fontFamily: 'ui-monospace,SFMono-Regular,monospace' }}>{children}</code></pre></div>);
        },
        h1: ({ children }) => <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '0.75em', color: headingColor }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em', color: headingColor }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: '1.25em', fontWeight: '600', marginTop: '1.2em', marginBottom: '0.4em', color: headingColor }}>{children}</h3>,
        p: ({ children }) => <p style={{ marginBottom: '1em' }}>{children}</p>,
        a: ({ href, children }) => {
  const safeUrl = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')) ? href : '#';
  return <a href={safeUrl} style={{ color: linkColor, textDecoration: 'underline' }}>{children}</a>;
},
        ul: ({ children }) => <ul style={{ paddingLeft: '1.5em', marginBottom: '1em' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: '1.5em', marginBottom: '1em' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.3em' }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: `4px solid ${isDark ? '#0071e3' : '#0066cc'}`, paddingLeft: '1em', marginLeft: 0, color: muted, marginBottom: '1em' }}>{children}</blockquote>,
        table: ({ children }) => <div style={{ overflowX: 'auto', marginBottom: '1em' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table></div>,
        th: ({ children }) => <th style={{ padding: '8px 12px', background: codeBg, border: `1px solid ${borderColor}`, fontWeight: '600' }}>{children}</th>,
        td: ({ children }) => <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}>{children}</td>,
        hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '1.5em 0' }} />,
        img: ({ src, alt }) => <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: '8px', margin: '0.5em 0' }} />,
      }}>{content}</ReactMarkdown>
    </div>
  );
}
