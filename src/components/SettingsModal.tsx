import React, { useState } from 'react';
import { X, User, KeyRound, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api, AuthUser } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete account fields
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      const updated = await api.updateProfile(displayName.trim());
      onUserUpdated(updated);
      setProfileMsg('Display name updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch {
      setProfileMsg('Failed to update display name.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must be at least 8 characters with at least one letter and one number');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount(deleteConfirmation);
      onClose();
      onLogout();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Account deletion failed');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Host Account Settings</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Name */}
          <form onSubmit={handleUpdateProfile} className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>Host Display Name</span>
            </h3>
            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            {profileMsg && <p className="text-xs text-emerald-400">{profileMsg}</p>}
            <button
              type="submit"
              disabled={updatingProfile}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {updatingProfile ? 'Saving...' : 'Update Name'}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleUpdatePassword} className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Change Password</span>
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">New Password (8+ chars, 1 letter + 1 number)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            {passwordError && <p className="text-xs text-rose-400">{passwordError}</p>}
            {passwordMsg && <p className="text-xs text-emerald-400">{passwordMsg}</p>}
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {updatingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>

          {/* Log out from all devices */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Log Out from All Devices</h4>
              <p className="text-xs text-slate-400">Invalidate active sessions on all other browsers.</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Log Out All
            </button>
          </div>

          {/* Delete Account */}
          <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Danger Zone: Delete Account</span>
            </h3>
            <p className="text-xs text-slate-300">
              Permanently removes your account, all quizzes created by you, past games, and player results. Type <strong className="text-white">DELETE</strong> to confirm.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="flex-1 bg-slate-900 border border-rose-500/40 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                disabled={deleting || deleteConfirmation !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
            {deleteError && <p className="text-xs text-rose-400">{deleteError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
