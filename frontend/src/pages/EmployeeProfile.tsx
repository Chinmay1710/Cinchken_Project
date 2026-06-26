import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import EmployeeModal from '../components/EmployeeModal';
import LeaveRequestModal from '../components/LeaveRequestModal';
import LeaveHistoryModal from '../components/LeaveHistoryModal';

interface ProfileData {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  is_active: boolean;
  monthly_base_salary: string;
  site_assignments: {
    id: string;
    assignment_id: number;
    type: string;
    name: string;
    address: string;
    is_active: boolean;
  }[];
  attendance_stats: {
    month: number;
    year: number;
    present_days: number;
    total_days_in_month: number;
    rate_percentage: number;
    log: Array<{
      date: string;
      status: string;
    }>;
  };
  latest_payroll: {
    month: number;
    year: number;
    net_salary: number;
    status: string;
  } | null;
  leave_balance?: {
    annual_leaves_total: number;
    sick_leaves_total: number;
    annual_leaves_used: number;
    sick_leaves_used: number;
  } | null;
}

const EmployeeProfile = ({ isSelf = false }: { isSelf?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'site_logs' | 'payroll'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const targetId = isSelf ? user?.id : id;
      if (!targetId) return;
      const res = await api.get(`/users/${targetId}/profile/`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, isSelf, user?.id]);

  useEffect(() => {
    if (id || isSelf) fetchProfile();
  }, [id, isSelf, fetchProfile]);

  if (loading) {
    return <div className="flex-1 p-8 text-center text-text-muted">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-title-lg font-bold">Employee not found</h2>
        <button onClick={() => navigate('/employees')} className="mt-4 text-primary underline">Back to Directory</button>
      </div>
    );
  }

  // Generate mini calendar days based on the current month from stats
  const now = new Date();
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calendarDays = [];
  
  // Create a map of date string to status for easy lookup
  const attendanceMap = new Map();
  profile.attendance_stats.log.forEach(record => {
    attendanceMap.set(record.date, record.status);
  });

  for (let i = 1; i <= currentMonthDays; i++) {
    const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const status = attendanceMap.get(dStr);
    calendarDays.push({ day: i, status, dateStr: dStr });
  }

  const getDayClass = (status?: string) => {
    if (!status) return "bg-surface-container-highest text-outline font-bold text-xs"; // No record
    switch(status) {
      case 'Present': return "bg-status-success/20 text-status-success font-bold text-xs";
      case 'Absent': return "bg-status-error/20 text-status-error font-bold text-xs";
      case 'Half-day': return "bg-status-warning/20 text-status-warning font-bold text-xs";
      case 'Late': return "bg-status-warning/20 text-status-warning font-bold text-xs";
      default: return "bg-surface-container-highest text-outline font-bold text-xs";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto p-container-padding">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
        
        {/* Back Button */}
        {!isSelf && (
          <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-label-md font-bold relative z-10 w-fit">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Directory
          </button>
        )}

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <span className="material-symbols-outlined">info</span>
            <span className="font-medium text-body-md">{toastMessage}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <section className="bg-white/70 backdrop-blur-md border border-white/30 shadow-[0_4px_12px_rgba(15,23,42,0.04)] rounded-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
            <div className="w-32 h-32 rounded-2xl border-4 border-surface overflow-hidden shadow-lg -mb-6 md:mb-0 bg-primary-container text-on-primary-container flex items-center justify-center">
               <span className="text-display-lg font-bold">{(profile.full_name || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 text-center md:text-left mt-6 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                <h2 className="text-[32px] font-bold leading-[40px] tracking-tight text-primary">{profile.full_name}</h2>
                {profile.is_active ? (
                  profile.site_assignments.some(site => site.is_active) ? (
                    <span className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-label-md font-bold self-center md:self-auto border border-status-success/20">Active Duty</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-label-md font-bold self-center md:self-auto border border-orange-200">Idle</span>
                  )
                ) : (
                  <span className="px-3 py-1 rounded-full bg-on-surface-variant/10 text-on-surface-variant text-label-md font-bold self-center md:self-auto border border-on-surface-variant/20">Inactive</span>
                )}
              </div>
              <p className="text-body-lg text-on-surface-variant font-medium">{profile.designation || profile.role} • ID: EMP-{profile.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'ADMIN' && (
                <button onClick={() => setIsEditModalOpen(true)} className="bg-surface border border-outline-variant text-primary px-4 py-2 rounded-lg font-bold text-label-md hover:bg-surface-container-low transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">edit</span> Edit Profile
                </button>
              )}
              <button onClick={() => showToast('Dossier download started...')} className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-label-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">download</span> Export dossier
              </button>
            </div>
          </div>
        </section>

        {/* Profile Tabs */}
        <div className="flex border-b border-border-subtle mb-8 gap-8">
          <button onClick={() => setActiveTab('overview')} className={`pb-4 font-bold border-b-2 text-label-md ${activeTab === 'overview' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}>Overview</button>
          <button onClick={() => setActiveTab('documents')} className={`pb-4 font-bold border-b-2 text-label-md ${activeTab === 'documents' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}>Documents</button>
          <button onClick={() => setActiveTab('site_logs')} className={`pb-4 font-bold border-b-2 text-label-md ${activeTab === 'site_logs' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}>Site Logs</button>
          <button onClick={() => setActiveTab('payroll')} className={`pb-4 font-bold border-b-2 text-label-md ${activeTab === 'payroll' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}>Payroll</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Left Column: Personal Info & Leave */}
          <div className="col-span-1 md:col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm">
              <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">person</span> Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-body-lg text-primary font-medium">{profile.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-body-lg text-primary font-medium">{profile.mobile_number}</p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Department</p>
                  <p className="text-body-lg text-primary font-medium">{profile.department || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Emergency Contact</p>
                  <p className="text-body-lg text-primary font-medium">N/A (To be added)</p>
                </div>
              </div>
            </div>

            {/* Leave Records */}
            <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm">
              <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">event_note</span> Leave Balance
                </span>
                <span onClick={() => setIsHistoryModalOpen(true)} className="text-label-md text-secondary hover:underline cursor-pointer">History</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg text-center">
                  <p className="text-[48px] leading-[60px] font-black tracking-tight text-primary">
                    {profile.leave_balance ? profile.leave_balance.annual_leaves_total - profile.leave_balance.annual_leaves_used : '0'}
                  </p>
                  <p className="text-label-md font-bold text-on-surface-variant">Annual Left</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg text-center">
                  <p className="text-[48px] leading-[60px] font-black tracking-tight text-primary">
                    {profile.leave_balance ? profile.leave_balance.sick_leaves_total - profile.leave_balance.sick_leaves_used : '0'}
                  </p>
                  <p className="text-label-md font-bold text-on-surface-variant">Sick Left</p>
                </div>
              </div>
              <button onClick={() => setIsLeaveModalOpen(true)} className="w-full mt-6 py-2 border-2 border-primary text-primary rounded-lg font-bold text-label-md hover:bg-primary hover:text-white transition-all">
                Request Time Off
              </button>
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="col-span-1 md:col-span-12 lg:col-span-8 space-y-8">
            
            {/* Site Assignments */}
            <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm">
              <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">location_city</span> Current Site Assignments
              </h3>
              <div className="space-y-4">
                {profile.site_assignments.length > 0 ? (
                  profile.site_assignments.map(site => (
                    <div key={`${site.type}-${site.assignment_id}`} className="flex flex-col p-4 rounded-xl border border-border-subtle hover:bg-surface-bright transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-outline">apartment</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-title-md text-primary">{site.name}</h4>
                            <span className={`text-label-md font-bold ${site.is_active ? 'text-secondary' : 'text-text-muted'}`}>
                              {site.is_active ? 'Assigned' : 'Past Assignment'}
                            </span>
                          </div>
                          <p className="text-body-sm text-text-muted">{site.address}</p>
                        </div>
                      </div>
                      {/* Admin Unassign Action */}
                      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && site.is_active && (
                        <div className="mt-4 pt-3 border-t border-border-subtle flex justify-end">
                          <button 
                            onClick={async () => {
                              if (!window.confirm("Mark this assignment as Past?")) return;
                              try {
                                const endpoint = site.type === 'ENGINEER' 
                                  ? `/sites/assignments/engineers/${site.assignment_id}/mark_past/`
                                  : `/sites/assignments/${site.assignment_id}/mark_past/`;
                                await api.post(endpoint);
                                showToast('Assignment marked as past');
                                fetchProfile();
                              } catch(e) {
                                showToast('Failed to update assignment');
                              }
                            }}
                            className="text-label-md font-bold text-error hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">history</span>
                            Mark as Past
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted italic">No site assignments.</p>
                )}
              </div>
            </div>

            {/* Attendance & Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Attendance */}
              <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col">
                <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">calendar_month</span> Attendance
                  </span>
                  <span className="text-label-md font-bold text-status-success">{profile.attendance_stats.rate_percentage}% Rate</span>
                </h3>
                <div className="grid gap-1 text-center mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  <span className="text-[10px] font-bold text-outline">M</span>
                  <span className="text-[10px] font-bold text-outline">T</span>
                  <span className="text-[10px] font-bold text-outline">W</span>
                  <span className="text-[10px] font-bold text-outline">T</span>
                  <span className="text-[10px] font-bold text-outline">F</span>
                  <span className="text-[10px] font-bold text-outline">S</span>
                  <span className="text-[10px] font-bold text-outline">S</span>
                </div>
                <div className="grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {calendarDays.map((d, idx) => (
                    <div key={idx} className={`aspect-square flex items-center justify-center rounded-sm ${getDayClass(d.status)}`} title={`${d.dateStr}: ${d.status || 'No record'}`}>
                      {d.day}
                    </div>
                  ))}
                </div>
                <p className="text-label-md text-on-surface-variant mt-4 italic text-center">Data for current month ({profile.attendance_stats.present_days} days present)</p>
              </div>

              {/* Salary */}
              <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col">
                <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">payments</span> Salary & Payouts
                </h3>
                <div className="mb-4">
                  <p className="text-label-md text-on-surface-variant mb-1">Base Salary</p>
                  <h4 className="text-[32px] font-black leading-[40px] tracking-tight text-primary">₹{profile.monthly_base_salary ? parseFloat(profile.monthly_base_salary).toLocaleString('en-IN') : '0'}</h4>
                </div>
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-body-md text-on-surface-variant">Latest Payroll ({profile.latest_payroll ? `${profile.latest_payroll.month}/${profile.latest_payroll.year}` : 'N/A'})</span>
                    <span className="text-body-md font-bold text-primary">₹{profile.latest_payroll ? profile.latest_payroll.net_salary.toLocaleString('en-IN') : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-body-md text-on-surface-variant">Status</span>
                    <span className="text-body-md font-bold text-status-success">{profile.latest_payroll ? profile.latest_payroll.status : 'None'}</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab('payroll')} className="mt-4 text-secondary font-bold text-label-md flex items-center gap-1 hover:gap-2 transition-all">
                  View Payslip History <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Documents (Mocked) */}
            <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm">
              <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">folder_shared</span> Compliance & Documents
                </span>
                <button onClick={() => showToast('File upload dialog opened.')} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-label-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span> Upload New
                </button>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div onClick={() => showToast('Opening Aadhar_KYC.pdf')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-error mb-2">picture_as_pdf</span>
                  <p className="text-label-md font-bold text-primary truncate">Aadhar_KYC.pdf</p>
                  <p className="text-[10px] text-on-surface-variant">Verified Oct 2023</p>
                </div>
                <div onClick={() => showToast('Opening Joining_Letter.pdf')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  <p className="text-label-md font-bold text-primary truncate">Joining_Letter.pdf</p>
                  <p className="text-[10px] text-on-surface-variant">Signed Mar 2021</p>
                </div>
                <div onClick={() => showToast('Opening Site_Pass_2024.jpg')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-status-warning mb-2">badge</span>
                  <p className="text-label-md font-bold text-primary truncate">Site_Pass_2024.jpg</p>
                  <p className="text-[10px] text-on-surface-variant">Expires in 23 days</p>
                </div>
                <div onClick={() => showToast('Opening Medical_Cert.pdf')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-status-success mb-2">medical_services</span>
                  <p className="text-label-md font-bold text-primary truncate">Medical_Cert.pdf</p>
                  <p className="text-[10px] text-on-surface-variant">Clean bill 2024</p>
                </div>
              </div>
            </div>

          </div>
        </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-[18px] font-semibold leading-[28px] text-primary mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">folder_shared</span> All Documents
              </span>
              <button onClick={() => showToast('File upload dialog opened.')} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">upload_file</span> Upload New
              </button>
            </h3>
            <p className="text-text-muted mb-4">View and manage all compliance documents and certificates for this employee.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {/* Just reusing the mocked documents for the tab view */}
                <div onClick={() => showToast('Opening Aadhar_KYC.pdf')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-error mb-2">picture_as_pdf</span>
                  <p className="text-label-md font-bold text-primary truncate">Aadhar_KYC.pdf</p>
                </div>
                <div onClick={() => showToast('Opening Joining_Letter.pdf')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  <p className="text-label-md font-bold text-primary truncate">Joining_Letter.pdf</p>
                </div>
                <div onClick={() => showToast('Opening Site_Pass_2024.jpg')} className="border border-border-subtle rounded-lg p-3 text-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[40px] text-status-warning mb-2">badge</span>
                  <p className="text-label-md font-bold text-primary truncate">Site_Pass_2024.jpg</p>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'site_logs' && (
          <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col items-center justify-center min-h-[300px] animate-in fade-in zoom-in-95 duration-300">
            <span className="material-symbols-outlined text-[48px] text-border-subtle mb-4">history</span>
            <h2 className="text-xl font-bold mb-2">Site Logs History</h2>
            <p className="text-text-muted">Detailed check-in/out logs for this employee will be available here soon.</p>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="bg-white rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col items-center justify-center min-h-[300px] animate-in fade-in zoom-in-95 duration-300">
            <span className="material-symbols-outlined text-[48px] text-border-subtle mb-4">request_quote</span>
            <h2 className="text-xl font-bold mb-2">Payroll & Payslips</h2>
            <p className="text-text-muted">Historical payroll records and downloadable payslips will be populated here.</p>
          </div>
        )}

      </div>
      
      {isEditModalOpen && profile && (
        <EmployeeModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            showToast('Employee profile updated successfully!');
            fetchProfile();
          }}
          employee={profile}
        />
      )}

      {isLeaveModalOpen && profile && (
        <LeaveRequestModal
          employeeId={profile.id}
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onSuccess={() => {
            showToast('Leave request submitted successfully!');
            fetchProfile(); // refresh if we want to show anything new, but balance only updates on approval.
          }}
        />
      )}

      {isHistoryModalOpen && profile && (
        <LeaveHistoryModal
          employeeId={profile.id}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EmployeeProfile;
