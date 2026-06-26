import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeSite, assignedSites, unrestricted, setActiveSite } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/dashboard' && user && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      navigate('/my-profile', { replace: true });
    }
  }, [location.pathname, user, navigate]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-background text-on-surface flex overflow-hidden w-full h-screen">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`fixed left-0 top-0 h-screen w-[280px] flex flex-col border-r border-border-subtle bg-surface z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex flex-col gap-1">
          <h1 className="text-headline-md font-headline-md font-bold text-on-surface">CK Infra ERP</h1>
          <p className="text-label-md font-label-md text-text-muted">Infrastructure Management</p>
        </div>
        
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <div className="px-4 mb-6">
            <button className="w-full py-3 px-4 bg-secondary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-secondary/20">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>New Project</span>
            </button>
          </div>
        )}
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
          <Link 
            to="/my-profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/my-profile') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined">badge</span>
            <span className="text-label-md font-label-md">My Profile</span>
          </Link>
          
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Link 
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-label-md font-label-md">Dashboard</span>
            </Link>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <>
              <Link 
                to="/employees"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/employees') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">groups</span>
                <span className="text-label-md font-label-md">Workforce</span>
              </Link>
              <Link 
                to="/leave-requests"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/leave-requests') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">free_cancellation</span>
                <span className="text-label-md font-label-md">Leave Requests</span>
              </Link>
            </>
          )}
          <Link 
            to="/attendance" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/attendance') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
          >
              <span className="material-symbols-outlined">add_a_photo</span>
              <span className="text-label-md font-label-md">Mark Attendance</span>
            </Link>
            
            <Link 
              to="/attendance-logs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/attendance-logs') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">history</span>
              <span className="text-label-md font-label-md">{(user?.role === 'ADMIN' || user?.role === 'MANAGER') ? 'Attendance Logs' : 'My Attendance Logs'}</span>
            </Link>
            
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SITE_ENGINEER') && (
              <>
                <Link to="/labour" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/labour') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                  <span className="material-symbols-outlined">engineering</span>
                  <span className="text-label-md font-label-md">Labour Management</span>
                </Link>
                <Link to="/sites" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/sites') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                  <span className="material-symbols-outlined">foundation</span>
                  <span className="text-label-md font-label-md">Site Management</span>
                </Link>
                <Link to="/inventory" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/inventory') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                  <span className="material-symbols-outlined">inventory_2</span>
                  <span className="text-label-md font-label-md">Material Management</span>
                </Link>
                <Link to="/equipment" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/equipment') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                  <span className="material-symbols-outlined">precision_manufacturing</span>
                  <span className="text-label-md font-label-md">Equipment Management</span>
                </Link>
                <Link to="/expenses" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/expenses') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span className="text-label-md font-label-md">Site Expenses</span>
                </Link>
              </>
            )}
            
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Link 
                to="/reports"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/reports') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">analytics</span>
                <span className="text-label-md font-label-md">Reports</span>
              </Link>
            )}
            
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Link to="/financials" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/financials') ? 'text-primary font-bold bg-surface-container-high' : 'text-text-muted hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                <span className="text-label-md font-label-md">Financials</span>
              </Link>
            )}
        </nav>
        
        <div className="p-4 mt-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container">person</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-label-md font-bold truncate">{user?.full_name || 'Admin User'}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{user?.role || 'Project Director'}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-error hover:bg-error-container rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="text-label-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-[280px] w-full h-screen flex flex-col overflow-hidden relative">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-container-padding h-16 sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border-subtle">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg text-text-muted hover:bg-surface-container-low"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative w-full max-w-xs hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary transition-all" placeholder="Search..." type="text" />
            </div>

            {/* Site Selector / Badge */}
            <div className="flex items-center gap-2 md:gap-4">
              {activeSite ? (
                assignedSites.length > 1 ? (
                  <div className="relative">
                    <select 
                      className="appearance-none bg-surface-container-low px-4 py-2 pr-10 rounded-full border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 text-label-md font-bold text-text-main cursor-pointer max-w-[200px]"
                      value={activeSite?.id || 'GLOBAL'}
                      onChange={(e) => {
                        if (e.target.value === 'GLOBAL') {
                          setActiveSite(null);
                        } else {
                          const site = assignedSites.find(s => s.id === e.target.value);
                          if (site) setActiveSite(site);
                        }
                      }}
                    >
                      <option value="GLOBAL">🌎 Global View</option>
                      {assignedSites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-[20px]">expand_more</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-border-subtle">
                    <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]">location_on</span>
                    <span className="text-label-sm md:text-label-md font-bold truncate max-w-[100px] md:max-w-[200px]">{activeSite.name}</span>
                  </div>
                )
              ) : unrestricted ? (
                <div className="relative ml-2">
                  <select 
                    className="appearance-none bg-secondary/10 text-secondary px-4 py-2 pr-10 rounded-xl border border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-label-md font-bold cursor-pointer max-w-[250px]"
                    value={activeSite?.id || 'GLOBAL'}
                    onChange={(e) => {
                      if (e.target.value === 'GLOBAL') {
                        setActiveSite(null);
                      } else {
                        const site = assignedSites.find(s => s.id === e.target.value);
                        if (site) setActiveSite(site);
                      }
                    }}
                  >
                    <option value="GLOBAL">🌎 Global View</option>
                    {assignedSites.map(s => (
                      <option key={s.id} value={s.id}>📍 {s.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[20px]">expand_more</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container-low text-text-muted relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface"></span>
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container-low text-text-muted transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="h-6 w-[1px] bg-border-subtle mx-2"></div>
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low transition-colors">
              <span className="text-label-md font-semibold text-text-main">Support</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
