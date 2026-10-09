import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Icon, BtnPrimary } from './Ui.jsx';

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

  const inputClass = 'w-full px-3 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none';
  const labelClass = 'block text-sm font-semibold text-ink mb-1';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Hồ sơ cá nhân</h1>
        <p className="text-sm text-ink-faint mt-1">Cập nhật thông tin và thay đổi mật khẩu của bạn.</p>
      </div>

      {/* Profile update */}
      <div className="bg-surface-raised rounded-card border border-line p-6 space-y-4">
        <h2 className="font-extrabold text-ink inline-flex items-center gap-2">
          <Icon name="UserCircle" size={18} />
          Thông tin cá nhân
        </h2>
        <div>
          <label className={labelClass}>Họ tên</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input value={user?.email || ''} disabled className={inputClass + ' bg-bone-100 text-ink-soft'} />
        </div>
        <div>
          <label className={labelClass}>Số điện thoại</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0912345678" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Địa chỉ giao hàng</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="12 Le Loi, Q1, TP.HCM" className={inputClass} />
        </div>
        {profileMsg && <div className="text-sm text-emerald-700 inline-flex items-center gap-1.5"><Icon name="CheckCircle" size={16} />{profileMsg}</div>}
        {profileError && <div className="text-sm text-rose-600">{profileError}</div>}
        <BtnPrimary onClick={saveProfile}>Lưu thay đổi</BtnPrimary>
      </div>

      {/* Change password */}
      <div className="bg-surface-raised rounded-card border border-line p-6 space-y-4">
        <h2 className="font-extrabold text-ink inline-flex items-center gap-2">
          <Icon name="NotePencil" size={18} />
          Đổi mật khẩu
        </h2>
        <div>
          <label className={labelClass}>Mật khẩu hiện tại</label>
          <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mật khẩu mới</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Xác nhận mật khẩu mới</label>
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputClass} />
        </div>
        {passMsg && <div className="text-sm text-emerald-700 inline-flex items-center gap-1.5"><Icon name="CheckCircle" size={16} />{passMsg}</div>}
        {passError && <div className="text-sm text-rose-600">{passError}</div>}
        <BtnPrimary onClick={changePassword}>Đổi mật khẩu</BtnPrimary>
      </div>
    </div>
  );
}