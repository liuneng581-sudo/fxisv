"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, signin, points, treasures, auth, posts, userExchanges } from '@/lib/api';
import Link from 'next/link';

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signStatus, setSignStatus] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsTotal, setMyPostsTotal] = useState(0);
  const [treasureList, setTreasureList] = useState<any[]>([]);
  const [exchangeRecords, setExchangeRecords] = useState<any[]>([]);
  const [rulesData, setRulesData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'points' | 'exchange' | 'posts' | 'settings' | 'rules'>('signin');

  // Settings state
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    try {
      const token = getToken();
      const userData = localStorage.getItem('user');
      if (!token || !userData) { router.push('/login'); return; }
      const u = JSON.parse(userData);
      setUser(u);
      setEditNickname(u.nickname || '');
      setEditAvatar(u.avatar || '');
      loadData(token, u.id);
    } catch { return; }
  }, []);

  const loadData = async (token: string, userId: number) => {
    try {
      const [signRes, pointsRes, treasureRes, myPostsRes, exchangeRes, rulesRes] = await Promise.all([
        signin.status(token),
        points.history(token),
        treasures.list(),
        posts.list({ user_id: userId } as any),
        userExchanges.list(token),
        points.rules(),
      ]);
      setSignStatus(signRes);
      setPointsHistory(pointsRes.list || []);
      setTreasureList(treasureRes.list || []);
      setMyPosts(myPostsRes.list || []);
      setMyPostsTotal(myPostsRes.total || 0);
      setExchangeRecords(exchangeRes.list || []);
      setRulesData(rulesRes.rules || null);
    } catch (err) { console.error(err); setError("加载失败"); }
    setLoading(false);
  };

  const handleSignin = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await signin.do(token);
      const updated = { ...user, points: res.balance };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSignStatus({ ...signStatus, signedIn: true, consecutive: res.consecutive || (signStatus?.consecutive || 0) + 1 });
      const ph = await points.history(token);
      setPointsHistory(ph.list || []);
    } catch (err: any) { alert(err.message); }
  };

  const handleExchange = async (treasureId: number) => {
    if (!confirm('确认兑换？')) return;
    const token = getToken();
    if (!token) return;
    try {
      await treasures.exchange(token, treasureId);
      alert('兑换成功！');
      const me = await auth.me(token);
      setUser(me.user);
      localStorage.setItem('user', JSON.stringify(me.user));
      const ph = await points.history(token);
      setPointsHistory(ph.list || []);
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const updated = await auth.updateProfile(token, { nickname: editNickname, avatar: editAvatar });
      const newUser = { ...user, nickname: editNickname, avatar: editAvatar };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      setProfileMsg('保存成功');
      setTimeout(() => setProfileMsg(''), 2000);
    } catch (err: any) { setProfileMsg(err.message); }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!oldPassword || !newPassword) return;
    setChangingPw(true);
    setPwMsg('');
    try {
      await auth.changePassword(token, oldPassword, newPassword);
      setPwMsg('修改成功');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err: any) { setPwMsg(err.message); }
    setChangingPw(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/30 text-[14px]">加载中...</div>
      </div>
    );
  }

  const avatarColor = user?.avatar ? 'transparent' : '#333';
  const initial = user?.nickname?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[720px] mx-auto px-6 py-10">
        {/* User info header */}
        <div className="flex items-center gap-4 mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium text-white overflow-hidden"
            style={{ background: user?.avatar ? `url(${user.avatar}) center/cover` : avatarColor }}
          >
            {!user?.avatar && initial}
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-white">{user?.nickname || user?.email?.split('@')[0]}</h1>
            <p className="text-[13px] text-white/30 mt-0.5">{user?.email}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[18px] font-semibold text-white">{user?.points ?? 0}</div>
            <div className="text-[11px] text-white/30">可用积分</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[rgba(255,255,255,0.06)] mb-8">
          <div className="flex gap-6">
            {(['signin', 'points', 'exchange', 'posts', 'rules', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[14px] font-medium transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {tab === 'signin' ? '每日签到' : tab === 'points' ? '积分记录' : tab === 'exchange' ? '积分兑换' : tab === 'posts' ? '我的提问' : tab === 'rules' ? '积分规则' : '账户设置'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 签到 */}
        {activeTab === 'signin' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">{signStatus?.signedIn ? '✓' : '✗'}</div>
            {signStatus?.signedIn ? (
              <div>
                <h2 className="text-[22px] font-semibold text-white mb-2">今日已签到</h2>
                <p className="text-[14px] text-white/35 mb-1">连续签到 <span className="text-white/60 font-medium">{signStatus?.consecutive || 0}</span> 天</p>
                <p className="text-[13px] text-white/20">明天再来吧</p>
              </div>
            ) : (
              <div>
                <h2 className="text-[22px] font-semibold text-white mb-2">每日签到</h2>
                <p className="text-[14px] text-white/35 mb-6">
                  签到 +1 积分 · 连续签到 +2 积分
                </p>
                {signStatus?.consecutive > 0 && (
                  <p className="text-[13px] text-white/20 mb-6">已连续签到 {signStatus.consecutive} 天</p>
                )}
                <button
                  onClick={handleSignin}
                  className="px-10 py-3 bg-white/10 hover:bg-white/15 text-white text-[14px] font-medium rounded-full border border-white/10 transition-colors"
                >
                  立即签到
                </button>
              </div>
            )}

            {/* 我的兑换记录 */}
            {exchangeRecords.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-medium text-white/50 mb-4">我的兑换记录</h3>
                <div className="space-y-2">
                  {exchangeRecords.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                      <div>
                        <p className="text-[13px] text-white/60">{r.treasure_name || '商品 #' + r.treasure_id}</p>
                        <p className="text-[11px] text-white/25">{new Date(r.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-white/40">-{r.points_spent}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          r.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {r.status === 'completed' ? '已完成' : r.status === 'pending' ? '处理中' : '已拒绝'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 积分记录 */}
        {activeTab === 'points' && (
          <div>
            <h2 className="text-[18px] font-semibold text-white/80 mb-6">积分记录</h2>
            {pointsHistory.length === 0 ? (
              <div className="text-center py-10 text-white/25 text-[14px]">暂无记录</div>
            ) : (
              <div className="space-y-2">
                {pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center px-4 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                    <div>
                      <p className="text-[14px] text-white/70">{item.description || item.type}</p>
                      <p className="text-[12px] text-white/25">{new Date(item.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                    <div className={`text-[15px] font-medium ${item.amount > 0 ? 'text-white/60' : 'text-white/30'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 我的兑换记录 */}
            {exchangeRecords.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-medium text-white/50 mb-4">我的兑换记录</h3>
                <div className="space-y-2">
                  {exchangeRecords.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                      <div>
                        <p className="text-[13px] text-white/60">{r.treasure_name || '商品 #' + r.treasure_id}</p>
                        <p className="text-[11px] text-white/25">{new Date(r.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-white/40">-{r.points_spent}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          r.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {r.status === 'completed' ? '已完成' : r.status === 'pending' ? '处理中' : '已拒绝'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 积分兑换 */}
        {activeTab === 'exchange' && (
          <div>
            <h2 className="text-[18px] font-semibold text-white/80 mb-6">积分兑换</h2>
            {treasureList.length === 0 ? (
              <div className="text-center py-10 text-white/25 text-[14px]">暂无可兑换商品</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {treasureList.map((t) => (
                  <div key={t.id} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="w-full aspect-video bg-[rgba(255,255,255,0.04)] rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                      {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{t.type === 'token' ? '⏣' : t.type === 'accelerate' ? '⚡' : '◆'}</span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-medium text-white/80 mb-1">{t.name}</h3>
                    <p className="text-[12px] text-white/30 mb-3 leading-relaxed">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-white/50">{t.points_price} 积分</span>
                      <button
                        onClick={() => handleExchange(t.id)}
                        disabled={user?.points < t.points_price}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 text-[13px] text-white/70 rounded-full border border-white/10 transition-colors disabled:cursor-not-allowed"
                      >
                        兑换
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 我的兑换记录 */}
            {exchangeRecords.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-medium text-white/50 mb-4">我的兑换记录</h3>
                <div className="space-y-2">
                  {exchangeRecords.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                      <div>
                        <p className="text-[13px] text-white/60">{r.treasure_name || '商品 #' + r.treasure_id}</p>
                        <p className="text-[11px] text-white/25">{new Date(r.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-white/40">-{r.points_spent}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          r.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {r.status === 'completed' ? '已完成' : r.status === 'pending' ? '处理中' : '已拒绝'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 我的提问 */}
        {activeTab === 'posts' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[18px] font-semibold text-white/80">我的提问</h2>
              <button
                onClick={() => router.push('/help')}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-[12px] font-medium rounded-full border border-white/10 transition-colors"
              >
                去提问
              </button>
            </div>
            {myPosts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[14px] text-white/30 mb-3">还没有提问</p>
                <button
                  onClick={() => router.push('/help')}
                  className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white/70 text-[13px] rounded-full border border-white/10 transition-colors"
                >
                  发起第一个提问
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map((p: any) => (
                  <Link key={p.id} href={`/help/${p.id}`} className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl px-5 py-4 hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[15px] font-medium text-white/80 flex-1 truncate">{p.title}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${p.status === 'solved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {p.status === 'solved' ? '已解决' : '待采纳'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-white/30">
                      <span>{p.comment_count || 0} 条回复</span>
                      {p.points_reward > 0 && <span className="text-blue-400/50">{p.points_reward} 积分</span>}
                      <span>{new Date(p.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 我的兑换记录 */}
            {exchangeRecords.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-medium text-white/50 mb-4">我的兑换记录</h3>
                <div className="space-y-2">
                  {exchangeRecords.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                      <div>
                        <p className="text-[13px] text-white/60">{r.treasure_name || '商品 #' + r.treasure_id}</p>
                        <p className="text-[11px] text-white/25">{new Date(r.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-white/40">-{r.points_spent}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          r.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {r.status === 'completed' ? '已完成' : r.status === 'pending' ? '处理中' : '已拒绝'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <h2 className="text-[18px] font-semibold text-white/80 mb-6">积分规则</h2>
            {rulesData ? (
              <div className="space-y-6">
                {rulesData.earn && rulesData.earn.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-medium text-green-400/70 mb-3 flex items-center gap-2">
                      <span>⬆</span> 获得积分
                    </h3>
                    <div className="space-y-2">
                      {rulesData.earn.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                          <span className="text-[13px] text-white/60">{r.action}</span>
                          <span className="text-[13px] text-green-400 font-medium">+{r.points} {r.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rulesData.spend && rulesData.spend.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-medium text-red-400/70 mb-3 flex items-center gap-2">
                      <span>⬇</span> 消耗积分
                    </h3>
                    <div className="space-y-2">
                      {rulesData.spend.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                          <span className="text-[13px] text-white/60">{r.action}</span>
                          <span className="text-[13px] text-white/40">{r.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rulesData.other && rulesData.other.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-medium text-blue-400/70 mb-3 flex items-center gap-2">
                      <span>🔄</span> 其他规则
                    </h3>
                    <div className="space-y-2">
                      {rulesData.other.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                          <span className="text-[13px] text-white/60">{r.action}</span>
                          <span className="text-[13px] text-white/40">{r.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-white/25 text-[14px]">加载中...</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* 基本信息 */}
            <div>
              <h2 className="text-[18px] font-semibold text-white/80 mb-5">基本信息</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-[480px]">
                {/* 头像上传 */}
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium text-white overflow-hidden"
                      style={{ background: editAvatar ? `url(${editAvatar}) center/cover` : avatarColor }}
                    >
                      {!editAvatar && initial}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1024 * 1024) { setAvatarError('图片大小不能超过 1MB'); return; }
                      setAvatarError('');
                      const reader = new FileReader();
                      reader.onload = (ev) => setEditAvatar(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </div>
                  <div>
                    <p className="text-[14px] text-white/60">点击头像更换图片</p>
                    <p className="text-[12px] text-white/30 mt-0.5">支持 JPG、PNG、GIF，建议正方形，不超过 1MB</p>
                  </div>
                </div>
                {avatarError && (
                  <p className="text-[13px] text-red-400">{avatarError}</p>
                )}
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">昵称</label>
                  <input
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="设置你的昵称"
                    className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15"
                  />
                </div>
                {profileMsg && (
                  <p className="text-[13px] text-white/50">{profileMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white text-[14px] font-medium rounded-full border border-white/10 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? '保存中...' : '保存修改'}
                </button>
              </form>
            </div>

            {/* 修改密码 */}
            <div>
              <h2 className="text-[18px] font-semibold text-white/80 mb-5">修改密码</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-[400px]">
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">当前密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/40 mb-1.5">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="设置新密码"
                    className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/15"
                  />
                </div>
                {pwMsg && (
                  <p className={`text-[13px] ${pwMsg === '修改成功' ? 'text-green-400/80' : 'text-red-400/80'}`}>{pwMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={changingPw}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white text-[14px] font-medium rounded-full border border-white/10 transition-colors disabled:opacity-50"
                >
                  {changingPw ? '修改中...' : '修改密码'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
