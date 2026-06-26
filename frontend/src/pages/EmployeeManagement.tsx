import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import EmployeeModal from '../components/EmployeeModal';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  mobile_number: string;
  email: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
}

const EmployeeManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/?page_size=100');
      const employeesData = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchEmployees();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAdd = () => {
    setSelectedEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/users/${id}/`);
        fetchEmployees();
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete employee.");
      }
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchRole = roleFilter ? emp.role === roleFilter : true;
    let matchStatus = true;
    if (statusFilter === 'Active') matchStatus = emp.is_active === true;
    if (statusFilter === 'Inactive') matchStatus = emp.is_active === false;
    return matchRole && matchStatus;
  });

  return (
    <div className="p-container-padding bg-white/50 space-y-6 h-full flex flex-col">
      {/* Page Header & Filter Bar */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-text-muted mb-2">
            <span>Workforce</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-medium">Employee Directory</span>
          </nav>
          <h2 className="text-display font-display text-on-surface">Employee Management</h2>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-secondary text-on-primary px-6 py-2.5 rounded-xl font-bold shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-all">
          <span className="material-symbols-outlined">person_add</span>
          <span>Add Employee</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-border-subtle rounded-xl shadow-[0px_4px_6px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <span className="text-label-sm uppercase tracking-wider text-text-muted px-1">Role</span>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-body-md border-border-subtle rounded-lg bg-surface-container-low focus:border-primary focus:ring-0 transition-colors"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="SITE_ENGINEER">Site Engineer</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <span className="text-label-sm uppercase tracking-wider text-text-muted px-1">Status</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-body-md border-border-subtle rounded-lg bg-surface-container-low focus:border-primary focus:ring-0 transition-colors"
          >
            <option value="">Any Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-auto ml-auto flex gap-2">
          <button 
            onClick={() => { setRoleFilter(''); setStatusFilter(''); }}
            className="px-4 py-2 text-body-md font-medium text-text-muted hover:bg-surface-container-low rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-white border border-border-subtle rounded-xl shadow-sm flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-sticky-header">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-lowest">
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold">Profile</th>
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold">Employee Name</th>
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold">Mobile</th>
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold">Role</th>
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold">Status</th>
                  <th className="px-6 py-4 text-label-sm uppercase tracking-widest text-text-muted font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-text-muted">Loading employees...</td>
                  </tr>
                ) : (Array.isArray(filteredEmployees) ? filteredEmployees : []).map(emp => (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                        {(emp.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-title-lg text-on-surface font-semibold">{emp.full_name}</span>
                        <span className="text-label-md text-text-muted">{emp.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{emp.mobile_number}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-surface-container text-label-sm font-bold text-on-surface-variant">{emp.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.is_active ? (
                        emp.current_assignment_name ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-active/10 text-status-active text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-active shrink-0"></span> <span className="truncate max-w-[150px]" title={emp.current_assignment_name}>{emp.current_assignment_name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-label-sm font-bold">
                            Idle
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-surface-variant/10 text-on-surface-variant text-label-sm font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant shrink-0"></span> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(emp); }} 
                          className="text-primary font-bold text-label-md hover:underline underline-offset-4"
                        >Edit</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }} 
                          className="text-error font-bold text-label-md hover:underline underline-offset-4"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-text-muted">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-surface-container-lowest">
            <span className="text-label-md text-text-muted">Showing {filteredEmployees.length} employees</span>
          </div>
        </div>
      </div>
      
      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchEmployees}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default EmployeeManagement;
