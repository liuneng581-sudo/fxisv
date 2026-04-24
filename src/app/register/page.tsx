'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (countdown > 0) return;
    setError('');
    try {
      await auth.sendCode(email);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (!codeSent || !code) {
      setError('请先获取验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await auth.register({ email, phone, password, nickname, code });
      setToken(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/user');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center bg-black px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <img src="/icons/bee.svg" className="w-12 h-12 mb-4 mx-auto" alt="" />
          <h1 className="text-[32px] font-semibold text-white mb-2">注册</h1>
          <p className="text-[15px] text-[#86868b]">加入蜂厂长的开源社区</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="input-label">邮箱</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input flex-1"
                placeholder="your@email.com"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="px-4 py-2.5 bg-[#1d1d1f] text-[#0071e3] text-[13px] font-medium rounded-full border border-[#424245] hover:border-[#0071e3] transition-colors whitespace-nowrap disabled:opacity-40"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          {/* Verification Code */}
          {codeSent && (
            <div>
              <label className="input-label">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input"
                placeholder="请输入6位验证码"
                maxLength={6}
                required
              />
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="input-label">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="1xx xxxx xxxx"
              pattern="^1[3-9]\d{9}$"
              required
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="input-label">昵称（选填）</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input"
              placeholder="你的昵称"
            />
          </div>

          {/* Password */}
          <div>
            <label className="input-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="至少6位"
              minLength={6}
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        {/* Login link */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-[#86868b]">
            已有账号？<Link href="/login" className="text-[#0071e3] hover:underline">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
