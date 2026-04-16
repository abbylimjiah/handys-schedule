'use client';

import React, { useState } from 'react';
import { CurrentUser, loginMaster, loginByName } from '@/data/auth';

interface LoginModalProps {
  mode: 'name' | 'master';
  onLogin: (user: CurrentUser) => void;
  onClose?: () => void;
}

export default function LoginModal({ mode, onLogin, onClose }: LoginModalProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
              <label className="block text-sm font-medium text-gray-700 mb-1">이름을 입력해주세요</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && name.trim()) {
                    onLogin(loginByName(name.trim()));
                  }
                }}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                if (name.trim()) onLogin(loginByName(name.trim()));
              }}
              disabled={!name.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
            >
              입장하기
            </button>
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
