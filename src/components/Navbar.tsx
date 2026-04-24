"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
const FEISHU_GROUP_URL = 'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=d69tb5ef-822e-4f2d-a844-4f5c4835e8e2';
const NAV_ITEMS = [
  { href: '/openclaw', label: 'OpenClaw' },
  { href: '/hermes', label: 'Hermes' },
  { href: '/skills', label: 'Skills' },
  { href: '/tools', label: '工具' },
  { href: '/models', label: '模型' },
  { href: '/help', label: '求助' },
];
export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
    setMenuOpen(false);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); window.location.href = '/'; };
  const navBg = 'rgba(29,29,31,0.88)';
  const textWhite = theme === 'dark' ? '#ffffff' : '#1d1d1f';
  const textMuted = theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-11 transition-all duration-300`} style={{ backgroundColor: navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${borderColor}` }}>
      <div className="max-w-[1024px] mx-auto h-full flex items-center justify-between px-5">
        <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity flex-shrink-0">
          <img src="/icons/bee.svg" className="w-6 h-6 mr-2" alt="bee" />
          <span className="text-[13px] font-semibold tracking-wider" style={{ color: textWhite }}>蜂厂长的开源库</span>
        </Link>
        <div className="hidden md:flex items-center">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-[7px] text-[13px] font-normal tracking-wide transition-colors" style={{ color: pathname === item.href || pathname.startsWith(item.href + '/') ? textWhite : textMuted }}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: textMuted, background: 'transparent' }} title="切换主题">
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            )}
          </button>
          <a href={FEISHU_GROUP_URL} target="_blank" rel="noopener noreferrer" className="px-3 py-[7px] text-[13px] transition-colors flex items-center gap-1" style={{ color: textMuted }}>
            <img src="/icons/feishu.svg" className="w-4 h-4" alt="feishu" /> 加入群聊
          </a>
          {user ? (
            <div className="flex items-center gap-1">
              <Link href="/user" className="px-3 py-[7px] text-[13px] transition-colors" style={{ color: textMuted }}>
                {user.nickname || user.email?.split('@')[0] || '用户'}<span style={{ color: '#0071e3', marginLeft: '4px' }}>{user.points ?? 0}积分</span>
              </Link>
              <button onClick={handleLogout} className="px-3 py-[7px] text-[13px] transition-colors" style={{ color: textMuted, opacity: 0.6 }}>退出</button>
            </div>
          ) : (
            <>
              <Link href="/login" className="px-3 py-[7px] text-[13px] transition-colors" style={{ color: textMuted }}>登录</Link>
              <Link href="/register" className="px-3 py-[7px] text-[13px] rounded-lg transition-colors" style={{ color: textWhite, background: 'rgba(255,255,255,0.1)' }}>注册</Link>
            </>
          )}
        </div>
        <button className="md:hidden p-1" style={{ color: textMuted }} onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: navBg, backdropFilter: 'blur(20px)', borderColor }}>
          <div className="max-w-[1024px] mx-auto px-5 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="block px-4 py-2 text-[14px] rounded-lg transition-colors" style={{ color: pathname === item.href ? textWhite : textMuted, background: pathname === item.href ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                {item.label}
              </Link>
            ))}
            <button onClick={toggleTheme} className="w-full text-left flex items-center gap-2 px-4 py-2 text-[14px] rounded-lg" style={{ color: textMuted }}>
              {theme === 'dark' ? '切换亮色模式' : '切换深色模式'}
            </button>
            <a href={FEISHU_GROUP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-[14px] rounded-lg" style={{ color: textMuted }}>
              <img src="/icons/feishu.svg" className="w-4 h-4" alt="feishu" /> 加入群聊
            </a>
            {user ? (
              <>
                <Link href="/user" className="block px-4 py-2 text-[14px]" style={{ color: textMuted }}>个人中心 <span style={{ color: '#0071e3' }}>{user.points}积分</span></Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[14px] rounded-lg" style={{ color: textMuted, opacity: 0.6 }}>退出登录</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-2 text-[14px]" style={{ color: textMuted }}>登录</Link>
                <Link href="/register" className="block px-4 py-2 text-[14px]" style={{ color: textMuted }}>注册</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
