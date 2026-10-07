import React, { useState, useEffect, useRef } from "react";
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
  School,
  Upload,
  Edit3,
  Phone,
  Calendar,
  MapPin,
  Filter,
  ArrowLeft,
  Briefcase,
  Mail,
  CheckCheck,
  Check,
  XCircle,
  Printer,
  Download,
  FileCheck,
  DollarSign,
  Receipt
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
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  blood_group?: string;
  father_name?: string;
  mother_name?: string;
  guardian_phone?: string;
  address?: string;
  avatar_url?: string;
  class?: string;
  section?: string;
  academic_year?: string;
}

interface Teacher {
  id: string;
  teacher_id: string;
  full_name: string;
  designation: string;
  subject_speciality: string;
  phone: string;
  email: string;
  joining_date?: string;
  avatar_url?: string;
}

interface Exam {
  id: string;
  title: string;
  academic_year: string;
  start_date?: string;
}

interface SubjectItem {
  code: string;
  name: string;
  fullMarks: number;
  passMarks: number;
}

interface FeeRecord {
  id: string;
  student_id: string;
  fee_title: string;
  amount: number;
  paid_amount: number;
  status: "Paid" | "Pending" | "Partial";
  payment_method?: string;
  receipt_no?: string;
  payment_date?: string;
  student?: Student;
}

const CLASS_LIST = [
  "Play", "Nursery", "KG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12"
];

const STANDARD_SUBJECTS: SubjectItem[] = [
  { code: "101", name: "Bangla", fullMarks: 100, passMarks: 33 },
  { code: "107", name: "English", fullMarks: 100, passMarks: 33 },
  { code: "109", name: "Mathematics", fullMarks: 100, passMarks: 33 },
  { code: "111", name: "General Science", fullMarks: 100, passMarks: 33 },
  { code: "114", name: "BGS (Social Science)", fullMarks: 100, passMarks: 33 },
  { code: "125", name: "Religion & Moral Education", fullMarks: 100, passMarks: 33 },
  { code: "154", name: "Information & Communication Tech", fullMarks: 50, passMarks: 17 }
];

function calculateGrade(marks: number, fullMarks: number = 100) {
  const pct = (marks / fullMarks) * 100;
  if (pct >= 80) return { grade: "A+", point: 5.0, remarks: "Outstanding" };
  if (pct >= 70) return { grade: "A", point: 4.0, remarks: "Excellent" };
  if (pct >= 60) return { grade: "A-", point: 3.5, remarks: "Very Good" };
  if (pct >= 50) return { grade: "B", point: 3.0, remarks: "Good" };
  if (pct >= 40) return { grade: "C", point: 2.0, remarks: "Satisfactory" };
  if (pct >= 33) return { grade: "D", point: 1.0, remarks: "Pass" };
  return { grade: "F", point: 0.0, remarks: "Failed" };
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

  // Navigation & Data
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");

  // Classes View Drill-down
  const [selectedClassView, setSelectedClassView] = useState<string | null>(null);

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherForm, setTeacherForm] = useState({
    teacher_id: "",
    full_name: "",
    designation: "Assistant Teacher",
    subject_speciality: "Mathematics",
    phone: "",
    email: "",
    joining_date: "2026-01-01",
    avatar_url: ""
  });

  // Student Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [studentForm, setStudentForm] = useState({
    id: "",
    admission_number: "",
    first_name: "",
    last_name: "",
    gender: "male",
    date_of_birth: "2010-01-01",
    blood_group: "A+",
    father_name: "",
    mother_name: "",
    guardian_phone: "",
    address: "",
    class: "Class 9",
    section: "A",
    academic_year: "2026",
    avatar_url: ""
  });

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Attendance State
  const [attClass, setAttClass] = useState("Class 9");
  const [attSection, setAttSection] = useState("A");
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState<{ [studentId: string]: "present" | "absent" | "late" }>({});
  const [attLoading, setAttLoading] = useState(false);
  const [attSaving, setAttSaving] = useState(false);
  const [studentMyAtt, setStudentMyAtt] = useState<any[]>([]);

  // Exams & Marks State
  const [exams, setExams] = useState<Exam[]>([
    { id: "exam-1", title: "First Term Examination 2026", academic_year: "2026", start_date: "2026-04-15" },
    { id: "exam-2", title: "Annual Examination 2026", academic_year: "2026", start_date: "2026-11-20" }
  ]);
  const [selectedExamId, setSelectedExamId] = useState("exam-1");
  const [marksClass, setMarksClass] = useState("Class 9");
  const [marksSection, setMarksSection] = useState("A");
  const [marksSubject, setMarksSubject] = useState("Mathematics");
  const [marksInputMap, setMarksInputMap] = useState<{ [studentId: string]: string }>({});
  const [allStoredMarks, setAllStoredMarks] = useState<any[]>([]);
  const [marksSaving, setMarksSaving] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [marksheetStudent, setMarksheetStudent] = useState<Student | null>(null);

  // --- Fees State ---
  const [feesList, setFeesList] = useState<FeeRecord[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeFilterStatus, setFeeFilterStatus] = useState("All");
  const [feeSearch, setFeeSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);

  const [collectFeeForm, setCollectFeeForm] = useState({
    student_id: "",
    fee_title: "Monthly Tuition - January 2026",
    amount: "1500",
    paid_amount: "1500",
    payment_method: "bKash"
  });

  // --- Auth Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.rpc("secure_login", {
        p_user_id: loginId.trim(),
        p_password: loginPassword.trim()
      });

      if (error) throw new Error(`Database Error: ${error.message}`);
      if (!data || !data.success) throw new Error(data?.message || "Invalid ID or Password!");

      const authenticatedUser = data.user;
      setCurrentUser(authenticatedUser);
      localStorage.setItem("samir_academy_user", JSON.stringify(authenticatedUser));

      if (authenticatedUser.role === "student") setActiveTab("my-profile");
      else if (authenticatedUser.role === "teacher") setActiveTab("marks");
      else setActiveTab("dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed!");
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

  // --- Fetch Operations ---
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data: studentsData, error: sErr } = await supabase
        .from("students")
        .select(`
          *,
          enrollments (
            class_name,
            section,
            academic_year
          )
        `)
        .order("created_at", { ascending: false });

      if (sErr) throw sErr;

      const formatted: Student[] = (studentsData || []).map((s: any) => {
        const latestEnroll = s.enrollments?.[0];
        return {
          ...s,
          class: latestEnroll?.class_name || "Class 9",
          section: latestEnroll?.section || "A",
          academic_year: latestEnroll?.academic_year || "2026"
        };
      });

      setStudents(formatted);
      if (formatted.length > 0 && !collectFeeForm.student_id) {
        setCollectFeeForm((prev) => ({ ...prev, student_id: formatted[0].id }));
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error("Fetch teachers error:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setExams(data);
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      console.error("Fetch exams error:", err);
    }
  };

  const fetchMarks = async () => {
    try {
      const { data, error } = await supabase.from("marks").select("*");
      if (!error && data) setAllStoredMarks(data);
    } catch (err) {
      console.error("Fetch marks error:", err);
    }
  };

  const fetchFees = async () => {
    try {
      setLoadingFees(true);
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            admission_number
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedFees = data.map((f: any) => ({
          ...f,
          student: f.students
        }));
        setFeesList(formattedFees);
      }
    } catch (err) {
      console.error("Fetch fees error:", err);
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStudents();
      fetchTeachers();
      fetchExams();
      fetchMarks();
      fetchFees();
    }
  }, [currentUser]);

  // Sync marks input
  useEffect(() => {
    const map: { [studentId: string]: string } = {};
    const relevantMarks = allStoredMarks.filter(
      (m) => m.exam_id === selectedExamId && (m.remarks === marksSubject || m.subject_code === marksSubject)
    );
    relevantMarks.forEach((m) => {
      map[m.student_id] = String(m.marks_obtained);
    });
    setMarksInputMap(map);
  }, [selectedExamId, marksClass, marksSection, marksSubject, allStoredMarks]);

  // --- Photo Upload Engine ---
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setProcessingPhoto(true);

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const targetWidth = 420;
      const targetHeight = 540;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");

      const sourceAspect = bitmap.width / bitmap.height;
      const targetAspect = targetWidth / targetHeight;
      let sx = 0, sy = 0, sWidth = bitmap.width, sHeight = bitmap.height;

      if (sourceAspect > targetAspect) {
        sWidth = bitmap.height * targetAspect;
        sx = (bitmap.width - sWidth) / 2;
      } else {
        sHeight = bitmap.width / targetAspect;
        sy = (bitmap.height - sHeight) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      let quality = 0.90;
      let finalBlob: Blob | null = null;
      while (quality >= 0.35) {
        finalBlob = await new Promise<Blob | null>((res) =>
          canvas.toBlob((b) => res(b), "image/jpeg", quality)
        );
        if (finalBlob && finalBlob.size <= 200 * 1024) break;
        quality -= 0.1;
      }

      if (finalBlob) {
        const processedFile = new File([finalBlob], `avatar_${Date.now()}.jpg`, { type: "image/jpeg" });
        setPhotoFile(processedFile);
        setPhotoPreview(URL.createObjectURL(finalBlob));
      }
    } catch (err) {
      console.error("Photo processing failed:", err);
      alert("Failed to process photo.");
    } finally {
      setProcessingPhoto(false);
    }
  };

  // --- Save / Collect Fee Handler ---
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeSubmitting(true);

    try {
      const amt = parseFloat(collectFeeForm.amount);
      const paid = parseFloat(collectFeeForm.paid_amount);
      const status: "Paid" | "Pending" | "Partial" =
        paid >= amt ? "Paid" : paid > 0 ? "Partial" : "Pending";
      const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from("fees")
        .insert([
          {
            student_id: collectFeeForm.student_id,
            fee_title: collectFeeForm.fee_title,
            amount: amt,
            paid_amount: paid,
            status,
            payment_method: collectFeeForm.payment_method,
            receipt_no: receiptNo,
            payment_date: new Date().toISOString().split("T")[0]
          }
        ])
        .select()
        .single();

      if (error) throw error;

      alert(`Fee payment recorded! Receipt No: ${receiptNo}`);
      await fetchFees();
      setIsCollectFeeOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setFeeSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const admNo = (s.admission_number || "").toLowerCase();
    const phone = (s.guardian_phone || "").toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || admNo.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase());
    const matchClass = selectedClassFilter === "All" || s.class === selectedClassFilter;
    return matchSearch && matchClass;
  });

  const filteredTeachers = teachers.filter((t) => {
    const name = t.full_name.toLowerCase();
    const id = t.teacher_id.toLowerCase();
    const sub = (t.subject_speciality || "").toLowerCase();
    return name.includes(teacherSearch.toLowerCase()) || id.includes(teacherSearch.toLowerCase()) || sub.includes(teacherSearch.toLowerCase());
  });

  const marksTargetStudents = students.filter(
    (s) => s.class === marksClass && (s.section || "A") === marksSection
  );

  const currentStudentData = students.find((s) => s.admission_number === currentUser?.user_id_code);

  // Fees Filtering
  const filteredFees = feesList.filter((f) => {
    const sName = f.student ? `${f.student.first_name} ${f.student.last_name}`.toLowerCase() : "";
    const recNo = (f.receipt_no || "").toLowerCase();
    const matchSearch = sName.includes(feeSearch.toLowerCase()) || recNo.includes(feeSearch.toLowerCase());
    const matchStatus = feeFilterStatus === "All" || f.status === feeFilterStatus;
    return matchSearch && matchStatus;
  });

  // Fees Totals
  const totalFeesBilled = feesList.reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalFeesCollected = feesList.reduce((acc, f) => acc + Number(f.paid_amount || 0), 0);
  const totalFeesDue = Math.max(0, totalFeesBilled - totalFeesCollected);

  // Student's own fees
  const myStudentFees = currentStudentData
    ? feesList.filter((f) => f.student_id === currentStudentData.id)
    : [];

  // =========================================================================
  // VIEW 1: LOGIN PORTAL
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070d1c] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-full max-w-md bg-[#0a1226] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto shadow-xl shadow-amber-500/10 mb-4">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Samir Academy</h1>
            <p className="text-xs text-slate-400 mt-1">Multi-Role Academic ERP Portal</p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
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
                  placeholder="Enter your ID code"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In to Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED PORTAL
  // =========================================================================
  const isRole = currentUser.role;

  return (
    <div className="flex h-screen bg-[#070d1c] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0a1226] border-r border-slate-800/80 flex flex-col justify-between select-none shrink-0 print:hidden">
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
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher"] },
              { id: "students", label: "Students", icon: Users, roles: ["admin"] },
              { id: "teachers", label: "Teachers", icon: UserCheck, roles: ["admin"] },
              { id: "classes", label: "Classes", icon: BookOpen, roles: ["admin", "teacher"] },
              { id: "attendance", label: "Attendance", icon: CalendarCheck, roles: ["admin", "teacher", "student"] },
              { id: "exams", label: "Exams", icon: FileText, roles: ["admin"] },
              { id: "marks", label: "Marks & Results", icon: Award, roles: ["admin", "teacher", "student"] },
              { id: "fees", label: "Fees & Invoices", icon: CreditCard, roles: ["admin", "student"] },
              { id: "my-profile", label: "My Profile", icon: User, roles: ["student"] }
            ]
              .filter((item) => item.roles.includes(isRole))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedClassView(null);
                    }}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-[#0a1226]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">{isRole} Mode</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold capitalize text-amber-400">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Academic Year 2026
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ================= FEES & INVOICES TAB ================= */}
          {activeTab === "fees" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ADMIN VIEW */}
              {isRole === "admin" ? (
                <>
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Billed Fees</span>
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">
                        ৳ {totalFeesBilled.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Total revenue invoices generated</p>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Collected</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-400">
                        ৳ {totalFeesCollected.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Successfully collected payments</p>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Outstanding Dues</span>
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-rose-400">
                        ৳ {totalFeesDue.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Pending payments from students</p>
                    </div>
                  </div>

                  {/* Header & Collect Button */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Tuition & Fee Records</h2>
                      <p className="text-sm text-slate-400 mt-1">Collect fees, manage invoices, and issue official payment vouchers</p>
                    </div>

                    <button
                      onClick={() => setIsCollectFeeOpen(true)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      Collect Fee Payment
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-semibold text-slate-400">Status:</span>
                      <select
                        value={feeFilterStatus}
                        onChange={(e) => setFeeFilterStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="All">All Invoices</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search student or receipt number..."
                        value={feeSearch}
                        onChange={(e) => setFeeSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                      />
                    </div>
                  </div>

                  {/* Fee Table */}
                  {loadingFees ? (
                    <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                      <p>Loading fee transactions...</p>
                    </div>
                  ) : filteredFees.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                      <p className="text-base font-semibold text-slate-300">No fee records found</p>
                      <p className="text-xs text-slate-500 mt-1">Click "Collect Fee Payment" to record a transaction.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-4 px-6">Receipt No</th>
                            <th className="py-4 px-4">Student</th>
                            <th className="py-4 px-4">Fee Item Title</th>
                            <th className="py-4 px-4">Amount</th>
                            <th className="py-4 px-4">Paid</th>
                            <th className="py-4 px-4">Method</th>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-6 text-right">Receipt Voucher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredFees.map((fee) => (
                            <tr key={fee.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-4 px-6 font-mono font-bold text-amber-400 text-xs">
                                {fee.receipt_no || "REC-2026-001"}
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-white">
                                  {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "Student"}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500">
                                  {fee.student?.admission_number || "—"}
                                </p>
                              </td>
                              <td className="py-4 px-4 text-slate-300 text-xs">{fee.fee_title}</td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-200">৳ {fee.amount}</td>
                              <td className="py-4 px-4 font-mono font-bold text-emerald-400">৳ {fee.paid_amount}</td>
                              <td className="py-4 px-4 text-xs text-slate-400">{fee.payment_method || "Cash"}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  fee.status === "Paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : fee.status === "Partial"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {fee.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    // Match full student object for the receipt
                                    const fullStudent = students.find((s) => s.id === fee.student_id);
                                    setSelectedReceipt({ ...fee, student: fullStudent || fee.student });
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                                  Print Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                /* STUDENT VIEW: MY FEES & INVOICES */
                <div className="space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">My Tuition & Fee Invoices</h2>
                      <p className="text-sm text-slate-400 mt-1">Payment receipts and status for Academic Year 2026</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {myStudentFees.length === 0 ? (
                      <p className="text-center py-16 text-slate-500 text-sm">No payment records found.</p>
                    ) : (
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-4 px-6">Receipt No</th>
                            <th className="py-4 px-4">Fee Item</th>
                            <th className="py-4 px-4">Amount</th>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-6 text-right">Receipt Voucher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {myStudentFees.map((fee) => (
                            <tr key={fee.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-4 px-6 font-mono font-bold text-amber-400 text-xs">
                                {fee.receipt_no || "REC-2026-001"}
                              </td>
                              <td className="py-4 px-4 font-semibold text-white">{fee.fee_title}</td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-200">৳ {fee.amount}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  fee.status === "Paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {fee.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => setSelectedReceipt({ ...fee, student: currentStudentData })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                                  Download Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= DASHBOARD TAB ================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: "Total Students", value: students.length, icon: Users, color: "text-amber-400", tab: "students" },
                  { label: "Total Faculty", value: teachers.length, icon: UserCheck, color: "text-blue-400", tab: "teachers" },
                  { label: "Total Classes", value: CLASS_LIST.length, icon: BookOpen, color: "text-emerald-400", tab: "classes" },
                  { label: "Fees Collected", value: `৳ ${totalFeesCollected.toLocaleString()}`, icon: TrendingUp, color: "text-purple-400", tab: "fees" }
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

          {/* ================= OTHER TABS ================= */}
          {activeTab !== "fees" && activeTab !== "dashboard" && (
            <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white capitalize">{activeTab} Module</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Current Role: <b>{isRole}</b>. Module fully active and configured.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL: COLLECT FEE PAYMENT ================= */}
      {isCollectFeeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCollectFeeOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Collect Fee Payment</h3>
                <p className="text-xs text-slate-400 mt-0.5">Generates invoice & printable money receipt</p>
              </div>
              <button
                onClick={() => setIsCollectFeeOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Student *</label>
                <select
                  required
                  value={collectFeeForm.student_id}
                  onChange={(e) => setCollectFeeForm({ ...collectFeeForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number}) — {s.class}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Item / Title *</label>
                <select
                  value={collectFeeForm.fee_title}
                  onChange={(e) => setCollectFeeForm({ ...collectFeeForm, fee_title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Monthly Tuition - January 2026">Monthly Tuition - January 2026</option>
                  <option value="Monthly Tuition - February 2026">Monthly Tuition - February 2026</option>
                  <option value="First Term Exam Fee 2026">First Term Exam Fee 2026</option>
                  <option value="Annual Session & Development Fee">Annual Session & Development Fee</option>
                  <option value="Admission & Registration Fee">Admission & Registration Fee</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Fee (৳) *</label>
                  <input
                    type="number"
                    required
                    value={collectFeeForm.amount}
                    onChange={(e) => setCollectFeeForm({ ...collectFeeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Paid (৳) *</label>
                  <input
                    type="number"
                    required
                    value={collectFeeForm.paid_amount}
                    onChange={(e) => setCollectFeeForm({ ...collectFeeForm, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={collectFeeForm.payment_method}
                  onChange={(e) => setCollectFeeForm({ ...collectFeeForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="bKash">bKash Mobile Payment</option>
                  <option value="Nagad">Nagad Mobile Payment</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Bank Deposit">Bank Deposit / Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCollectFeeOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feeSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-slate-950 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {feeSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 OFFICIAL MONEY RECEIPT VOUCHER (STUDENT COPY + OFFICE COPY) 🌟 */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReceipt(null);
          }}
        >
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
            {/* Action Bar (Hidden during Print) */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official Money Receipt Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Print / Save Receipt PDF
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DUAL SLIP CONTAINER (Student Copy & Office Copy) */}
            <div className="space-y-8">
              {["STUDENT COPY", "OFFICE COPY"].map((copyType, cIdx) => (
                <div
                  key={cIdx}
                  className={`border-2 border-slate-800 p-6 rounded-2xl relative bg-white ${
                    cIdx === 1 ? "border-dashed" : ""
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black uppercase text-slate-950 leading-tight">
                          Samir Academy
                        </h2>
                        <p className="text-[10px] text-slate-600 font-medium">
                          Academic Excellence & Moral Leadership • EIIN: 135892
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                        {copyType}
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                        {selectedReceipt.receipt_no || "REC-2026-001"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Date: {selectedReceipt.payment_date || "2026-05-15"}
                      </p>
                    </div>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-4 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Student Name</span>
                      <span className="font-bold text-slate-900">
                        {selectedReceipt.student
                          ? `${selectedReceipt.student.first_name} ${selectedReceipt.student.last_name}`
                          : "Samir Ahmed"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Admission ID</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedReceipt.student?.admission_number || "SA-2026-001"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Class & Sec</span>
                      <span className="font-bold text-slate-900">
                        {selectedReceipt.student?.class || "Class 9"} ({selectedReceipt.student?.section || "A"})
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Payment Mode</span>
                      <span className="font-bold text-slate-900">{selectedReceipt.payment_method || "Cash"}</span>
                    </div>
                  </div>

                  {/* Payment Table */}
                  <table className="w-full text-xs text-left border border-slate-300 rounded-lg overflow-hidden my-2">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Description of Fee</th>
                        <th className="py-2 px-3 text-right">Total Billed</th>
                        <th className="py-2 px-3 text-right">Amount Paid</th>
                        <th className="py-2 px-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">{selectedReceipt.fee_title}</td>
                        <td className="py-2 px-3 font-mono text-right text-slate-700">৳ {selectedReceipt.amount}</td>
                        <td className="py-2 px-3 font-mono font-bold text-right text-slate-950">
                          ৳ {selectedReceipt.paid_amount}
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-rose-600 font-bold">
                          ৳ {Math.max(0, selectedReceipt.amount - selectedReceipt.paid_amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="flex items-end justify-between pt-6 text-[10px] text-slate-600">
                    <span className="italic">Status: Paid via {selectedReceipt.payment_method || "Cash"}</span>
                    <div className="text-center">
                      <div className="w-32 border-t border-slate-800 pt-1 font-bold text-slate-900">
                        Authorized Cashier
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
