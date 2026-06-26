import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { DPRViewerModal } from '../components/DPRViewerModal';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/daily/');
      setReports(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bright p-container-padding custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-[32px] font-bold text-text-main font-display">Daily Progress Reports</h2>
          <p className="text-body-md text-text-muted">Review all submitted site reports across the organization.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
          {loading ? (
            <p className="text-center text-text-muted py-8">Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <span className="material-symbols-outlined text-[64px] text-border-subtle mb-4">description</span>
              <p className="text-title-md font-bold text-text-main mb-2">No Reports Found</p>
              <p className="text-body-md text-text-muted">There are no daily progress reports submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="text-label-sm text-text-muted uppercase tracking-wider bg-surface/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Site</th>
                    <th className="px-6 py-4 font-semibold">Submitted By</th>
                    <th className="px-6 py-4 font-semibold text-center">Progress</th>
                    <th className="px-6 py-4 font-semibold">Summary</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer group" onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}>
                      <td className="px-6 py-4 font-bold text-on-surface">{report.report_date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">foundation</span>
                          <span className="font-bold text-text-main">{report.site_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted">{report.submitted_by_name}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-label-sm font-bold">
                          {report.progress_percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted max-w-xs truncate">{report.work_summary}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary font-bold text-label-sm px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 ml-auto">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <DPRViewerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} report={selectedReport} />
    </div>
  );
};

export default Reports;
