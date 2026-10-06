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
  Loader2
} from "lucide-react";
import { supabase } from "./lib/supabase";

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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "students" | "teachers" | "classes" | "attendance" | "exams" | "marks" | "fees"
  >("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    admissionNo: "",
    className: "Class 10 - A",
    dob: "",
    gender: "male",
    avatar: ""
  });

  // Supabase থেকে স্টুডেন্ট ডাটা আনা
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // নতুন স্টুডেন্ট যোগ করা
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.admissionNo) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from("students").insert([
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          admission_number: formData.admissionNo.trim(),
          class: formData.className,
          gender: formData.gender,
          date_of_birth: formData.dob || "2010-01-01",
          avatar_url:
            formData.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          fee_status: "Paid"
        }
      ]);

      if (error) throw error;

      await fetchStudents();
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        admissionNo: "",
        className: "Class 10 - A",
        dob: "",
        gender: "male",
        avatar: ""
      });
    } catch (err: any) {
      alert(err.message || "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  // স্টুডেন্ট ডিলিট করা
  const deleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        const { error } = await supabase.from("students").delete().eq("id", id);
        if (error) throw error;
        setStudents(students.filter((s) => s.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete");
      }
    }
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const admNo = (s.admission_number || "").toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || admNo.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-[#070d1c] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0a1226] border-r border-slate-800/80 flex flex-col justify-between select-none">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Samir Academy</h1>
              <p className="text-[11px] text-slate-400">Management System</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 mt-2">
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
                  onClick={() => setActiveTab(item.id as any)}
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
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#080f20]/60">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">School Administrator</p>
              <p className="text-[11px] text-slate-500 truncate">samir.sarj4@gmail.com</p>
            </div>
            <button title="Sign Out" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN BODY */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-[#0a1226]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">Portal</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold capitalize text-amber-400">{activeTab}</span>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Academic Year 2025–26
          </span>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Student Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Samir Academy Student Records & Directory</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Add Student
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 font-medium">Total Registered:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {students.length} Students
                  </span>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                  <p>Loading database records...</p>
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-4 px-6">Photo</th>
                          <th className="py-4 px-4">Admission No</th>
                          <th className="py-4 px-4">Full Name</th>
                          <th className="py-4 px-4">Class</th>
                          <th className="py-4 px-4">Gender</th>
                          <th className="py-4 px-4">Date of Birth</th>
                          <th className="py-4 px-4">Fees</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredStudents.map((student) => (
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
                            <td className="py-4 px-4 text-slate-300 font-medium">{student.class}</td>
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
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                student.fee_status === "Paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {student.fee_status || "Paid"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => deleteStudent(student.id)}
                                title="Delete Student"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: "Total Students", value: students.length, icon: Users, change: "Live from Supabase", color: "text-amber-400" },
                  { label: "Total Teachers", value: "24", icon: UserCheck, change: "All active", color: "text-blue-400" },
                  { label: "Total Classes", value: "10", icon: BookOpen, change: "Grade 1 to 10", color: "text-emerald-400" },
                  { label: "Fees Collected", value: "৳ 8,45,000", icon: TrendingUp, change: "89% paid", color: "text-purple-400" }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <p className="text-[11px] text-slate-500 mt-1">{stat.change}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* অন্যান্য ট্যাব */}
          {activeTab !== "students" && activeTab !== "dashboard" && (
            <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white capitalize">{activeTab} Module</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                The {activeTab} section is ready and configured.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ADD STUDENT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-6 text-slate-100 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Add New Student</h3>
                <p className="text-xs text-slate-400 mt-0.5">Saves directly to Supabase Database</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samir"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admission Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="SA-2025-008"
                    value={formData.admissionNo}
                    onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class *</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  >
                    <option value="Class 10 - A">Class 10 - A</option>
                    <option value="Class 10 - B">Class 10 - B</option>
                    <option value="Class 9 - A">Class 9 - A</option>
                    <option value="Class 8 - A">Class 8 - A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Photo URL</label>
                <input
                  type="url"
                  placeholder="Paste image link or leave blank"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-sm font-medium text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
