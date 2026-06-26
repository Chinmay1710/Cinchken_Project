import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import SiteModal from '../components/SiteModal';

import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { Navigate, Link } from 'react-router-dom';

export interface Site {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  geofence_radius_meters: number;
  attendance_cutoff_time: string;
  is_active: boolean;
  completion_percentage?: number;
  engineers_count?: number;
  labour_count?: number;
  start_date?: string | null;
  target_date?: string | null;
}

// Helper to generate deterministic mock data for UI flair based on string ID
const getMockData = (id: string | number) => {
  const num = parseInt(String(id).replace(/[^0-9]/g, '') || '1', 10);
  
  const statuses = [
    { label: 'IN PROGRESS', color: 'text-green-700 bg-green-100', barColor: 'bg-orange-500', progress: 65, left: '340 Days left' },
    { label: 'ON HOLD', color: 'text-amber-700 bg-amber-100', barColor: 'bg-amber-400', progress: 12, left: 'Pending Approvals' },
    { label: 'COMPLETED', color: 'text-blue-700 bg-blue-100', barColor: 'bg-green-500', progress: 100, left: 'Handover Successful' }
  ];
  const iconColors = ['bg-orange-200 text-orange-600', 'bg-indigo-200 text-indigo-600', 'bg-blue-200 text-blue-600'];
  const icons = ['construction', 'domain', 'apartment'];
  
  const idx = num % 3;
  return {
    status: statuses[idx],
    iconColor: iconColors[idx],
    icon: icons[idx],
    engineers: (num % 5) + 2,
    labour: (num % 150) + 50,
    startDate: 'Oct 12, 2023',
    targetDate: 'Dec 20, 2024'
  };
};

const SiteManagement: React.FC = () => {
  const { user } = useAuth();
  const { activeSite, unrestricted } = useSite();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | undefined>(undefined);
  
  // New modal states
  // We no longer need the assign drawer here since editing handles assignment.
  const [activeActionSite, setActiveActionSite] = useState<Site | null>(null);


  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sites/');
      let sitesData = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      
      // Strict isolation: if user is an employee locked to an active site, only show that site.
      if (!unrestricted && activeSite) {
        sitesData = sitesData.filter((s: any) => s.id === activeSite.id);
      }
      
      setSites(sitesData);
    } catch (err) {
      console.error('Failed to fetch sites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user]);

  const handleAdd = () => {
    setSelectedSite(undefined);
    setIsModalOpen(true);
  };


  return (
    <div className="p-container-padding h-full overflow-y-auto bg-surface-bright">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-bold text-text-main font-display tracking-tight">Site Management</h2>
            <p className="text-body-md text-text-muted mt-1">Oversee and coordinate active infrastructure projects across all regions.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container-lowest border border-border-subtle rounded-xl p-1">
              <button className="p-2 bg-white shadow-sm rounded-lg text-text-main"><span className="material-symbols-outlined block">grid_view</span></button>
              <button className="p-2 text-text-muted hover:text-text-main rounded-lg transition-colors"><span className="material-symbols-outlined block">view_list</span></button>
            </div>
            <button className="bg-white border border-border-subtle px-4 py-2.5 rounded-xl text-label-md font-semibold flex items-center gap-2 hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filter
            </button>
            {user?.role === 'ADMIN' && (
              <button onClick={handleAdd} className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-label-md font-bold flex items-center gap-2 hover:bg-[#EA580C] transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Site
              </button>
            )}
          </div>
        </div>

        {/* Site Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-10 text-center text-text-muted">Loading sites...</div>
          ) : (
            (Array.isArray(sites) ? sites : []).map((site, index) => {
              const mock = getMockData(site.id + index);
              
              return (
                <div key={site.id} className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mock.iconColor}`}>
                        <span className="material-symbols-outlined text-[24px]">{mock.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-[18px] font-bold text-text-main leading-tight mb-1">{site.name}</h3>
                        <p className="text-[12px] text-text-muted flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {site.address}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${mock.status.color} tracking-wider`}>
                      {mock.status.label}
                    </span>
                  </div>


                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Start Date</p>
                      <p className="text-[13px] font-bold text-text-main">{site.start_date || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Target Date</p>
                      <p className="text-[13px] font-bold text-text-main">{site.target_date || 'Not Set'}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-auto mb-6">
                    <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${mock.status.barColor} rounded-full`} style={{ width: `${site.completion_percentage || 0}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-text-main">{site.completion_percentage || 0}% Completed</span>
                      <span className="text-text-muted">{mock.status.left}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={() => { setSelectedSite(site); setIsModalOpen(true); }}
                        className="flex flex-col items-center justify-center gap-1 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-label-sm font-bold text-text-main hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit
                      </button>
                    )}
                    <Link 
                      to={`/sites/${site.id}`}
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-[#FFF7ED] text-[#EA580C] rounded-lg text-label-sm font-bold hover:bg-[#FFEDD5] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Details
                    </Link>
                    <Link 
                      to={`/sites/${site.id}/dpr/new`}
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-label-sm font-bold hover:bg-blue-100 transition-colors text-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                      Submit DPR
                    </Link>
                  </div>
                </div>
              );
            })
          )}
          
          {/* New Project Card */}
          {user?.role === 'ADMIN' && (
            <div 
              onClick={handleAdd}
              className="bg-transparent rounded-2xl border-2 border-dashed border-border-subtle hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center p-8 h-full min-h-[350px] group"
            >
              <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[32px] text-[#EA580C]">add</span>
              </div>
              <h3 className="text-title-lg font-bold text-text-main mb-1">New Project</h3>
              <p className="text-body-md text-text-muted text-center">Initialize a new site location</p>
            </div>
          )}
        </div>
      </div>

      <SiteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchSites}
        site={selectedSite}
      />

    </div>
  );
};

export default SiteManagement;

