import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Power, 
  KeyRound, Edit3, Search, Filter, RefreshCw, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { Modal, LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const Employees = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    role_id: 2,
    department: 'Urban Traffic Enforcement Division',
    status: 'ACTIVE'
  });

  // Edit Employee Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role_id: 2,
    department: '',
    status: 'ACTIVE'
  });

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState(null);

  const fetchData = async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/roles')
      ]);
      setEmployees(empRes.data);
      setRoles(roleRes.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', addForm);
      setIsAddModalOpen(false);
      setAddForm({
        employee_id: '',
        name: '',
        email: '',
        password: '',
        role_id: 2,
        department: 'Urban Traffic Enforcement Division',
        status: 'ACTIVE'
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create employee account');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedUser.user_id}`, editForm);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.user_id === currentUser.user_id) {
      alert('Cannot deactivate your own active admin account.');
      return;
    }

    try {
      await api.put(`/employees/${user.user_id}/status`);
      fetchData();
    } catch (err) {
      alert('Error toggling account status');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/employees/${resetTargetUser.user_id}/reset-password`, {
        new_password: newPassword
      });
      setIsResetModalOpen(false);
      setNewPassword('');
      alert(`Password successfully reset for Officer ID ${resetTargetUser.employee_id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      department: user.department,
      status: user.status
    });
    setIsEditModalOpen(true);
  };

  const openResetModal = (user) => {
    setResetTargetUser(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return <LoadingSpinner text="Querying Authorized Personnel Directory..." />;
  }

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Authorized Personnel & Role Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin access control, officer ID provisioning, role assignments, and security lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn btn-secondary btn-sm flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Officer Account</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search officer ID, name, or division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-9 text-xs py-2"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Authorized Accounts: <span className="text-cyan-400 font-bold">{employees.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Officer Name</th>
              <th>Department / Division</th>
              <th>System Role</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th>Last Active</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.user_id}>
                <td>
                  <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                    {emp.employee_id}
                  </span>
                </td>

                <td>
                  <div className="font-semibold text-slate-200 text-xs">{emp.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{emp.email}</div>
                </td>

                <td className="text-xs text-slate-300">{emp.department}</td>

                <td>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    emp.role?.role_name === 'ADMIN'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                      : emp.role?.role_name === 'TRAFFIC_OFFICER'
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800/80'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  }`}>
                    {emp.role?.role_name || 'OPERATOR'}
                  </span>
                </td>

                <td>
                  <StatusBadge status={emp.status} />
                </td>

                <td className="text-xs font-mono text-slate-400">
                  {new Date(emp.created_at).toLocaleDateString()}
                </td>

                <td className="text-xs font-mono text-slate-400">
                  {emp.last_login ? new Date(emp.last_login).toLocaleString() : 'Never'}
                </td>

                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openResetModal(emp)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                      title="Reset Officer Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Officer Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`p-1.5 rounded transition-colors ${
                        emp.status === 'ACTIVE'
                          ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-400'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400'
                      }`}
                      title={emp.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision Officer Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision Authorized Officer / Employee Account"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Employee / Officer ID</label>
              <input
                type="text"
                placeholder="e.g. TP-2026-1042"
                value={addForm.employee_id}
                onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })}
                className="form-input font-mono text-xs"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Inspector Suresh Menon"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                placeholder="officer@traffic.gov.in"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Assigned Role</label>
              <select
                value={addForm.role_id}
                onChange={(e) => setAddForm({ ...addForm, role_id: Number(e.target.value) })}
                className="form-select text-xs"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department / Division</label>
              <input
                type="text"
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Provision Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Officer Profile: ${selectedUser?.employee_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="form-input text-xs"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="form-input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                value={editForm.role_id}
                onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                className="form-select text-xs"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${resetTargetUser?.employee_id}`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            Enter a new secure temporary password for Officer <strong>{resetTargetUser?.name}</strong> ({resetTargetUser?.employee_id}).
          </p>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm font-bold">
              Confirm Reset
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Employees;
