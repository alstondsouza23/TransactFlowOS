/**
 * src/components/KYCSubmitModal.jsx — Client
 *
 * Writes a NEW document to the `kyc_queue` Firestore collection.
 * The Employee Desktop reads from `kyc_queue` via onSnapshot.
 *
 * Also updates users/{uid} so the Client's own badge reflects instantly.
 */
import React, { useState } from 'react';
import {
  collection, addDoc, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db }          from '../lib/firebase';
import useAuthStore    from '../store/authStore';
import toast           from '../hooks/useToast';

// ── Masking helpers ────────────────────────────────────────────────
function maskPAN(pan) {
  const p = pan.replace(/\s/g, '').toUpperCase();
  if (p.length < 5) return p;
  return p.slice(0, 5) + '****' + p.slice(-1);
}
function maskBank(account) {
  const a = account.replace(/\s/g, '');
  if (a.length <= 4) return 'XXXX...' + a;
  return 'XXXX...' + a.slice(-4);
}

// ── Icon ──────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

export default function KYCSubmitModal({ onClose }) {
  const uid         = useAuthStore((s) => s.uid);
  const displayName = useAuthStore((s) => s.displayName) || '';
  const email       = useAuthStore((s) => s.email) || '';

  const [name,    setName]    = useState(displayName);
  const [phone,   setPhone]   = useState('');
  const [pan,     setPan]     = useState('');
  const [bank,    setBank]    = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim() && phone.trim().length >= 10 && pan.trim().length >= 5 && bank.trim().length >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !uid) return;
    setLoading(true);
    try {
      const maskedPAN  = maskPAN(pan);
      const maskedBank = maskBank(bank);

      // 1. Create a document in kyc_queue — Employee reads this
      await addDoc(collection(db, 'kyc_queue'), {
        // who submitted
        userId:      uid,
        user_uid:    uid,        // backward compat alias
        name:        name.trim(),
        email,
        phone:       phone.trim(),
        panMasked:   maskedPAN,
        bankMasked:  maskedBank,
        groupId:     'GRP-001',
        // KYC state
        status:      'Pending',
        submittedAt: serverTimestamp(),
      });

      // 2. Also update users/{uid} so the Dashboard badge reflects
      await setDoc(
        doc(db, 'users', uid),
        {
          name:        name.trim(),
          phone:       phone.trim(),
          panMasked:   maskedPAN,
          bankMasked:  maskedBank,
          kycStatus:   'Pending',
          userType:    'kyc_pending',
          groupId:     'GRP-001',
          kycSubmittedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success('KYC submitted! Your documents are under review. We\'ll notify you once verified.', 8000);
      onClose();
    } catch (err) {
      console.error('[KYC submit]', err);
      toast.error('Submission failed — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.iconWrap}><ShieldIcon /></div>
          <div>
            <h2 style={s.title}>Submit KYC Verification</h2>
            <p style={s.subtitle}>Fill in your identity details. All data is encrypted and reviewed by our compliance team.</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Notice */}
        <div style={s.notice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={s.noticeText}>PAN and bank details are stored masked — we never store your full numbers.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Full Name <span style={s.required}>*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="As on your PAN card" style={s.input} required />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Phone Number <span style={s.required}>*</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210" style={s.input} maxLength={15} required />
          </div>

          <div style={s.row2}>
            <div style={s.fieldGroup}>
              <label style={s.label}>PAN Card Number <span style={s.required}>*</span></label>
              <input type="text" value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F" style={s.input} maxLength={10} required />
              {pan.length >= 5 && (
                <span style={s.hint}>Stored as: <strong>{maskPAN(pan)}</strong></span>
              )}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Bank Account Number <span style={s.required}>*</span></label>
              <input type="text" value={bank}
                onChange={(e) => setBank(e.target.value.replace(/\D/g, ''))}
                placeholder="Account number" style={s.input} maxLength={18} required />
              {bank.length >= 4 && (
                <span style={s.hint}>Stored as: <strong>{maskBank(bank)}</strong></span>
              )}
            </div>
          </div>

          <div style={s.actions}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={!canSubmit || loading}
              style={{ ...s.submitBtn, opacity: (!canSubmit || loading) ? 0.5 : 1 }}>
              {loading ? 'Submitting…' : 'Submit KYC Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay:    { position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(6px)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  modal:      { background:'#ffffff', borderRadius:'24px', boxShadow:'0 24px 64px rgba(0,0,0,0.16)', width:'100%', maxWidth:'540px', padding:'36px', display:'flex', flexDirection:'column', gap:'24px', fontFamily:'"Plus Jakarta Sans", sans-serif', animation:'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)' },
  header:     { display:'flex', alignItems:'flex-start', gap:'16px' },
  iconWrap:   { width:'48px', height:'48px', background:'#eff6ff', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:      { fontSize:'18px', fontWeight:'800', color:'#1b3664', margin:'0 0 4px', lineHeight:'1.3' },
  subtitle:   { fontSize:'13px', color:'#64748b', margin:0, lineHeight:'1.6', fontWeight:'500' },
  closeBtn:   { marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:'8px', flexShrink:0, lineHeight:0 },
  notice:     { display:'flex', alignItems:'center', gap:'8px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'10px', padding:'10px 14px' },
  noticeText: { fontSize:'12px', fontWeight:'600', color:'#1d4ed8' },
  form:       { display:'flex', flexDirection:'column', gap:'20px' },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  fieldGroup: { display:'flex', flexDirection:'column', gap:'6px' },
  label:      { fontSize:'12px', fontWeight:'700', color:'#374151', textTransform:'uppercase', letterSpacing:'0.5px' },
  required:   { color:'#ef4444' },
  input:      { width:'100%', padding:'12px 14px', fontSize:'14px', fontWeight:'600', color:'#1e293b', border:'1.5px solid #e2e8f0', borderRadius:'12px', outline:'none', fontFamily:'"Plus Jakarta Sans", sans-serif', background:'#f8fafc', boxSizing:'border-box' },
  hint:       { fontSize:'11px', color:'#64748b', fontWeight:'500' },
  actions:    { display:'flex', gap:'12px', paddingTop:'8px' },
  cancelBtn:  { flex:1, padding:'13px', background:'none', border:'1.5px solid #e2e8f0', borderRadius:'12px', fontSize:'14px', fontWeight:'700', color:'#64748b', cursor:'pointer', fontFamily:'"Plus Jakarta Sans", sans-serif' },
  submitBtn:  { flex:2, padding:'13px', background:'linear-gradient(135deg, #1b3664, #2563eb)', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', color:'#ffffff', cursor:'pointer', fontFamily:'"Plus Jakarta Sans", sans-serif', boxShadow:'0 4px 16px rgba(37,99,235,0.3)', transition:'opacity 0.15s' },
};
