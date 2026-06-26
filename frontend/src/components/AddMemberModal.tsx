import React, { useState, useEffect } from 'react';
import api from '../api/axios';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | number;
  onSuccess: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, siteId, onSuccess }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allEngAssignments, setAllEngAssignments] = useState<any[]>([]);
  const [allEmpAssignments, setAllEmpAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedIds([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const [usersRes, engineersRes, employeesRes] = await Promise.all([
        api.get('/users/'),
        api.get(`/sites/assignments/engineers/`),
        api.get(`/sites/assignments/`)
      ]);
      
      const allUsers = Array.isArray(usersRes.data.results) ? usersRes.data.results : (Array.isArray(usersRes.data) ? usersRes.data : []);
      setUsers(allUsers.filter((u: any) => u.role === 'SITE_ENGINEER' || u.role === 'EMPLOYEE'));

      const engList = Array.isArray(engineersRes.data.results) ? engineersRes.data.results : (Array.isArray(engineersRes.data) ? engineersRes.data : []);
      const empList = Array.isArray(employeesRes.data.results) ? employeesRes.data.results : (Array.isArray(employeesRes.data) ? employeesRes.data : []);
      
      setAllEngAssignments(engList);
      setAllEmpAssignments(empList);

    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      for (const userId of selectedIds) {
        const user = users.find(u => String(u.id) === String(userId));
        if (!user) continue;

        if (user.role === 'SITE_ENGINEER') {
          await api.post('/sites/assignments/engineers/', {
            site: siteId,
            user: user.id,
            start_date: new Date().toISOString().split('T')[0]
          });
        } else {
          await api.post('/sites/assignments/', {
            site: siteId,
            user: user.id
          });
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to assign members.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest shrink-0">
          <h2 className="text-title-md font-bold text-text-main">Add Team Members</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 border-b border-border-subtle bg-white shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
            <input 
              type="text" 
              placeholder="Search by name or department..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-bright">
          {users.length === 0 ? (
            <p className="text-center text-text-muted p-4">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-text-muted p-4">No users found matching "{searchQuery}"</p>
          ) : (
            filteredUsers.map(u => {
              let isAssignedToThisSite = false;
              let isAssignedElsewhere = false;
              let assignedProjectName = '';
              const today = new Date().toISOString().split('T')[0];

              if (u.role === 'SITE_ENGINEER') {
                const activeAssignments = allEngAssignments.filter((a: any) => 
                  (String(a.user) === String(u.id) || String(a.user?.id) === String(u.id)) && 
                  (!a.end_date || a.end_date >= today)
                );
                isAssignedToThisSite = activeAssignments.some(a => String(a.site?.id || a.site) === String(siteId));
                const elsewhereAssignment = activeAssignments.find(a => String(a.site?.id || a.site) !== String(siteId));
                if (elsewhereAssignment) {
                  isAssignedElsewhere = true;
                  assignedProjectName = elsewhereAssignment.site_name || elsewhereAssignment.site?.name || 'Another Project';
                }
              } else {
                const activeAssignments = allEmpAssignments.filter((a: any) => 
                  (String(a.user) === String(u.id) || String(a.user?.id) === String(u.id)) && 
                  a.is_active !== false
                );
                isAssignedToThisSite = activeAssignments.some(a => String(a.site?.id || a.site) === String(siteId));
                const elsewhereAssignment = activeAssignments.find(a => String(a.site?.id || a.site) !== String(siteId));
                if (elsewhereAssignment) {
                  isAssignedElsewhere = true;
                  assignedProjectName = elsewhereAssignment.site?.name || 'Another Project';
                }
              }

              const isAssignedAnywhere = isAssignedToThisSite || isAssignedElsewhere;

              return (
                <label key={u.id} className={`flex items-center gap-4 p-4 border border-border-subtle rounded-xl transition-colors ${isAssignedAnywhere ? 'bg-surface-container-lowest opacity-60 cursor-not-allowed' : 'hover:bg-surface-container-low cursor-pointer bg-white'}`}>
                  <input 
                    type="checkbox" 
                    disabled={isAssignedAnywhere}
                    checked={isAssignedToThisSite || selectedIds.includes(String(u.id))}
                    onChange={(e) => {
                      if (isAssignedAnywhere) return;
                      if (e.target.checked) setSelectedIds([...selectedIds, String(u.id)]);
                      else setSelectedIds(selectedIds.filter(id => id !== String(u.id)));
                    }}
                    className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <p className="text-body-md font-bold text-text-main flex items-center gap-2">
                      {u.full_name} 
                      {!isAssignedAnywhere && <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-bold border border-orange-200">Idle</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{u.department || 'No Department'}</p>
                      {isAssignedToThisSite && <span className="text-[10px] text-primary font-bold">(Assigned Here)</span>}
                      {isAssignedElsewhere && <span className="text-[10px] text-error font-bold" title={assignedProjectName}>(Assigned to: {assignedProjectName})</span>}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 bg-surface-container-high rounded text-text-muted">
                    {u.role === 'SITE_ENGINEER' ? 'ENGINEER' : 'WORKFORCE'}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-border-subtle bg-white shrink-0">
          <button 
            onClick={handleAssign} 
            disabled={loading || selectedIds.length === 0}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Assigning...' : `Assign ${selectedIds.length > 0 ? selectedIds.length : ''} Members`}
          </button>
        </div>

      </div>
    </>
  );
};

export default AddMemberModal;
