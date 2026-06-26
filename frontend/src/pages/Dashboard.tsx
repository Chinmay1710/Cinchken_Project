import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import api from '../api/axios';

interface DashboardStats {
  total_employees: number;
  present_employees: number;
  absent_employees: number;
  late_arrivals: number;
  active_sites: number;
  total_labour: number;
  labour_present: number;
  pending_leaves: number;
  monthly_salary_expense: string;
  labour_stats?: { skill_type: string; count: number }[];
  projects?: { id: string; name: string; progress: number; engineer: string; status: string; is_active: boolean }[];
  activities?: { id: string; title: string; description: string; type: string; timestamp: string }[];
  attendance_trends?: { date: string; day: string; percentage: number }[];
}

const Dashboard: React.FC = () => {
  const { } = useAuth();
  const { activeSite } = useSite();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const siteParam = activeSite?.id ? `site=${activeSite.id}` : '';
        const dateParam = selectedDate ? `date=${selectedDate}` : '';
        const queryParams = [siteParam, dateParam].filter(Boolean).join('&');
        
        const response = await api.get(`/reports/dashboard-stats/${queryParams ? `?${queryParams}` : ''}`);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, [activeSite?.id, selectedDate]);

  // Micro-interactions simulation
  useEffect(() => {
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      const htmlCard = card as HTMLElement;
      htmlCard.addEventListener('mouseenter', () => {
        htmlCard.style.transform = 'translateY(-4px)';
      });
      htmlCard.addEventListener('mouseleave', () => {
        htmlCard.style.transform = 'translateY(0)';
      });
      htmlCard.style.transition = 'transform 0.3s ease-out, border-color 0.3s ease-out';
    });
  }, []);

  const generatePath = (data: { percentage: number }[]) => {
    if (!data || data.length === 0) return 'M0,100 L100,100';
    if (data.length === 1) return `M0,${100 - data[0].percentage} L100,${100 - data[0].percentage}`;
    const step = 100 / (data.length - 1);
    let path = `M0,${100 - data[0].percentage}`;
    for (let i = 1; i < data.length; i++) {
      const prevX = (i - 1) * step;
      const prevY = 100 - data[i - 1].percentage;
      const currX = i * step;
      const currY = 100 - data[i].percentage;
      const cp1x = prevX + step / 2;
      const cp1y = prevY;
      const cp2x = prevX + step / 2;
      const cp2y = currY;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
    }
    return path;
  };

  const pathD = stats?.attendance_trends ? generatePath(stats.attendance_trends) : 'M0,100 L100,100';

  return (
    <div className="p-container-padding">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Dashboard Overview</h2>
          <p className="text-body-md text-text-muted">Welcome back. Here's what's happening across your sites today.</p>
        </div>
        <div className="flex gap-3 items-center">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-white text-text-main font-semibold hover:bg-surface-container-low transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
            title="Filter dashboard by date"
          />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle bg-white text-text-main font-semibold hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-status-active text-label-sm font-bold flex items-center">+2.4%</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Total Employees</p>
            <h3 className="text-headline-md font-bold">{stats?.total_employees ?? '...'}</h3>
          </div>
        </div>
        
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-green-100 rounded-lg text-status-active">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
            <span className="text-status-active text-label-sm font-bold flex items-center">
              {stats ? Math.round((stats.present_employees / (stats.total_employees || 1)) * 100) + '%' : '...'}
            </span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Present Today</p>
            <h3 className="text-headline-md font-bold">{stats?.present_employees ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-100 rounded-lg text-error">
              <span className="material-symbols-outlined">person_off</span>
            </div>
            <span className="text-error text-label-sm font-bold flex items-center">
              {stats ? Math.round((stats.absent_employees / (stats.total_employees || 1)) * 100) + '%' : '...'}
            </span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Absent Today</p>
            <h3 className="text-headline-md font-bold">{stats?.absent_employees ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-yellow-100 rounded-lg text-status-on-hold">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <span className="text-error text-label-sm font-bold flex items-center">+0</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Late Arrivals</p>
            <h3 className="text-headline-md font-bold">{stats?.late_arrivals ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-100 rounded-lg text-status-completed">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <span className="text-text-muted text-label-sm">Live</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Active Sites</p>
            <h3 className="text-headline-md font-bold">{stats?.active_sites ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-100 rounded-lg text-secondary">
              <span className="material-symbols-outlined">engineering</span>
            </div>
            <span className="text-status-active text-label-sm font-bold flex items-center">Active</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Labour Present</p>
            <h3 className="text-headline-md font-bold">{stats?.labour_present ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-purple-100 rounded-lg text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined">event_busy</span>
            </div>
            <span className="text-status-on-hold text-label-sm font-bold flex items-center">Action Required</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Pending Leaves</p>
            <h3 className="text-headline-md font-bold">{stats?.pending_leaves ?? '...'}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 group hover:border-secondary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 rounded-lg text-text-main">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-status-active text-label-sm font-bold flex items-center">Within Budget</span>
          </div>
          <div>
            <p className="text-text-muted text-label-md">Monthly Salary Exp.</p>
            <h3 className="text-headline-md font-bold">{stats?.monthly_salary_expense ?? '...'}</h3>
          </div>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Attendance Trends */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-title-lg font-title-lg">Attendance Trends</h4>
            <select className="bg-surface-container-low border-none rounded-lg text-label-md px-3 py-1 focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[280px] w-full flex items-end justify-between gap-2 px-2 relative">
            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between text-label-sm text-text-muted opacity-50">
              <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
            </div>
            <svg className="absolute bottom-0 left-0 w-full h-[220px]" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d={pathD} fill="none" stroke="#22C55E" strokeWidth="2" />
              <path d={`${pathD} L100,100 L0,100 Z`} fill="url(#grad1)" opacity="0.1" />
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#22C55E', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#22C55E', stopOpacity:0}} />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-full flex justify-between mt-auto pt-4 text-label-sm text-text-muted border-t border-border-subtle">
              {stats?.attendance_trends ? (
                stats.attendance_trends.map(t => <span key={t.date}>{t.day}</span>)
              ) : (
                <><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></>
              )}
            </div>
          </div>
        </div>

        {/* Labour Statistics */}
        <div className="glass-card rounded-2xl p-6">
          <h4 className="text-title-lg font-title-lg mb-6">Labour Statistics</h4>
          <div className="relative h-[220px] flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-[16px] border-secondary" style={{ borderRightColor: '#E2E8F0', borderBottomColor: '#3B82F6' }}></div>
            <div className="absolute flex flex-col items-center">
              <span className="text-headline-md font-bold">{stats?.total_labour ?? '...'}</span>
              <span className="text-label-sm text-text-muted">Total Active</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {stats?.labour_stats && stats.labour_stats.length > 0 ? (
              stats.labour_stats.map((skill, idx) => {
                const colors = ['bg-secondary', 'bg-status-completed', 'bg-border-subtle', 'bg-primary', 'bg-error', 'bg-warning'];
                const colorClass = colors[idx % colors.length];
                return (
                  <div key={skill.skill_type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
                      <span className="text-body-md capitalize">{skill.skill_type}</span>
                    </div>
                    <span className="font-bold">{skill.count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-text-muted text-sm text-center">No labour data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Project Overview & Activities Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        {/* Project Overview Table */}
        <div className="xl:col-span-2 glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center">
            <h4 className="text-title-lg font-title-lg">Project Overview</h4>
            <button className="text-secondary text-label-md font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-table-row-standard text-label-sm text-text-muted">SITE NAME</th>
                  <th className="px-6 py-table-row-standard text-label-sm text-text-muted">PROGRESS</th>
                  <th className="px-6 py-table-row-standard text-label-sm text-text-muted">ENGINEER</th>
                  <th className="px-6 py-table-row-standard text-label-sm text-text-muted">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {stats?.projects && stats.projects.length > 0 ? (
                  stats.projects.map(project => (
                    <tr key={project.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-table-row-standard font-semibold">{project.name}</td>
                      <td className="px-6 py-table-row-standard">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden min-w-[80px]">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <span className="text-label-sm">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-table-row-standard">{project.engineer}</td>
                      <td className="px-6 py-table-row-standard">
                        <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${project.is_active ? 'bg-green-100 text-status-active' : 'bg-on-surface-variant/10 text-on-surface-variant'}`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-table-row-standard text-center text-text-muted">No projects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-title-lg font-title-lg">Recent Activities</h4>
            <button className="p-2 hover:bg-surface-container-low rounded-full">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {stats?.activities && stats.activities.length > 0 ? (
              stats.activities.map(activity => {
                let iconClass = "bg-slate-100 text-text-muted";
                let iconName = "event_note";
                
                if (activity.type === 'success') {
                  iconClass = "bg-green-100 text-status-active";
                  iconName = "check_circle";
                } else if (activity.type === 'info') {
                  iconClass = "bg-blue-100 text-status-completed";
                  iconName = "info";
                } else if (activity.type === 'warning') {
                  iconClass = "bg-yellow-100 text-status-on-hold";
                  iconName = "warning";
                }

                return (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div className="absolute left-4 top-10 bottom-[-24px] w-[1px] bg-border-subtle"></div>
                    <div className={`z-10 w-8 h-8 rounded-full ${iconClass} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[18px]">{iconName}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-md font-semibold text-text-main">{activity.title}</p>
                      <p className="text-label-sm text-text-muted mt-1">{activity.description}</p>
                      <p className="text-[10px] text-text-muted mt-2 font-bold uppercase tracking-wider">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-text-muted mt-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
