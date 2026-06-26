import { useState, useEffect } from 'react';
import api from '../api/axios';

interface PayrollRecord {
  id: string;
  employee_details: {
    mobile_number: string;
    email: string;
    full_name: string;
  };
  employee_name: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  total_days: number;
  present_days: number;
  base_salary: string;
  deductions: string;
  net_salary: string;
  status: 'Calculated' | 'Review Required' | 'Paid';
}

const SalaryManagement = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // For Editing Deductions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempDeductions, setTempDeductions] = useState<string>('');

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/finance/payroll/?month=${selectedMonth}&year=${selectedYear}`);
      const data = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setPayrolls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayroll = async () => {
    try {
      await api.post('/finance/payroll/generate_payroll/', { month: selectedMonth, year: selectedYear });
      alert("Payroll generated successfully for the month.");
      fetchPayrolls();
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate payroll.");
    }
  };

  const handleProcessPayments = async () => {
    try {
      await api.post('/finance/payroll/process_payments/', { month: selectedMonth, year: selectedYear });
      alert("Payments processed! Status marked as Paid.");
      fetchPayrolls();
    } catch (err: any) {
      console.error(err);
      alert("Failed to process payments.");
    }
  };

  const handleSaveDeductions = async (id: string) => {
    try {
      await api.patch(`/finance/payroll/${id}/`, { deductions: tempDeductions });
      setEditingId(null);
      fetchPayrolls();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update deductions.");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/finance/payroll/${id}/`, { status: 'Paid' });
      fetchPayrolls();
    } catch (err: any) {
      console.error(err);
      alert("Failed to mark as paid.");
    }
  };

  const handleRevertPaid = async (id: string) => {
    try {
      await api.patch(`/finance/payroll/${id}/`, { status: 'Calculated' });
      fetchPayrolls();
    } catch (err: any) {
      console.error(err);
      alert("Failed to revert status.");
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
    if (filterDepartment && p.department !== filterDepartment) return false;
    if (filterStatus) {
      if (filterStatus === 'Paid' && p.status !== 'Paid') return false;
      if (filterStatus === 'Pending' && p.status === 'Paid') return false;
    }
    return true;
  });

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.net_salary || '0'), 0);
  const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.deductions || '0'), 0);
  const avgSalary = filteredPayrolls.length > 0 ? totalPayroll / filteredPayrolls.length : 0;

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Calculated': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-active/10 text-status-active">Calculated</span>;
      case 'Review Required': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-on-hold/10 text-status-on-hold">Review Required</span>;
      case 'Paid': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Paid</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-text-muted">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-bright p-container-padding overflow-y-auto">
      <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-text-main">Salary Management</h2>
            <div className="flex items-center gap-4 mt-2">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white border border-border-subtle rounded-lg px-3 py-1.5 text-body-md font-medium"
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white border border-border-subtle rounded-lg px-3 py-1.5 text-body-md font-medium"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGeneratePayroll} className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-label-md font-bold text-text-main flex items-center gap-2 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">calculate</span>
              Generate Payroll
            </button>
            <button onClick={handleProcessPayments} className="px-4 py-2 bg-primary text-white rounded-xl text-label-md font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Process Payments
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/5 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">account_balance</span>
              </div>
            </div>
            <p className="text-label-md text-text-muted uppercase tracking-wider">Monthly Payroll Total</p>
            <h3 className="font-display text-display text-text-main mt-1">₹{totalPayroll.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-secondary-container/5 p-2 rounded-lg">
                <span className="material-symbols-outlined text-secondary-container">payments</span>
              </div>
            </div>
            <p className="text-label-md text-text-muted uppercase tracking-wider">Average Net Salary</p>
            <h3 className="font-display text-display text-text-main mt-1">₹{avgSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary-container"></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-error/5 p-2 rounded-lg">
                <span className="material-symbols-outlined text-error">money_off</span>
              </div>
            </div>
            <p className="text-label-md text-text-muted uppercase tracking-wider">Total Deductions</p>
            <h3 className="font-display text-display text-text-main mt-1">₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-error"></div>
          </div>
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border-subtle flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border-subtle flex flex-wrap gap-4 items-center justify-between bg-surface-container-lowest">
            <div className="flex gap-4 items-center">
              <h4 className="font-title-lg text-title-lg text-text-main pr-4 border-r border-border-subtle">Payroll Summary</h4>
              <div className="flex items-center gap-2 bg-white border border-border-subtle px-3 py-2 rounded-lg">
                <span className="text-label-md text-text-muted">Department:</span>
                <select 
                  className="border-none bg-transparent p-0 text-label-md font-bold focus:ring-0 cursor-pointer"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-border-subtle px-3 py-2 rounded-lg">
                <span className="text-label-md text-text-muted">Status:</span>
                <select 
                  className="border-none bg-transparent p-0 text-label-md font-bold focus:ring-0 cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="text-label-md text-text-muted">
              Showing <span className="font-bold text-text-main">{filteredPayrolls.length}</span> Employees
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold">Employee</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold text-center">Total Days</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold text-center">Present</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold">Basic Salary</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold">Deductions</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold">Net Salary</th>
                  <th className="px-6 py-4 text-label-sm text-text-muted uppercase tracking-wider font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-text-muted">Loading payroll data...</td></tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-text-muted">No payroll records found for this month. Click "Generate Payroll".</td></tr>
                ) : (
                  filteredPayrolls.map(p => (
                    <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-body-md font-bold text-text-main">{p.employee_name}</p>
                        <p className="text-label-md text-text-muted">{p.designation || p.department}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-body-md">{p.total_days}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-body-md font-bold text-status-active">{p.present_days}</span>
                      </td>
                      <td className="px-6 py-4 text-body-md font-medium">₹{parseFloat(p.base_salary).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-24 px-2 py-1 border border-border-subtle rounded text-body-sm"
                              value={tempDeductions}
                              onChange={(e) => setTempDeductions(e.target.value)}
                            />
                            <button onClick={() => handleSaveDeductions(p.id)} className="text-primary hover:text-primary/80"><span className="material-symbols-outlined text-[18px]">check_circle</span></button>
                            <button onClick={() => setEditingId(null)} className="text-error hover:text-error/80"><span className="material-symbols-outlined text-[18px]">cancel</span></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group-hover:bg-surface-container-low rounded">
                            <span className={`text-body-md ${parseFloat(p.deductions) > 0 ? 'text-error font-medium' : 'text-text-muted'}`}>
                              ₹{parseFloat(p.deductions).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            {p.status !== 'Paid' && (
                              <button 
                                onClick={() => { setEditingId(p.id); setTempDeductions(p.deductions); }}
                                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-opacity"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-body-md font-bold text-text-main">₹{parseFloat(p.net_salary).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(p.status)}
                          {p.status !== 'Paid' ? (
                            <button 
                              onClick={() => handleMarkPaid(p.id)}
                              className="text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRevertPaid(p.id)}
                              className="text-[11px] font-bold text-error bg-error/5 hover:bg-error/10 px-2.5 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Revert
                            </button>
                          )}
                        </div>
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

export default SalaryManagement;
