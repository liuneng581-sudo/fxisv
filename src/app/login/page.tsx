'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      setToken(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/user');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <img src="/icons/bee.svg" className="w-12 h-12 mb-4 mx-auto" alt="" />
          <h1 className="text-[32px] font-semibold text-white mb-2">登录</h1>
          <p className="text-[15px] text-[#86868b]">欢迎回到蜂厂长的开源库</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="input-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-[14px] text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0071e3] text-white text-[15px] font-medium rounded-full hover:bg-[#0077ed] transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-[#86868b]">
            还没有账号？<Link href="/register" className="text-[#0071e3] hover:underline">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
