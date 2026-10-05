import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Package,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile, Listing, Report, StudentVerification } from '@/types';
import { formatPrice, formatDate, cn, statusColor } from '@/utils/helpers';
import { detectSuspiciousListing } from '@/utils/ai';

type AdminTab = 'overview' | 'users' | 'listings' | 'reports' | 'verifications' | 'flagged';

export function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<StudentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ users: 0, listings: 0, reports: 0, pendingVerifications: 0, activeListings: 0 });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [usersRes, listingsRes, reportsRes, verifRes, activeRes, pendingVerifRes, reportsPendingRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('listings').select('*, category:categories(*), seller:profiles(*)').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, listing:listings(*), reporter:profiles(*)').order('created_at', { ascending: false }),
        supabase.from('student_verifications').select('*, user:profiles(*)').order('submitted_at', { ascending: false }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('student_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setUsers((usersRes.data as Profile[]) || []);
      setListings((listingsRes.data as unknown as Listing[]) || []);
      setReports((reportsRes.data as unknown as Report[]) || []);
      setVerifications((verifRes.data as unknown as StudentVerification[]) || []);
      setStats({
        users: usersRes.data?.length || 0,
        listings: listingsRes.data?.length || 0,
        reports: reportsPendingRes.count || 0,
        pendingVerifications: pendingVerifRes.count || 0,
        activeListings: activeRes.count || 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyUser(userId: string, status: string) {
    await supabase.from('student_verifications').update({ status, reviewed_at: new Date().toISOString() }).eq('user_id', userId);
    await supabase.from('profiles').update({ verification_status: status }).eq('id', userId);
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'verification',
      title: status === 'verified' ? 'You are now a verified student!' : 'Verification rejected',
      body: status === 'verified' ? 'Your student status has been confirmed.' : 'Your verification was not approved. Please try again.',
      link: '/profile',
    });
    loadAll();
  }

  async function updateListingStatus(listingId: string, status: string) {
    await supabase.from('listings').update({ status }).eq('id', listingId);
    loadAll();
  }

  async function deleteListing(listingId: string) {
    if (!confirm('Delete this listing permanently?')) return;
    await supabase.from('listings').delete().eq('id', listingId);
    loadAll();
  }

  async function updateReportStatus(reportId: string, status: string) {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    loadAll();
  }

  async function suspendUser(userId: string, suspend: boolean) {
    // In a real app, we'd use auth admin API. Here we update the profile role.
    if (suspend) {
      await supabase.from('profiles').update({ verification_status: 'rejected' }).eq('id', userId);
    } else {
      await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', userId);
    }
    loadAll();
  }

  // Flagged listings
  const flaggedListings = listings.filter((l) => {
    const flags = detectSuspiciousListing(l.title, l.description, l.price, l.images, l.category_id);
    return flags.flagged;
  });

  const filteredUsers = users.filter((u) =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="container-max px-4 py-8"><div className="card h-96 animate-pulse" /></div>;
  }

  const tabs: { key: AdminTab; label: string; icon: LucideIcon; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'listings', label: 'Listings', icon: Package },
    { key: 'flagged', label: 'Flagged', icon: AlertTriangle, badge: flaggedListings.length },
    { key: 'reports', label: 'Reports', icon: Flag, badge: stats.reports },
    { key: 'verifications', label: 'Verifications', icon: ShieldCheck, badge: stats.pendingVerifications },
  ];

  return (
    <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-navy-900 flex items-center gap-2">
          <ShieldCheck size={28} className="text-red-500" /> Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Manage users, listings, reports, and verifications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              tab === t.key ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={16} /> {t.label}
            {t.badge ? <span className="badge bg-red-100 text-red-600">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AdminStat icon={Users} label="Total Users" value={stats.users} color="text-navy-600 bg-navy-50" />
            <AdminStat icon={Package} label="Total Listings" value={stats.listings} color="text-emerald-600 bg-emerald-50" />
            <AdminStat icon={ShieldCheck} label="Pending Verifications" value={stats.pendingVerifications} color="text-amber-600 bg-amber-50" />
            <AdminStat icon={Flag} label="Pending Reports" value={stats.reports} color="text-red-600 bg-red-50" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Recent Users</h3>
              <div className="space-y-2">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-xs font-semibold">
                      {u.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 truncate">{u.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className={cn('badge text-xs', statusColor(u.verification_status))}>{u.verification_status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Recent Listings</h3>
              <div className="space-y-2">
                {listings.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center gap-3 text-sm">
                    <Link to={`/item/${l.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 hover:text-navy-600 truncate">{l.title}</p>
                      <p className="text-xs text-slate-400">{formatPrice(l.price)} • {formatDate(l.created_at)}</p>
                    </Link>
                    <span className={cn('badge text-xs', statusColor(l.status))}>{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div className="relative mb-4 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">College</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Joined</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-400 to-brand-500 flex items-center justify-center text-white text-xs font-semibold">
                            {u.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{u.full_name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 hidden sm:table-cell">{u.college || '—'}</td>
                      <td className="p-3">
                        <span className={cn('badge text-xs', statusColor(u.verification_status))}>{u.verification_status}</span>
                      </td>
                      <td className="p-3 text-slate-500 hidden sm:table-cell">{formatDate(u.created_at)}</td>
                      <td className="p-3 text-right">
                        {u.verification_status !== 'rejected' ? (
                          <button onClick={() => suspendUser(u.id, true)} className="text-xs text-red-500 hover:underline">Suspend</button>
                        ) : (
                          <button onClick={() => suspendUser(u.id, false)} className="text-xs text-emerald-500 hover:underline">Restore</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      {tab === 'listings' && (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card p-4 flex items-center gap-4">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-navy-50 flex items-center justify-center text-navy-200 font-bold">{l.title.charAt(0)}</div>
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/item/${l.id}`} className="font-medium text-slate-800 hover:text-navy-600 truncate block">{l.title}</Link>
                <p className="text-sm text-slate-500">{formatPrice(l.price)} • {l.seller?.full_name}</p>
              </div>
              <span className={cn('badge text-xs', statusColor(l.status))}>{l.status}</span>
              <div className="flex items-center gap-1">
                <Link to={`/item/${l.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Eye size={16} /></Link>
                {l.status === 'active' && (
                  <button onClick={() => updateListingStatus(l.id, 'paused')} className="p-2 rounded-lg hover:bg-amber-50 text-amber-500" title="Pause"><XCircle size={16} /></button>
                )}
                <button onClick={() => deleteListing(l.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flagged */}
      {tab === 'flagged' && (
        <div className="space-y-3">
          {flaggedListings.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-slate-500">No flagged listings. All clear!</p>
            </div>
          ) : (
            flaggedListings.map((l) => {
              const flags = detectSuspiciousListing(l.title, l.description, l.price, l.images, l.category_id);
              return (
                <div key={l.id} className="card p-4 border-l-4 border-l-amber-400">
                  <div className="flex items-start gap-4">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-amber-50 flex items-center justify-center text-amber-200 font-bold">{l.title.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={`/item/${l.id}`} className="font-medium text-slate-800 hover:text-navy-600">{l.title}</Link>
                      <p className="text-sm text-slate-500">{formatPrice(l.price)} • {l.seller?.full_name}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {flags.reasons.map((reason, i) => (
                          <span key={i} className="badge bg-amber-50 text-amber-600 text-xs">
                            <AlertTriangle size={10} /> {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={cn('badge text-xs', `bg-${flags.severity === 'high' ? 'red' : 'amber'}-100 text-${flags.severity === 'high' ? 'red' : 'amber'}-700`)}>
                      {flags.severity}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="card p-8 text-center">
              <Flag size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No reports submitted.</p>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-slate-800">{r.reason}</p>
                    {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
                  </div>
                  <span className={cn('badge text-xs', statusColor(r.status))}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>By: {r.reporter?.full_name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{formatDate(r.created_at)}</span>
                  {r.listing && <Link to={`/item/${r.listing_id}`} className="text-navy-600 hover:underline">View Listing</Link>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateReportStatus(r.id, 'resolved')} className="btn-primary text-xs">Resolve</button>
                    <button onClick={() => updateReportStatus(r.id, 'reviewed')} className="btn-ghost text-xs">Mark Reviewed</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Verifications */}
      {tab === 'verifications' && (
        <div className="space-y-3">
          {verifications.length === 0 ? (
            <div className="card p-8 text-center">
              <ShieldCheck size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No verification requests.</p>
            </div>
          ) : (
            verifications.map((v) => (
              <div key={v.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{v.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{v.college}</p>
                    <p className="text-xs text-slate-400 mt-1">Student ID: {v.student_id_reference} • Submitted: {formatDate(v.submitted_at)}</p>
                    {v.college_email && <p className="text-xs text-slate-400">College Email: {v.college_email}</p>}
                  </div>
                  <span className={cn('badge text-xs', statusColor(v.status))}>{v.status}</span>
                </div>
                {v.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => verifyUser(v.user_id, 'verified')} className="btn-primary text-xs">
                      <UserCheck size={14} /> Approve
                    </button>
                    <button onClick={() => verifyUser(v.user_id, 'rejected')} className="btn-ghost text-xs text-red-500">
                      <UserX size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: string }) {
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={22} />
      </div>
      <p className="font-display font-bold text-2xl text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
