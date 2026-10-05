import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  Phone,
  Star,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/helpers';
import type { StudentVerification } from '@/types';

export function ProfilePage() {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verification, setVerification] = useState<StudentVerification | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '', college: '', department: '', year_of_study: '', phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifyForm, setVerifyForm] = useState({ college: '', studentId: '', collegeEmail: '' });
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name,
      college: profile.college || '',
      department: profile.department || '',
      year_of_study: profile.year_of_study || '',
      phone: profile.phone || '',
    });
    async function loadVerification() {
      const { data } = await supabase
        .from('student_verifications')
        .select('*')
        .eq('user_id', profile!.id)
        .order('submitted_at', { ascending: false })
        .maybeSingle();
      setVerification(data as StudentVerification | null);
      if (data) setVerifyForm({
        college: data.college,
        studentId: data.student_id_reference,
        collegeEmail: data.college_email || '',
      });
    }
    loadVerification();
  }, [profile]);

  async function handleSaveEdit() {
    setError('');
    const { error } = await updateProfile({
      full_name: editForm.full_name,
      college: editForm.college,
      department: editForm.department,
      year_of_study: editForm.year_of_study,
      phone: editForm.phone,
    });
    if (error) {
      setError(error);
    } else {
      setSuccess('Profile updated successfully!');
      setEditing(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setVerifyLoading(true);
    setError('');
    try {
      // Delete existing pending verification if any
      if (verification) {
        await supabase.from('student_verifications').delete().eq('id', verification.id);
      }
      const { error } = await supabase.from('student_verifications').insert({
        user_id: profile.id,
        college: verifyForm.college,
        student_id_reference: verifyForm.studentId,
        college_email: verifyForm.collegeEmail || null,
      });
      if (error) throw error;
      await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', profile.id);
      await refreshProfile();
      setSuccess('Verification submitted! An admin will review it shortly.');
      setVerifyOpen(false);
      // Reload verification
      const { data } = await supabase.from('student_verifications').select('*').eq('user_id', profile.id).order('submitted_at', { ascending: false }).maybeSingle();
      setVerification(data as StudentVerification | null);
    } catch {
      setError('Failed to submit verification.');
    }
    setVerifyLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await updateProfile({ profile_image: dataUrl });
      if (error) setError('Failed to update profile image.');
    };
    reader.readAsDataURL(file);
  }

  if (!profile) return null;

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="card overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-br from-navy-600 to-brand-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-navy-500 to-brand-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {profile.full_name.charAt(0)}
                </div>
              )}
              <label className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50">
                <Camera size={14} className="text-slate-600" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
              <Edit2 size={16} /> Edit Profile
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-2xl text-navy-900">{profile.full_name}</h1>
            {profile.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                <ShieldCheck size={14} /> Verified Student
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{profile.email}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="font-display font-bold text-xl text-navy-700">{profile.items_sold}</p>
              <p className="text-xs text-slate-500">Items Sold</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl text-navy-700">{profile.items_bought}</p>
              <p className="text-xs text-slate-500">Items Bought</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl text-navy-700 flex items-center justify-center gap-1">
                {profile.rating > 0 ? (
                  <><Star size={16} className="fill-amber-400 text-amber-400" /> {profile.rating.toFixed(1)}</>
                ) : '—'}
              </p>
              <p className="text-xs text-slate-500">Rating</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl text-navy-700">{formatDate(profile.created_at)}</p>
              <p className="text-xs text-slate-500">Joined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">College</label>
                <input type="text" value={editForm.college} onChange={(e) => setEditForm({ ...editForm, college: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Department</label>
                <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Year of Study</label>
                <select value={editForm.year_of_study} onChange={(e) => setEditForm({ ...editForm, year_of_study: e.target.value })} className="input">
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <InfoRow icon={User} label="Name" value={profile.full_name} />
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow icon={Building2} label="College" value={profile.college || 'Not set'} />
              <InfoRow icon={GraduationCap} label="Department" value={profile.department || 'Not set'} />
              <InfoRow icon={Calendar} label="Year" value={profile.year_of_study || 'Not set'} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone || 'Not set'} />
            </div>
          )}
        </div>

        {/* Verification Card */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" /> Student Verification
          </h3>
          {profile.verification_status === 'verified' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>
              <p className="font-medium text-emerald-600">Verified Student</p>
              <p className="text-xs text-slate-500 mt-1">Your student status is confirmed.</p>
            </div>
          ) : verification?.status === 'pending' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Calendar size={32} className="text-amber-600" />
              </div>
              <p className="font-medium text-amber-600">Verification Pending</p>
              <p className="text-xs text-slate-500 mt-1">An admin is reviewing your submission.</p>
            </div>
          ) : verification?.status === 'rejected' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <X size={32} className="text-red-600" />
              </div>
              <p className="font-medium text-red-600">Verification Rejected</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">Your submission was not approved. Please try again.</p>
              <button onClick={() => setVerifyOpen(true)} className="btn-primary text-sm">Submit Again</button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">Verify your student status to build trust with buyers and sellers.</p>
              <button onClick={() => setVerifyOpen(true)} className="btn-primary text-sm">
                <ShieldCheck size={16} /> Get Verified
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setVerifyOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-navy-900">Student Verification</h2>
              <button onClick={() => setVerifyOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="label">College Name</label>
                <input type="text" value={verifyForm.college} onChange={(e) => setVerifyForm({ ...verifyForm, college: e.target.value })} required placeholder="Your College" className="input" />
              </div>
              <div>
                <label className="label">Student ID</label>
                <input type="text" value={verifyForm.studentId} onChange={(e) => setVerifyForm({ ...verifyForm, studentId: e.target.value })} required placeholder="Your student ID number" className="input" />
                <p className="text-xs text-slate-400 mt-1">This is kept private and never shown publicly.</p>
              </div>
              <div>
                <label className="label">College Email (optional)</label>
                <input type="email" value={verifyForm.collegeEmail} onChange={(e) => setVerifyForm({ ...verifyForm, collegeEmail: e.target.value })} placeholder="you@college.edu" className="input" />
              </div>
              <button type="submit" disabled={verifyLoading} className="btn-primary w-full">
                {verifyLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit for Verification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
