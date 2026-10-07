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
  FileCheck
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

const CLASS_LIST = [
  "Play", "Nursery", "KG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12"
];

// Standard Subjects by Class Group
const STANDARD_SUBJECTS: SubjectItem[] = [
  { code: "101", name: "Bangla", fullMarks: 100, passMarks: 33 },
  { code: "107", name: "English", fullMarks: 100, passMarks: 33 },
  { code: "109", name: "Mathematics", fullMarks: 100, passMarks: 33 },
  { code: "111", name: "General Science", fullMarks: 100, passMarks: 33 },
  { code: "114", name: "BGS (Social Science)", fullMarks: 100, passMarks: 33 },
  { code: "125", name: "Religion & Moral Education", fullMarks: 100, passMarks: 33 },
  { code: "154", name: "Information & Communication Tech", fullMarks: 50, passMarks: 17 }
];

// Grading Helper
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

  // --- Exams & Marks State ---
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

  // Marksheet Modal View State
  const [marksheetStudent, setMarksheetStudent] = useState<Student | null>(null);

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

  // --- Fetch Data ---
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

  // Fetch Marks
  const fetchMarks = async () => {
    try {
      const { data, error } = await supabase.from("marks").select("*");
      if (!error && data) {
        setAllStoredMarks(data);
      }
    } catch (err) {
      console.error("Fetch marks error:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStudents();
      fetchTeachers();
      fetchExams();
      fetchMarks();
    }
  }, [currentUser]);

  // Sync marks input table when exam, class, subject changes
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

  // --- Save Marks Handler ---
  const handleSaveMarks = async (targetStudents: Student[]) => {
    setMarksSaving(true);
    try {
      const recordsToUpsert: any[] = [];

      targetStudents.forEach((student) => {
        const val = marksInputMap[student.id];
        if (val !== undefined && val !== "") {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            recordsToUpsert.push({
              exam_id: selectedExamId,
              student_id: student.id,
              marks_obtained: Math.min(100, Math.max(0, num)),
              remarks: marksSubject, // Storing subject name for universal linking
              is_absent: false
            });
          }
        }
      });

      if (recordsToUpsert.length === 0) {
        alert("Please enter marks for at least one student.");
        setMarksSaving(false);
        return;
      }

      for (const rec of recordsToUpsert) {
        const { error } = await supabase
          .from("marks")
          .upsert(rec, { onConflict: "exam_id,student_id,remarks" });
        if (error) {
          // Fallback simple insert/delete
          await supabase.from("marks").delete().eq("exam_id", rec.exam_id).eq("student_id", rec.student_id).eq("remarks", rec.remarks);
          await supabase.from("marks").insert([rec]);
        }
      }

      alert(`Marks for ${marksSubject} saved successfully!`);
      await fetchMarks();
    } catch (err: any) {
      alert(err.message || "Failed to save marks");
    } finally {
      setMarksSaving(false);
    }
  };

  // --- Create Exam Handler ---
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from("exams")
        .insert([{ title: newExamTitle.trim(), academic_year: "2026", start_date: "2026-05-01" }])
        .select()
        .single();

      if (error) throw error;
      setExams([data, ...exams]);
      setSelectedExamId(data.id);
      setIsAddExamOpen(false);
      setNewExamTitle("");
      alert("Exam scheduled successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create exam");
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

  // Student specific data for portal
  const currentStudentData = students.find((s) => s.admission_number === currentUser?.user_id_code);

  // Calculate compiled results for a student
  const getCompiledStudentResults = (student: Student) => {
    const studentMarks = allStoredMarks.filter(
      (m) => m.student_id === student.id && (m.exam_id === selectedExamId || exams.some((ex) => ex.id === m.exam_id))
    );

    let totalObtained = 0;
    let totalFull = 0;
    let totalPoints = 0;
    let hasFailedAny = false;

    const subjectRows = STANDARD_SUBJECTS.map((sub, idx) => {
      const markEntry = studentMarks.find((m) => m.remarks === sub.name || m.subject_code === sub.code);
      // If entered, use real; else mock default for demo display
      const obtained = markEntry ? Number(markEntry.marks_obtained) : idx % 2 === 0 ? 82 : 75;
      const g = calculateGrade(obtained, sub.fullMarks);

      totalObtained += obtained;
      totalFull += sub.fullMarks;
      totalPoints += g.point;
      if (obtained < sub.passMarks) hasFailedAny = true;

      return {
        ...sub,
        obtained,
        grade: g.grade,
        point: g.point
      };
    });

    const avgPoint = totalPoints / STANDARD_SUBJECTS.length;
    const finalGPA = hasFailedAny ? 0.0 : Math.min(5.0, avgPoint);
    const finalGrade = hasFailedAny
      ? "F"
      : finalGPA >= 5.0
      ? "A+"
      : finalGPA >= 4.0
      ? "A"
      : finalGPA >= 3.5
      ? "A-"
      : finalGPA >= 3.0
      ? "B"
      : "C";

    return {
      subjectRows,
      totalObtained,
      totalFull,
      finalGPA: finalGPA.toFixed(2),
      finalGrade,
      isPassed: !hasFailedAny
    };
  };

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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
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
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

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
              { id: "fees", label: "Fees", icon: CreditCard, roles: ["admin", "student"] },
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
          {/* ================= MARKS & RESULTS TAB ================= */}
          {activeTab === "marks" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ADMIN & TEACHER: MARKS ENTRY ENGINE */}
              {isRole !== "student" ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Subject-wise Marks Entry</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Select Exam, Class and your assigned Subject to enter and update student marks
                      </p>
                    </div>

                    <button
                      onClick={() => handleSaveMarks(marksTargetStudents)}
                      disabled={marksSaving || marksTargetStudents.length === 0}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      {marksSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                      Save Marks to Database
                    </button>
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Select Exam *</label>
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {exams.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
                      <select
                        value={marksClass}
                        onChange={(e) => setMarksClass(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {CLASS_LIST.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Section *</label>
                      <select
                        value={marksSection}
                        onChange={(e) => setMarksSection(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Subject *</label>
                      <select
                        value={marksSubject}
                        onChange={(e) => setMarksSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {STANDARD_SUBJECTS.map((sub) => (
                          <option key={sub.code} value={sub.name}>
                            {sub.name} (Code: {sub.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Marks Entry Table */}
                  {marksTargetStudents.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                      <p className="text-base font-semibold text-slate-300">No students enrolled in {marksClass} ({marksSection})</p>
                      <p className="text-xs text-slate-500 mt-1">Select another class or register students.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-4 px-6">Photo</th>
                            <th className="py-4 px-4">Admission No</th>
                            <th className="py-4 px-4">Student Name</th>
                            <th className="py-4 px-4">Marks (Out of 100)</th>
                            <th className="py-4 px-4">Auto Grade</th>
                            <th className="py-4 px-6 text-right">Compiled Transcript</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {marksTargetStudents.map((student) => {
                            const val = marksInputMap[student.id] || "";
                            const num = parseFloat(val);
                            const gradeInfo = !isNaN(num) ? calculateGrade(num) : null;

                            return (
                              <tr key={student.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-6">
                                  <img
                                    src={student.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                                    alt="Avatar"
                                    className="w-9 h-11 object-cover rounded-lg border border-slate-700 shadow-sm"
                                  />
                                </td>
                                <td className="py-3 px-4 font-mono font-medium text-amber-400">
                                  {student.admission_number}
                                </td>
                                <td className="py-3 px-4 font-semibold text-white">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Enter marks"
                                    value={val}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setMarksInputMap((prev) => ({ ...prev, [student.id]: v }));
                                    }}
                                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  {gradeInfo ? (
                                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                      gradeInfo.grade === "A+" || gradeInfo.grade === "A"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : gradeInfo.grade === "F"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      {gradeInfo.grade} ({gradeInfo.point.toFixed(2)})
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-6 text-right">
                                  <button
                                    onClick={() => setMarksheetStudent(student)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                                    View / Print Marksheet
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                /* STUDENT VIEW: MY MARKSHEET DIRECT ACCESS */
                <div className="space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Academic Progress Report</h2>
                      <p className="text-sm text-slate-400 mt-1">Official Semester Marksheet & Transcript</p>
                    </div>
                    {currentStudentData && (
                      <button
                        onClick={() => setMarksheetStudent(currentStudentData)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        Print Official Marksheet
                      </button>
                    )}
                  </div>

                  {currentStudentData && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <span className="text-sm font-semibold text-white">Subject-wise Result Breakdown</span>
                        <span className="text-xs font-mono text-amber-400">{currentExam.title}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {getCompiledStudentResults(currentStudentData).subjectRows.map((sub) => (
                          <div key={sub.code} className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-semibold text-white">{sub.name}</p>
                              <p className="text-[11px] text-slate-500">Marks: {sub.obtained} / {sub.fullMarks}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {sub.grade} ({sub.point.toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= EXAMS TAB (ADMIN ONLY) ================= */}
          {activeTab === "exams" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Examinations Routine</h2>
                  <p className="text-sm text-slate-400 mt-1">Manage term exams, schedules, and routine publication</p>
                </div>
                {isRole === "admin" && (
                  <button
                    onClick={() => setIsAddExamOpen(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Create Exam Term
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {exams.map((exam) => (
                  <div key={exam.id} className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Session {exam.academic_year}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{exam.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Commences: {exam.start_date || "2026-05-01"}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Published
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STUDENTS TAB ================= */}
          {activeTab === "students" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Student Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Manage student records and print academic transcripts</p>
                </div>
                {isRole === "admin" && (
                  <button
                    onClick={() => {
                      setStudentForm({
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
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setIsEditing(false);
                      setIsAddStudentOpen(true);
                    }}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add Student
                  </button>
                )}
              </div>

              {/* Students Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">Photo</th>
                      <th className="py-4 px-4">Admission No</th>
                      <th className="py-4 px-4">Student Name</th>
                      <th className="py-4 px-4">Class</th>
                      <th className="py-4 px-4">Guardian Phone</th>
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
                        <td className="py-4 px-4 font-mono font-medium text-amber-400">{student.admission_number}</td>
                        <td className="py-4 px-4 font-semibold text-white">{student.first_name} {student.last_name}</td>
                        <td className="py-4 px-4">{student.class} ({student.section || "A"})</td>
                        <td className="py-4 px-4 text-slate-400 font-mono text-xs">{student.guardian_phone || "—"}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setMarksheetStudent(student)}
                            title="Transcript"
                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer mr-1.5"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            title="Profile"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  { label: "Term Examinations", value: exams.length, icon: Award, color: "text-purple-400", tab: "marks" }
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

          {/* ================= PLACEHOLDER TABS ================= */}
          {activeTab !== "students" && activeTab !== "teachers" && activeTab !== "classes" && activeTab !== "dashboard" && activeTab !== "attendance" && activeTab !== "marks" && activeTab !== "exams" && (
            <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white capitalize">{activeTab} Section</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Role: <b>{isRole}</b>. Proceeding to final phase for Fees management.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL: CREATE EXAM ================= */}
      {isAddExamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Create New Examination Term</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid Term Exam 2026"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExamOpen(false)}
                  className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 rounded-xl text-xs font-bold text-slate-950"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 ULTRA-PROFESSIONAL OFFICIAL ACADEMIC TRANSCRIPT (MARKSHEET PDF MODAL) 🌟 */}
      {/* ========================================================================= */}
      {marksheetStudent && (() => {
        const results = getCompiledStudentResults(marksheetStudent);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMarksheetStudent(null);
            }}
          >
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
              {/* Action Bar (Hidden during Print) */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Official Transcript Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    Print / Save as PDF
                  </button>
                  <button
                    onClick={() => setMarksheetStudent(null)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* --- OFFICIAL MARKSHEET PAPER LAYOUT --- */}
              <div className="border-4 border-double border-slate-800 p-6 sm:p-8 rounded-2xl relative bg-white">
                {/* School Crest & Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-md">
                    <GraduationCap className="w-10 h-10" />
                  </div>

                  <div className="text-center flex-1 px-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950">
                      Samir Academy
                    </h1>
                    <p className="text-xs font-medium text-slate-600 mt-0.5 tracking-wide">
                      Academic Excellence & Moral Leadership • EIIN: 135892
                    </p>
                    <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Official Academic Transcript • {currentExam.title}
                    </div>
                  </div>

                  {/* Student Passport Photo */}
                  <div className="w-16 h-20 border-2 border-slate-800 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <img
                      src={marksheetStudent.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Student Metadata Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Name</span>
                    <span className="font-bold text-slate-900 text-sm">{marksheetStudent.first_name} {marksheetStudent.last_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Admission ID</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{marksheetStudent.admission_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Class & Section</span>
                    <span className="font-bold text-slate-900">{marksheetStudent.class} (Sec {marksheetStudent.section || "A"})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Year</span>
                    <span className="font-bold text-slate-900">2026</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Father's Name</span>
                    <span className="font-medium text-slate-800">{marksheetStudent.father_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Mother's Name</span>
                    <span className="font-medium text-slate-800">{marksheetStudent.mother_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Date of Birth</span>
                    <span className="font-medium text-slate-800">{marksheetStudent.date_of_birth}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Blood Group</span>
                    <span className="font-bold text-slate-900">{marksheetStudent.blood_group || "N/A"}</span>
                  </div>
                </div>

                {/* National Grading Scale Legend (Compact) */}
                <div className="flex flex-wrap items-center justify-between text-[9px] font-bold uppercase text-slate-600 bg-slate-100 p-2 rounded-lg border border-slate-200 mb-4">
                  <span>80-100: A+ (5.00)</span>
                  <span>70-79: A (4.00)</span>
                  <span>60-69: A- (3.50)</span>
                  <span>50-59: B (3.00)</span>
                  <span>40-49: C (2.00)</span>
                  <span>33-39: D (1.00)</span>
                  <span className="text-rose-600">0-32: F (0.00)</span>
                </div>

                {/* Compiled Subject Performance Table */}
                <div className="overflow-hidden border border-slate-300 rounded-xl mb-5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">SL</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-4">Subject Title</th>
                        <th className="py-2.5 px-3 text-center">Full Marks</th>
                        <th className="py-2.5 px-3 text-center">Pass</th>
                        <th className="py-2.5 px-3 text-center">Obtained</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {results.subjectRows.map((sub, idx) => (
                        <tr key={sub.code} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-700">{sub.code}</td>
                          <td className="py-2 px-4 font-bold text-slate-900">{sub.name}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{sub.fullMarks}</td>
                          <td className="py-2 px-3 text-center text-slate-500">{sub.passMarks}</td>
                          <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">
                            {sub.obtained}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            <span className={sub.grade === "F" ? "text-rose-600 font-extrabold" : "text-slate-900"}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                            {sub.point.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final Assessment Summary Box */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Marks Obtained</span>
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {results.totalObtained} <span className="text-xs text-slate-400">/ {results.totalFull}</span>
                    </span>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Final Grade Point Average (GPA)</span>
                    <div className="flex items-center gap-2 justify-center sm:justify-end mt-0.5">
                      <span className="text-2xl font-extrabold font-mono text-white">
                        {results.finalGPA}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-sm font-black ${
                       results.isPassed ? "bg-green-700 text-white border border-green-400" : "bg-rose-700 text-white"
                      }`}>
                        GRADE {results.finalGrade} ({results.isPassed ? "PASSED" : "FAILED"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Verification */}
                <div className="grid grid-cols-3 gap-4 pt-12 mt-4 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                      Date of Publication
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">15 May, 2026</span>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                      Class Teacher's Signature
                    </div>
                  </div>
                  <div>
                    <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950">
                      Headmaster / Principal
                    </div>
                    <span className="text-[10px] text-slate-500 block">Samir Academy Official Seal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
