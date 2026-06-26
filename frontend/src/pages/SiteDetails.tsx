import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import type { Site } from './SiteManagement';
import { useAuth } from '../context/AuthContext';
import { DPRViewerModal } from '../components/DPRViewerModal';

const SiteDetails: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDate, setNewLevelDate] = useState('');
  const [newLevelAssignee, setNewLevelAssignee] = useState('');
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchSiteData = async () => {
    setLoading(true);
    try {
      // In a real app we'd load everything in parallel, but sequential is fine for now
      const siteRes = await api.get(`/sites/${siteId}/`);
      setSite(siteRes.data);

      const engineersRes = await api.get(`/sites/assignments/engineers/?site=${siteId}`);
      setEngineers(Array.isArray(engineersRes.data.results) ? engineersRes.data.results : engineersRes.data);

      const employeesRes = await api.get(`/sites/assignments/?site=${siteId}`);
      console.log("Employees:", employeesRes.data);

      const reportsRes = await api.get(`/reports/daily/?site=${siteId}`);
      setReports(Array.isArray(reportsRes.data.results) ? reportsRes.data.results : reportsRes.data);
      
      const docsRes = await api.get(`/sites/documents/?site=${siteId}`);
      setDocuments(Array.isArray(docsRes.data.results) ? docsRes.data.results : docsRes.data);

      const levelsRes = await api.get(`/sites/levels/?site=${siteId}`);
      setLevels(Array.isArray(levelsRes.data.results) ? levelsRes.data.results : levelsRes.data);

    } catch (err) {
      console.error('Failed to load site details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEngineer = async (assignmentId: number) => {
    if (!window.confirm("Are you sure you want to remove this engineer?")) return;
    try {
      await api.delete(`/sites/assignments/engineers/${assignmentId}/`);
      fetchSiteData();
    } catch (err) {
      console.error('Failed to remove engineer', err);
      alert('Failed to remove engineer');
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('site', siteId!);
    // Try to guess doc type from file name, otherwise default to Drawings
    let docType = 'Drawings';
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('agree')) docType = 'Agreement';
    else if (lowerName.includes('approv')) docType = 'Approvals';
    else if (lowerName.includes('blue')) docType = 'Blueprints';
    formData.append('document_type', docType);

    setUploadingDoc(true);
    try {
      await api.post('/sites/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchSiteData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/sites/documents/${docId}/`);
      fetchSiteData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim()) return;
    try {
      await api.post('/sites/levels/', { 
        site: siteId, 
        name: newLevelName,
        target_date: newLevelDate || null,
        assigned_to: newLevelAssignee || null 
      });
      setNewLevelName('');
      setNewLevelDate('');
      setNewLevelAssignee('');
      setIsAddingLevel(false);
      fetchSiteData();
    } catch (err) {
      console.error(err);
      alert('Failed to add level');
    }
  };

  const handleToggleLevel = async (levelId: number) => {
    try {
      await api.patch(`/sites/levels/${levelId}/toggle_complete/`);
      fetchSiteData();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle level');
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
    }
  }, [siteId]);

  const calculateProgress = () => {
    if (levels.length === 0) return 0;
    const completed = levels.filter(l => l.is_completed).length;
    return Math.round((completed / levels.length) * 100);
  };

  const progressPercentage = calculateProgress();

  if (loading) return <div className="p-8 text-center text-text-muted">Loading Site Details...</div>;
  if (!site) return <div className="p-8 text-center text-red-500">Site not found.</div>;

  return (
    <div className="p-container-padding h-full overflow-y-auto bg-surface-bright">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <Link to="/sites" className="p-2 bg-surface-container-low hover:bg-surface-container rounded-full transition-colors text-text-main shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-[32px] font-bold text-text-main font-display tracking-tight">{site.name}</h2>
            <p className="text-body-md text-text-muted mt-1">{site.address}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">
              ACTIVE
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        {/* Dashboard Content */}
        <div className="space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
              <h3 className="text-title-md font-bold mb-4">Project Overview</h3>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-label-md font-bold text-text-main">Completion Progress</span>
                  <span className="text-label-md font-bold text-primary">{progressPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-lowest rounded-xl">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Target End Date</p>
                  <p className="text-body-lg font-bold text-text-main">Dec 20, 2024</p>
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-xl">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Labour Count</p>
                  <p className="text-body-lg font-bold text-text-main">{site.labour_count || 0} Employees</p>
                </div>
              </div>
            </div>

            {/* Project Levels */}
            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-title-md font-bold">Project Levels / Milestones</h3>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <button 
                    onClick={() => setIsAddingLevel(!isAddingLevel)}
                    className="text-primary font-bold text-sm hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">{isAddingLevel ? 'close' : 'add'}</span>
                    {isAddingLevel ? 'Cancel' : 'Add Level'}
                  </button>
                )}
              </div>
              
              {isAddingLevel && (
                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 p-4 bg-surface-container-lowest border border-border-subtle rounded-xl">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Level Name (e.g. Foundation, Ground Floor)" 
                      className="flex-1 px-4 py-2 bg-white border border-border-subtle rounded-xl text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={newLevelName}
                      onChange={(e) => setNewLevelName(e.target.value)}
                    />
                    <button 
                      onClick={handleAddLevel}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="date" 
                      className="flex-1 px-4 py-2 bg-white border border-border-subtle rounded-xl text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={newLevelDate}
                      onChange={(e) => setNewLevelDate(e.target.value)}
                    />
                    <select 
                      className="flex-1 px-4 py-2 bg-white border border-border-subtle rounded-xl text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={newLevelAssignee}
                      onChange={(e) => setNewLevelAssignee(e.target.value)}
                    >
                      <option value="">-- Assign To (Optional) --</option>
                      {engineers.map(eng => (
                        <option key={eng.user} value={eng.user}>{eng.user_full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {levels.length === 0 ? (
                  <p className="text-text-muted text-center py-4">No levels defined yet.</p>
                ) : (
                  levels.map(level => (
                    <div 
                      key={level.id} 
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-xl transition-colors cursor-pointer ${level.is_completed ? 'bg-green-50/50 border-green-200' : 'bg-surface-container-lowest border-border-subtle hover:border-primary/50'}`}
                      onClick={() => handleToggleLevel(level.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${level.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-border-subtle text-transparent'}`}>
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </div>
                        <div>
                          <p className={`text-body-lg font-bold transition-colors ${level.is_completed ? 'text-green-800 line-through opacity-70' : 'text-text-main'}`}>
                            {level.name}
                          </p>
                          {(level.target_date || level.assigned_to_name) && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted font-medium">
                              {level.target_date && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">event</span>
                                  {new Date(level.target_date).toLocaleDateString()}
                                </span>
                              )}
                              {level.assigned_to_name && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">person</span>
                                  {level.assigned_to_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {level.is_completed && level.completed_at && (
                        <div className="text-left sm:text-right ml-10 sm:ml-0">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Completed</p>
                          <p className="text-xs text-text-muted">{new Date(level.completed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Reports */}
            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-title-md font-bold">Recent Daily Reports</h3>
                <div className="flex gap-4">
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SITE_ENGINEER') && (
                    <Link to={`/sites/${siteId}/dpr/new`} className="text-primary font-bold text-sm bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">add_chart</span>
                      Submit Detailed Report
                    </Link>
                  )}
                  <button className="text-primary font-bold text-sm hover:underline py-2">View All</button>
                </div>
              </div>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-text-muted text-center py-4">No reports submitted yet.</p>
                ) : (
                  reports.slice(0, 5).map(report => (
                    <div 
                      key={report.id} 
                      onClick={() => { setSelectedReport(report); setIsReportModalOpen(true); }}
                      className="flex items-center justify-between p-4 border border-border-subtle rounded-xl hover:bg-surface-container-lowest transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <div>
                          <p className="text-body-md font-bold text-text-main">{report.report_date}</p>
                          <p className="text-body-sm text-text-muted text-ellipsis overflow-hidden whitespace-nowrap max-w-[300px]">{report.work_summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-body-md font-bold text-text-main">{report.progress_percentage}%</p>
                          <p className="text-xs text-text-muted">Progress</p>
                        </div>
                        <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Site Documents */}
            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-md font-bold">Site Documents & Drawings</h3>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <div className="relative">
                    <input 
                      type="file" 
                      id="doc-upload" 
                      className="hidden" 
                      onChange={handleDocUpload} 
                      disabled={uploadingDoc}
                    />
                    <label htmlFor="doc-upload" className={`px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${uploadingDoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/20'}`}>
                      {uploadingDoc ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      )}
                      {uploadingDoc ? 'Uploading...' : 'Upload'}
                    </label>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documents.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-text-muted border-2 border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_open</span>
                    <p className="font-medium">No documents uploaded yet.</p>
                  </div>
                ) : (
                  documents.map(doc => {
                    const isPdf = doc.file.toLowerCase().endsWith('.pdf');
                    const filename = doc.file.split('/').pop() || 'Document';
                    
                    let fileUrl = doc.file;
                    if (fileUrl.includes('host.docker.internal')) {
                      fileUrl = fileUrl.replace('host.docker.internal', 'localhost');
                    } else if (!fileUrl.startsWith('http')) {
                      fileUrl = `http://localhost:8001${fileUrl}`;
                    }
                    
                    return (
                      <div 
                        key={doc.id} 
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="group relative aspect-square border border-border-subtle rounded-xl flex flex-col items-center justify-center p-4 hover:bg-surface-container-lowest transition-all hover:border-primary/50 hover:shadow-sm overflow-hidden cursor-pointer"
                      >
                        {isPdf ? (
                          <span className="material-symbols-outlined text-[64px] mb-2 text-red-500 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center -z-10 group-hover:scale-105 transition-transform duration-500">
                             <img src={fileUrl} alt="Document thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                          </div>
                        )}
                        <div className={`mt-auto w-full p-2 rounded bg-white/90 backdrop-blur-sm border ${isPdf ? 'border-transparent' : 'border-border-subtle'} text-center shadow-sm`}>
                          <span className="text-xs font-bold text-text-main break-all line-clamp-2 leading-tight" title={filename}>
                            {filename}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                              className="w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                          <a 
                            href={fileUrl} 
                            download={filename}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-colors"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        </div>
      </div>
      <DPRViewerModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} report={selectedReport} />
    </div>
  );
};

export default SiteDetails;
