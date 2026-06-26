import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

interface LeaveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

const LeaveHistoryModal: React.FC<LeaveHistoryModalProps> = ({ isOpen, onClose, employeeId }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, employeeId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/leaves/?employee=${employeeId}`);
      const data = res.data.results || res.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center shrink-0">
          <h2 className="text-title-lg font-bold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            Leave History
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-surface">
          {loading ? (
            <div className="text-center py-8 text-text-muted">Loading history...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-text-muted bg-surface-container-low rounded-xl border border-border-subtle border-dashed">
              No leave requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-surface-container-high text-xs font-bold rounded text-on-surface-variant uppercase">{req.leave_type} Leave</span>
                      <span className="text-label-md font-bold text-text-main">{req.start_date} to {req.end_date}</span>
                    </div>
                    <p className="text-body-md text-text-muted line-clamp-2">{req.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === 'Approved' ? 'bg-status-success/20 text-status-success' :
                      req.status === 'Rejected' ? 'bg-status-error/20 text-status-error' :
                      'bg-status-warning/20 text-status-warning'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border-subtle shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-surface-container-low text-on-surface font-bold hover:bg-surface-container rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistoryModal;
