import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export interface Site {
  id: string;
  name: string;
}

interface SiteContextType {
  activeSite: Site | null;
  assignedSites: Site[];
  unrestricted: boolean;
  isLoading: boolean;
  setActiveSite: (site: Site | null) => void;
  refreshActiveSite: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeSite, setActiveSiteState] = useState<Site | null>(null);
  const [assignedSites, setAssignedSites] = useState<Site[]>([]);
  const [unrestricted, setUnrestricted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSites = async () => {
    if (!isAuthenticated || !user) {
      setActiveSiteState(null);
      setAssignedSites([]);
      setUnrestricted(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch Active Site status (determines if unrestricted or what the active site is based on attendance)
      const attendanceRes = await api.get(`/attendance/check-in/active-site/?t=${new Date().getTime()}`);
      setUnrestricted(attendanceRes.data.unrestricted);
      
      if (attendanceRes.data.unrestricted) {
        // Admins/Managers view all sites globally by default
        const sitesRes = await api.get('/sites/');
        const sites = Array.isArray(sitesRes.data.results) ? sitesRes.data.results : sitesRes.data;
        setAssignedSites(sites);
        
        // Try to restore previous selection
        const savedSiteId = localStorage.getItem('preferredActiveSite');
        const restoredSite = savedSiteId ? sites.find((s: Site) => s.id === savedSiteId) : null;
        setActiveSiteState(restoredSite || null);
      } else {
        // Employees are locked to their attendance site
        const defaultSite = attendanceRes.data.active_site;
        const allAssigned = attendanceRes.data.assigned_sites || (defaultSite ? [defaultSite] : []);
        
        // Try to restore previous selection
        const savedSiteId = localStorage.getItem('preferredActiveSite');
        const restoredSite = savedSiteId ? allAssigned.find((s: Site) => s.id === savedSiteId) : null;

        setActiveSiteState(restoredSite || defaultSite);
        setAssignedSites(allAssigned);
      }
      
    } catch (err) {
      console.error("Failed to fetch site context:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [isAuthenticated, user]);

  const refreshActiveSite = async () => {
    await fetchSites();
  };

  const setActiveSite = (site: Site | null) => {
    if (unrestricted || assignedSites.some(s => s.id === site?.id)) {
      setActiveSiteState(site);
      if (site) {
        localStorage.setItem('preferredActiveSite', site.id);
      } else {
        localStorage.removeItem('preferredActiveSite');
      }
    }
  };

  return (
    <SiteContext.Provider value={{ activeSite, assignedSites, unrestricted, isLoading, setActiveSite, refreshActiveSite }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};
