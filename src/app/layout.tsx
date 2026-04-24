import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: '蜂厂长的开源库',
  description: '蜂厂长的开源库 - 分享 AI Agent、OpenClaw、Hermes、Skills 等开源项目的使用教程和技巧。加入社区，一起探索 AI 的无限可能。',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="pt-11">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
