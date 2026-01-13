import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">会議議事録管理システム</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user.department?.name} - {user.team?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 統計カード */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">組織階層</h3>
            <p className="text-3xl font-bold text-primary-600">3階層</p>
            <p className="text-sm text-gray-500 mt-1">ボード・部門・チーム</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">会議</h3>
            <p className="text-3xl font-bold text-primary-600">-</p>
            <p className="text-sm text-gray-500 mt-1">チームの会議</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">議事録</h3>
            <p className="text-3xl font-bold text-primary-600">-</p>
            <p className="text-sm text-gray-500 mt-1">保存された議事録</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ようこそ、会議議事録管理システムへ
          </h2>
          <p className="text-gray-600 mb-6">
            このシステムは企業内の会議議事録を一元管理し、AI自動フォーマット機能により
            効率的な議事録作成をサポートします。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">📋 組織階層管理</h3>
              <p className="text-sm text-gray-600">
                ボード・部門・チームの3階層で組織を管理
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">🤖 AI自動フォーマット</h3>
              <p className="text-sm text-gray-600">
                GPT-4が議事録を自動で構造化
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">📊 スプレッドシート表示</h3>
              <p className="text-sm text-gray-600">
                議事録を表形式で管理・編集
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">🔍 高度な検索</h3>
              <p className="text-sm text-gray-600">
                キーワード、日付、担当者で検索
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500">
              ※ 各機能は順次実装予定です
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
