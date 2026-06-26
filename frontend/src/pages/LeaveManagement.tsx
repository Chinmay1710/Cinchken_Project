import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface LeaveRequest {
  id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

const LeaveManagement: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/hr/leaves/');
      const data = res.data.results || res.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await api.post(`/hr/leaves/${id}/${action}/`);
      fetchRequests();
    } catch (err) {
      console.error(`Failed to ${action} leave`, err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex-1 p-8 text-center text-text-muted">Loading requests...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const pastRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto p-container-padding">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-display-sm font-bold text-primary mb-2">Leave Management</h1>
          <p className="text-body-lg text-on-surface-variant">Review and manage employee leave requests.</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-title-lg font-bold text-text-main border-b border-border-subtle pb-2">Pending Approvals ({pendingRequests.length})</h2>
          
          {pendingRequests.length === 0 ? (
            <p className="text-body-md text-text-muted bg-surface-container-low p-6 rounded-xl text-center">No pending leave requests at the moment.</p>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-title-md font-bold text-primary">{req.employee_name}</h3>
                      <span className="px-2 py-1 bg-surface-container-high text-xs font-bold rounded text-on-surface-variant uppercase">{req.leave_type} Leave</span>
                    </div>
                    <p className="text-body-md text-text-main mb-1"><strong>Dates:</strong> {req.start_date} to {req.end_date}</p>
                    <p className="text-body-md text-text-muted line-clamp-2"><strong>Reason:</strong> {req.reason}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button 
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 border border-error text-error font-bold rounded-lg hover:bg-error-container transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
                    >
                      {actionLoading === req.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 mt-12">
          <h2 className="text-title-lg font-bold text-text-main border-b border-border-subtle pb-2">Past Requests</h2>
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant uppercase">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pastRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text-muted">No past requests.</td>
                  </tr>
                ) : (
                  pastRequests.map(req => (
                    <tr key={req.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{req.employee_name}</td>
                      <td className="px-6 py-4">{req.leave_type}</td>
                      <td className="px-6 py-4">{req.start_date} to {req.end_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'Approved' ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error'}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
