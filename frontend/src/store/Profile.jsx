import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    try {
      await api.updateProfile({ name, phone, address });
      setProfileMsg('Đã cập nhật hồ sơ thành công!');
    } catch (err) {
      setProfileError(err.message);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPassMsg('');
    setPassError('');
    if (newPass !== confirmPass) {
      setPassError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      await api.changePassword({ oldPassword: oldPass, newPassword: newPass });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setPassMsg('Đã đổi mật khẩu thành công!');
    } catch (err) {
      setPassError(err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin và thay đổi mật khẩu của bạn.</p>
      </div>

      {/* Profile update */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Thông tin cá nhân</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <input value={user?.email || ''} disabled className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="0912345678"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ giao hàng</label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="12 Le Loi, Q1, TP.HCM"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        {profileMsg && <div className="text-sm text-emerald-600">{profileMsg}</div>}
        {profileError && <div className="text-sm text-rose-600">{profileError}</div>}
        <button onClick={saveProfile} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
          Lưu thay đổi
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Đổi mật khẩu</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={oldPass}
            onChange={e => setOldPass(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
          <input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        {passMsg && <div className="text-sm text-emerald-600">{passMsg}</div>}
        {passError && <div className="text-sm text-rose-600">{passError}</div>}
        <button onClick={changePassword} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
          Đổi mật khẩu
        </button>
      </div>
    </div>
  );
}