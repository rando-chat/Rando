import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Report, User } from '@/types';

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const { data } = await supabase
          .from('reports')
          .select('*, reporter:users!reports_reporter_id_fkey(*), reported_user:users!reports_reported_user_id_fkey(*)')
          .order('created_at', { ascending: false });
        setReports(data || []);
      } else {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss', banUser = false) => {
    try {
      if (action === 'resolve') {
        await supabase
          .from('reports')
          .update({ status: 'resolved' })
          .eq('id', reportId);
      } else {
        await supabase
          .from('reports')
          .update({ status: 'dismissed' })
          .eq('id', reportId);
      }

      if (banUser) {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          await supabase
            .from('users')
            .update({
              banned: true,
              ban_reason: 'Multiple reports',
              banned_at: new Date().toISOString(),
            })
            .eq('id', report.reported_user_id);
        }
      }

      fetchData();
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban') => {
    try {
      if (action === 'ban') {
        await supabase
          .from('users')
          .update({
            banned: true,
            ban_reason: 'Manual ban by admin',
            banned_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } else {
        await supabase
          .from('users')
          .update({
            banned: false,
            ban_reason: null,
            banned_at: null,
          })
          .eq('id', userId);
      }
      fetchData();
    } catch (error) {
      console.error('Error handling user action:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'reports'
                  ? 'bg-gold text-dark font-bold'
                  : 'bg-card text-gray-400'
              }`}
            >
              Reports ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'users'
                  ? 'bg-gold text-dark font-bold'
                  : 'bg-card text-gray-400'
              }`}
            >
              Users ({users.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gold text-xl">Loading...</div>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Reporter</th>
                    <th className="p-4 text-left">Reported User</th>
                    <th className="p-4 text-left">Reason</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-t border-gray-800 hover:bg-gray-900">
                      <td className="p-4 text-sm">{report.id.slice(0, 8)}...</td>
                      <td className="p-4">
                        <div className="font-bold">
                          {(report as any).reporter?.username || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(report as any).reporter?.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold">
                          {(report as any).reported_user?.username || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(report as any).reported_user?.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs bg-card">
                          {report.reason}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.status === 'pending'
                            ? 'bg-warning/20 text-warning'
                            : report.status === 'resolved'
                            ? 'bg-success/20 text-success'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReportAction(report.id, 'resolve', true)}
                                className="px-3 py-1 bg-success text-white rounded text-sm hover:bg-success/80"
                              >
                                Ban User
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'resolve')}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'dismiss')}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card">
                  <tr>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Tier</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Joined</th>
                    <th className="p-4 text-left">Last Seen</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-800 hover:bg-gray-900">
                      <td className="p-4">
                        <div className="font-bold">{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.tier === 'premium'
                            ? 'bg-gold text-dark'
                            : user.tier === 'student'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {user.tier}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.banned ? (
                          <span className="px-2 py-1 rounded text-xs bg-danger/20 text-danger">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-success/20 text-success">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">
                        {user.last_seen ? new Date(user.last_seen).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4">
                        {user.banned ? (
                          <button
                            onClick={() => handleUserAction(user.id, 'unban')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.id, 'ban')}
                            className="px-3 py-1 bg-danger text-white rounded text-sm hover:bg-danger/80"
                          >
                            Ban User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}