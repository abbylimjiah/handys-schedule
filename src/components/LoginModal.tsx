'use client';

import React, { useState } from 'react';
import { CurrentUser, loginMaster, loginByEmail, isValidCompanyEmail } from '@/data/auth';

interface LoginModalProps {
  mode: 'name' | 'master';
  onLogin: (user: CurrentUser) => void;
  onClose?: () => void;
}

export default function LoginModal({ mode, onLogin, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = () => {
    const trimEmail = email.trim();
    const trimName = name.trim();
    if (!trimEmail) { setError('이메일을 입력해주세요'); return; }
    if (!isValidCompanyEmail(trimEmail)) { setError('핸디즈 이메일(@handys.co.kr)만 사용 가능합니다'); return; }
    if (!trimName) { setError('닉네임을 입력해주세요'); return; }
    const result = loginByEmail(trimEmail, trimName);
    if (result === 'blocked') { setError('차단된 계정입니다. 관리자에게 문의하세요.'); return; }
    if (result) onLogin(result);
    else setError('로그인에 실패했습니다');
  };

  if (mode === 'name') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">핸디즈 BQ</h1>
            <p className="text-sm text-gray-500 mt-1">스케줄 관리 시스템</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회사 이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && email && name) handleEmailLogin(); }}
                placeholder="example@handys.co.kr"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && email && name) handleEmailLogin(); }}
                placeholder="예: Abby"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleEmailLogin}
              disabled={!email.trim() || !name.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
            >
              입장하기
            </button>
            <p className="text-[11px] text-gray-400 text-center">@handys.co.kr 이메일을 가진 직원만 접속할 수 있습니다</p>
            <p className="text-[10px] text-blue-400 text-center">마스터 권한 사용자는 이메일 로그인 시 자동 인증됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  // Master login modal
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-center mb-4">마스터 로그인</h2>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const user = loginMaster(password);
              if (user) onLogin(user);
              else setError('비밀번호가 틀렸습니다');
            }
          }}
          placeholder="비밀번호"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">취소</button>
          <button
            onClick={() => {
              const user = loginMaster(password);
              if (user) onLogin(user);
              else setError('비밀번호가 틀렸습니다');
            }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
