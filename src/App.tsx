import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  CreditCard,
  Plus,
  Search,
  LogOut,
  X,
  Trash2,
  Eye,
  TrendingUp,
  Clock,
  Loader2,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  School
} from "lucide-react";
import { supabase } from "./lib/supabase";

// --- Types ---
interface UserAccount {
  id: string;
  user_id_code: string;
  role: "admin" | "teacher" | "student";
  full_name: string;
  is_first_login: boolean;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class: string;
  gender: string;
  date_of_birth: string;
  avatar_url: string;
  fee_status: string;
}

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("samir_academy_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Modals
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState("");
  const [forgotReason, setForgotReason] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Admin Pending Resets
  const [pendingResets, setPendingResets] = useState<any[]>([]);
  const [showResetApprovalModal, setShowResetApprovalModal] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const id = loginId.trim();
    const pass = loginPassword.trim();

    // ১. Master Admin Fail-Safe (অ্যাডমিন যাতে কখনোই আটকে না যায়)
    if (id === "admin" && pass === "admin123") {
      const adminData: UserAccount = {
        id: "admin-master-id",
        user_id_code: "admin",
        role: "admin",
        full_name: "School Administrator",
        is_first_login: false
      };
      setCurrentUser(adminData);
      localStorage.setItem("samir_academy_user", JSON.stringify(adminData));
      setActiveTab("dashboard");
      setAuthLoading(false);
      return;
    }

    // ২. Database Query for Other Accounts
    try {
      const { data, error } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("user_id_code", id)
        .eq("password_hash", pass)
        .maybeSingle();

      if (error) {
        throw new Error(`Database Error: ${error.message}`);
      }

      if (!data) {
        throw new Error("Invalid User ID or Password! Please check again.");
      }

      setCurrentUser(data);
      localStorage.setItem("samir_academy_user", JSON.stringify(data));

      if (data.is_first_login) {
        setShowFirstLoginModal(true);
      }

      if (data.role === "student") setActiveTab("my-profile");
      else if (data.role === "teacher") setActiveTab("classes");
      else setActiveTab("dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Failed to login");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("samir_academy_user");
    setLoginId("");
    setLoginPassword("");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_accounts")
        .update({ password_hash: newPassword, is_first_login: false })
        .eq("id", currentUser?.id);

      if (error) throw error;
      alert("Password updated successfully!");
      setShowFirstLoginModal(false);
      if (currentUser) {
        const updated = { ...currentUser, is_first_login: false };
        setCurrentUser(updated);
        localStorage.setItem("samir_academy_user", JSON.stringify(updated));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update password");
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: user } = await supabase
        .from("user_accounts")
        .select("role")
        .eq("user_id_code", forgotId.trim())
        .maybeSingle();

      const { error } = await supabase.from("password_reset_requests").insert([
        {
          user_id_code: forgotId.trim(),
          role: user?.role || "student",
          reason: forgotReason.trim(),
          status: "pending"
        }
      ]);

      if (error) throw error;
      setForgotSuccess(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit reset request");
    }
  };

  const fetchPendingResets = async () => {
    if (currentUser?.role !== "admin") return;
    try {
      const { data } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });
      setPendingResets(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const approveReset = async (id: string, userCode: string) => {
    try {
      await supabase
        .from("user_accounts")
        .update({ password_hash: "123456", is_first_login: true })
        .eq("user_id_code", userCode);

      await supabase
        .from("password_reset_requests")
        .update({ status: "approved" })
        .eq("id", id);

      alert(`Password for ${userCode} reset to default: 123456`);
      fetchPendingResets();
    } catch (err: any) {
      alert("Error approving reset");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStudents();
      if (currentUser.role === "admin") {
        fetchPendingResets();
      }
    }
  }, [currentUser]);

  const quickLogin = (id: string, pass: string) => {
    setLoginId(id);
    setLoginPassword(pass);
  };

  // =========================================================================
  // VIEW 1: LOGIN PORTAL
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070d1c] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0a1226] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto shadow-xl shadow-amber-500/10 mb-4">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Samir Academy</h1>
            <p className="text-xs text-slate-400 mt-1">Multi-Role Academic ERP Portal</p>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">User ID / Admission / Teacher ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin, TCH-2026-001, SA-2026-001"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotSuccess(false);
                  setShowForgotModal(true);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 transition"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In to Portal"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("admin", "admin123")}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-amber-400 font-medium transition text-center cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin("TCH-2026-001", "123456")}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-blue-400 font-medium transition text-center cursor-pointer"
              >
                👨‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() => quickLogin("SA-2026-001", "123456")}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-emerald-400 font-medium transition text-center cursor-pointer"
              >
                🎓 Student
              </button>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Request approval from School Administrator</p>
                </div>
              </div>

              {forgotSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Request Submitted!</h4>
                  <p className="text-xs text-slate-400">
                    Administrator will review and approve your request. Once approved, your password will reset to: 123456.
                  </p>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your User ID / Admission No *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SA-2026-001 or TCH-2026-001"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note</label>
                    <textarea
                      placeholder="Forgot my password..."
                      value={forgotReason}
                      onChange={(e) => setForgotReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 h-20 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Submit Reset Request
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED PORTAL
  // =========================================================================
  const isRole = currentUser.role;

  return (
    <div className="flex h-screen bg-[#070d1c] text-slate-100 font-sans overflow-hidden">
      <aside className="w-64 bg-[#0a1226] border-r border-slate-800/80 flex flex-col justify-between select-none">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Samir Academy</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                isRole === "admin"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : isRole === "teacher"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}>
                {isRole} Portal
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-1 mt-2">
            {isRole === "admin" && (
              <>
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "students", label: "Students", icon: Users },
                  { id: "teachers", label: "Teachers", icon: UserCheck },
                  { id: "classes", label: "Classes", icon: BookOpen },
                  { id: "attendance", label: "Attendance", icon: CalendarCheck },
                  { id: "exams", label: "Exams", icon: FileText },
                  { id: "marks", label: "Marks", icon: Award },
                  { id: "fees", label: "Fees", icon: CreditCard }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </>
            )}

            {isRole === "teacher" && (
              <>
                {[
                  { id: "dashboard", label: "Teacher Dashboard", icon: LayoutDashboard },
                  { id: "classes", label: "My Classes", icon: BookOpen },
                  { id: "attendance", label: "Daily Attendance", icon: CalendarCheck },
                  { id: "marks", label: "Marks Entry", icon: Award }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </>
            )}

            {isRole === "student" && (
              <>
                {[
                  { id: "my-profile", label: "My Academic Profile", icon: User },
                  { id: "attendance", label: "My Attendance", icon: CalendarCheck },
                  { id: "marks", label: "My Marksheet & Result", icon: Award },
                  { id: "fees", label: "Tuition Fees", icon: CreditCard }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#080f20]/60">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate font-mono">{currentUser.user_id_code}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-[#0a1226]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">{isRole} Mode</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold capitalize text-amber-400">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            {isRole === "admin" && pendingResets.length > 0 && (
              <button
                onClick={() => setShowResetApprovalModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold animate-pulse cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {pendingResets.length} Reset Request Pending
              </button>
            )}

            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Academic Year 2026
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "students" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Student Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Samir Academy Student Records & Directory</p>
                </div>
                {isRole === "admin" && (
                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add Student
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-4 px-6">Photo</th>
                        <th className="py-4 px-4">Admission No</th>
                        <th className="py-4 px-4">Full Name</th>
                        <th className="py-4 px-4">Gender</th>
                        <th className="py-4 px-4">DOB</th>
                        <th className="py-4 px-4">Guardian Phone</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-6">
                            <img
                              src={student.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                              alt="Avatar"
                              className="w-10 h-12 object-cover rounded-lg border border-slate-700 shadow-sm"
                            />
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-amber-400">
                            {student.admission_number}
                          </td>
                          <td className="py-4 px-4 font-semibold text-white">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="py-4 px-4 capitalize">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                              student.gender === "male"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            }`}>
                              {student.gender}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400">{student.date_of_birth}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono">{(student as any).guardian_phone || "—"}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              title="View Profile"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer mr-1"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isRole === "admin" && (
                              <button
                                title="Delete"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: "Total Students", value: students.length, icon: Users, color: "text-amber-400", tab: "students" },
                  { label: "Total Teachers", value: "1", icon: UserCheck, color: "text-blue-400", tab: "teachers" },
                  { label: "Total Classes", value: "16", icon: BookOpen, color: "text-emerald-400", tab: "classes" },
                  { label: "Fees Collected", value: "৳ 1,500", icon: TrendingUp, color: "text-purple-400", tab: "fees" }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      onClick={() => isRole === "admin" && setActiveTab(stat.tab)}
                      className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-amber-500/40 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <p className="text-[11px] text-slate-500 mt-1">Click to view details</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "my-profile" && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
              <div className="flex items-center gap-5 border-b border-slate-800 pb-6">
                <div className="w-20 h-24 rounded-xl bg-slate-800 border border-amber-500/40 flex items-center justify-center text-slate-500 overflow-hidden">
                  <User className="w-10 h-10 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentUser.full_name}</h3>
                  <p className="text-sm font-mono text-amber-400 mt-0.5">ID: {currentUser.user_id_code}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Enrolled Student (Class 9 - A)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "students" && activeTab !== "dashboard" && activeTab !== "my-profile" && (
            <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white capitalize">{activeTab} Section</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Logged in as <b>{currentUser.full_name} ({isRole})</b>. Ready for next phase.
              </p>
            </div>
          )}
        </div>
      </main>

      {showFirstLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">First-Time Password Setup</h3>
                <p className="text-xs text-slate-400">Please change your default password to continue</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Secret Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Save New Password & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {showResetApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowResetApprovalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Pending Password Reset Requests</h3>
            <p className="text-xs text-slate-400 mb-4">Approving will reset their password to: 123456</p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingResets.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No pending requests.</p>
              ) : (
                pendingResets.map((req) => (
                  <div key={req.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{req.user_id_code} ({req.role})</p>
                      <p className="text-xs text-slate-400 mt-0.5">{req.reason || "No reason given"}</p>
                    </div>
                    <button
                      onClick={() => approveReset(req.id, req.user_id_code)}
                      className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Approve Reset
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
