import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';

const AttendanceGate: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const { activeSite, unrestricted, isLoading } = useSite();

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <p className="text-label-md font-semibold text-text-muted">Verifying Site Access...</p>
        </div>
      </div>
    );
  }

  // Admins and Managers have unrestricted access to all sites
  if (unrestricted) {
    return <Outlet />;
  }

  // If the employee hasn't marked attendance today, they have no active site
  if (!activeSite) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-low h-full min-h-screen">
        <div className="bg-surface p-8 rounded-2xl shadow-lg border border-border-subtle max-w-md w-full text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] text-error">gpp_bad</span>
          </div>
          <h2 className="text-headline-md font-bold mb-4 text-on-surface">Access Denied</h2>
          <p className="text-body-lg text-text-muted mb-8">
            Please mark your daily attendance at a site to start your work. You can only access the site where you successfully mark attendance.
          </p>
          <a href="/attendance" className="w-full py-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary-hover transition-colors">
            <span className="material-symbols-outlined">add_a_photo</span>
            Go to Mark Attendance
          </a>
        </div>
      </div>
    );
  }

  // Attendance has been marked, grant access
  return <Outlet />;
};

export default AttendanceGate;
