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
  AlertTriangle
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

interface AttendanceRecord {
  id?: string;
  student_id: string;
  class_name: string;
  section: string;
  date: string;
  status: "present" | "absent" | "late";
}

const CLASS_LIST = [
  "Play", "Nursery", "KG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12"
];

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

  // Student Form State
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

  // --- Attendance State ---
  const [attClass, setAttClass] = useState("Class 9");
  const [attSection, setAttSection] = useState("A");
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState<{ [studentId: string]: "present" | "absent" | "late" }>({});
  const [attLoading, setAttLoading] = useState(false);
  const [attSaving, setAttSaving] = useState(false);
  const [studentMyAtt, setStudentMyAtt] = useState<any[]>([]);

  // --- Login Handler ---
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
      else if (authenticatedUser.role === "teacher") setActiveTab("attendance");
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

  // --- Fetch Students ---
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

  // --- Fetch Teachers ---
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

  // --- Fetch Attendance for Selected Class & Date ---
  const fetchAttendance = async () => {
    setAttLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_name", attClass)
        .eq("section", attSection)
        .eq("date", attDate);

      if (error) throw error;

      const map: { [studentId: string]: "present" | "absent" | "late" } = {};
      (data || []).forEach((row: any) => {
        map[row.student_id] = row.status;
      });
      setAttMap(map);
    } catch (err) {
      console.error("Fetch attendance error:", err);
    } finally {
      setAttLoading(false);
    }
  };

  // Fetch student's own attendance
  const fetchMyAttendance = async () => {
    if (currentUser?.role !== "student") return;
    try {
      const currentStudent = students.find((s) => s.admission_number === currentUser.user_id_code);
      if (!currentStudent) return;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", currentStudent.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setStudentMyAtt(data || []);
    } catch (err) {
      console.error("Fetch my attendance error:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStudents();
      fetchTeachers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "attendance" && (currentUser?.role === "admin" || currentUser?.role === "teacher")) {
      fetchAttendance();
    }
    if (activeTab === "attendance" && currentUser?.role === "student") {
      fetchMyAttendance();
    }
  }, [activeTab, attClass, attSection, attDate, students]);

  // --- Passport Photo Auto Crop (35mm x 45mm, <200KB) ---
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

  // --- Save Student ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      let avatarUrl = studentForm.avatar_url;

      if (photoFile) {
        const filePath = `avatars/${Date.now()}_${studentForm.admission_number}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("student-photos")
          .upload(filePath, photoFile, { upsert: true });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from("student-photos")
            .getPublicUrl(filePath);
          avatarUrl = pubData.publicUrl;
        }
      }

      if (isEditing) {
        const { error: sUpdateErr } = await supabase
          .from("students")
          .update({
            first_name: studentForm.first_name.trim(),
            last_name: studentForm.last_name.trim(),
            gender: studentForm.gender,
            date_of_birth: studentForm.date_of_birth,
            blood_group: studentForm.blood_group,
            father_name: studentForm.father_name.trim(),
            mother_name: studentForm.mother_name.trim(),
            guardian_phone: studentForm.guardian_phone.trim(),
            address: studentForm.address.trim(),
            avatar_url: avatarUrl
          })
          .eq("id", studentForm.id);

        if (sUpdateErr) throw sUpdateErr;

        await supabase
          .from("enrollments")
          .upsert({
            student_id: studentForm.id,
            academic_year: studentForm.academic_year,
            class_name: studentForm.class,
            section: studentForm.section
          }, { onConflict: "student_id,academic_year" });

        alert("Student updated successfully!");
      } else {
        const { data: newS, error: insertErr } = await supabase
          .from("students")
          .insert([
            {
              admission_number: studentForm.admission_number.trim(),
              first_name: studentForm.first_name.trim(),
              last_name: studentForm.last_name.trim(),
              gender: studentForm.gender,
              date_of_birth: studentForm.date_of_birth,
              blood_group: studentForm.blood_group,
              father_name: studentForm.father_name.trim(),
              mother_name: studentForm.mother_name.trim(),
              guardian_phone: studentForm.guardian_phone.trim(),
              address: studentForm.address.trim(),
              avatar_url: avatarUrl
            }
          ])
          .select()
          .single();

        if (insertErr) throw insertErr;

        await supabase.from("enrollments").insert([
          {
            student_id: newS.id,
            academic_year: studentForm.academic_year,
            class_name: studentForm.class,
            section: studentForm.section,
            roll_number: "01"
          }
        ]);

        await supabase.from("user_accounts").insert([
          {
            user_id_code: studentForm.admission_number.trim(),
            password_hash: "123456",
            role: "student",
            full_name: `${studentForm.first_name} ${studentForm.last_name}`.trim(),
            is_first_login: true
          }
        ]);

        alert(`Student added! Login ID: ${studentForm.admission_number}, Password: 123456`);
      }

      await fetchStudents();
      setIsAddStudentOpen(false);
      resetStudentForm();
    } catch (err: any) {
      alert(err.message || "Failed to save student record");
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetStudentForm = () => {
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
  };

  const handleEditClick = (student: Student) => {
    setStudentForm({
      id: student.id,
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender || "male",
      date_of_birth: student.date_of_birth,
      blood_group: student.blood_group || "A+",
      father_name: student.father_name || "",
      mother_name: student.mother_name || "",
      guardian_phone: student.guardian_phone || "",
      address: student.address || "",
      class: student.class || "Class 9",
      section: student.section || "A",
      academic_year: student.academic_year || "2026",
      avatar_url: student.avatar_url || ""
    });
    setPhotoPreview(student.avatar_url || null);
    setIsEditing(true);
    setSelectedStudentProfile(null);
    setIsAddStudentOpen(true);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      setStudents(students.filter((s) => s.id !== id));
      setSelectedStudentProfile(null);
      alert("Student deleted successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to delete student");
    }
  };

  // --- Add Teacher Handler ---
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSubmitting(true);

    try {
      const { error: tErr } = await supabase
        .from("teachers")
        .insert([
          {
            teacher_id: teacherForm.teacher_id.trim(),
            full_name: teacherForm.full_name.trim(),
            designation: teacherForm.designation,
            subject_speciality: teacherForm.subject_speciality,
            phone: teacherForm.phone.trim(),
            email: teacherForm.email.trim(),
            joining_date: teacherForm.joining_date,
            avatar_url: teacherForm.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
          }
        ]);

      if (tErr) throw tErr;

      await supabase.from("user_accounts").insert([
        {
          user_id_code: teacherForm.teacher_id.trim(),
          password_hash: "123456",
          role: "teacher",
          full_name: teacherForm.full_name.trim(),
          is_first_login: false
        }
      ]);

      alert(`Teacher registered! Login ID: ${teacherForm.teacher_id}, Password: 123456`);
      await fetchTeachers();
      setIsAddTeacherOpen(false);
      setTeacherForm({
        teacher_id: "",
        full_name: "",
        designation: "Assistant Teacher",
        subject_speciality: "Mathematics",
        phone: "",
        email: "",
        joining_date: "2026-01-01",
        avatar_url: ""
      });
    } catch (err: any) {
      alert(err.message || "Failed to add teacher");
    } finally {
      setTeacherSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove teacher ${name}?`)) return;

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      setTeachers(teachers.filter((t) => t.id !== id));
      alert("Teacher removed successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to delete teacher");
    }
  };

  // --- Save Daily Attendance Handler ---
  const handleSetStudentStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setAttMap((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = (targetStudents: Student[]) => {
    const updated = { ...attMap };
    targetStudents.forEach((s) => {
      updated[s.id] = "present";
    });
    setAttMap(updated);
  };

  const handleSaveAttendance = async (targetStudents: Student[]) => {
    setAttSaving(true);
    try {
      const records = targetStudents.map((s) => ({
        student_id: s.id,
        class_name: attClass,
        section: attSection,
        date: attDate,
        status: attMap[s.id] || "present"
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "student_id,date" });

      if (error) throw error;
      alert(`Attendance saved successfully for ${attDate}!`);
    } catch (err: any) {
      alert(err.message || "Failed to save attendance");
    } finally {
      setAttSaving(false);
    }
  };

  // Filters
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

  const classStudents = selectedClassView
    ? students.filter((s) => s.class === selectedClassView)
    : [];

  const attendanceTargetStudents = students.filter(
    (s) => s.class === attClass && (s.section || "A") === attSection
  );

  // Attendance stats for selected class
  const presentCount = attendanceTargetStudents.filter((s) => (attMap[s.id] || "present") === "present").length;
  const absentCount = attendanceTargetStudents.filter((s) => attMap[s.id] === "absent").length;
  const lateCount = attendanceTargetStudents.filter((s) => attMap[s.id] === "late").length;
  const attRate = attendanceTargetStudents.length > 0 ? Math.round((presentCount / attendanceTargetStudents.length) * 100) : 0;

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

  return (
    <div className="flex h-screen bg-[#070d1c] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0a1226] border-r border-slate-800/80 flex flex-col justify-between select-none shrink-0">
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
              { id: "marks", label: "Marks", icon: Award, roles: ["admin", "teacher", "student"] },
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
        <header className="h-16 border-b border-slate-800/80 bg-[#0a1226]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
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
          {/* ================= 1. ATTENDANCE TAB ================= */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ADMIN & TEACHER ATTENDANCE PORTAL */}
              {isRole !== "student" ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Daily Attendance Sheet</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Select date, class and mark student attendance (Present, Absent, Late)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkAllPresent(attendanceTargetStudents)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        Mark All Present
                      </button>
                      <button
                        onClick={() => handleSaveAttendance(attendanceTargetStudents)}
                        disabled={attSaving || attendanceTargetStudents.length === 0}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        {attSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                        Save Attendance
                      </button>
                    </div>
                  </div>

                  {/* Attendance Controls Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Date *</label>
                      <input
                        type="date"
                        value={attDate}
                        onChange={(e) => setAttDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
                      <select
                        value={attClass}
                        onChange={(e) => setAttClass(e.target.value)}
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
                        value={attSection}
                        onChange={(e) => setAttSection(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Attendance Rate</span>
                        <span className="text-lg font-bold text-amber-400 font-mono">{attRate}%</span>
                      </div>
                      <div className="h-9 w-px bg-slate-800"></div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Present / Total</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {presentCount} / {attendanceTargetStudents.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance List Table */}
                  {attLoading ? (
                    <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                      <p>Loading attendance sheet...</p>
                    </div>
                  ) : attendanceTargetStudents.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                      <p className="text-base font-semibold text-slate-300">No students enrolled in {attClass} (Sec {attSection})</p>
                      <p className="text-xs text-slate-500 mt-1">Select another class or enroll students from Students menu.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-4 px-6">Photo</th>
                            <th className="py-4 px-4">Admission No</th>
                            <th className="py-4 px-4">Student Name</th>
                            <th className="py-4 px-4">Gender</th>
                            <th className="py-4 px-6 text-right">Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {attendanceTargetStudents.map((student) => {
                            const status = attMap[student.id] || "present";
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
                                <td className="py-3 px-4 capitalize text-slate-400 text-xs">
                                  {student.gender}
                                </td>
                                <td className="py-3 px-6 text-right">
                                  <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "present")}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        status === "present"
                                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                          : "text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "late")}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        status === "late"
                                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                          : "text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      Late
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "absent")}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        status === "absent"
                                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                          : "text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Absent
                                    </button>
                                  </div>
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
                /* STUDENT VIEW: MY ATTENDANCE RECORD */
                <div className="space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">My Attendance Report</h2>
                      <p className="text-sm text-slate-400 mt-1">Daily presence records for Academic Year 2026</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Overall Presence</span>
                      <span className="text-2xl font-bold text-emerald-400 font-mono">
                        {studentMyAtt.length > 0
                          ? Math.round((studentMyAtt.filter((a) => a.status === "present").length / studentMyAtt.length) * 100)
                          : 100}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {studentMyAtt.length === 0 ? (
                      <p className="text-center py-16 text-slate-500 text-sm">No attendance records logged yet.</p>
                    ) : (
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-4">Class</th>
                            <th className="py-4 px-4">Section</th>
                            <th className="py-4 px-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {studentMyAtt.map((att) => (
                            <tr key={att.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3 px-6 font-mono text-white">{att.date}</td>
                              <td className="py-3 px-4 text-slate-300">{att.class_name}</td>
                              <td className="py-3 px-4 text-slate-300">Sec {att.section}</td>
                              <td className="py-3 px-6 text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  att.status === "present"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : att.status === "late"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {att.status}
                                </span>
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

          {/* ================= 2. CLASSES TAB ================= */}
          {activeTab === "classes" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {selectedClassView ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedClassView(null)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                          {selectedClassView}
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {classStudents.length} Students
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Enrolled students in this class for Academic Year 2026
                        </p>
                      </div>
                    </div>
                  </div>

                  {classStudents.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                      <p className="text-base font-semibold text-slate-300">No students enrolled in {selectedClassView}</p>
                      <p className="text-xs text-slate-500 mt-1">Go to Students menu to add students to this class.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-4 px-6">Photo</th>
                              <th className="py-4 px-4">Admission No</th>
                              <th className="py-4 px-4">Student Name</th>
                              <th className="py-4 px-4">Section</th>
                              <th className="py-4 px-4">Gender</th>
                              <th className="py-4 px-4">Guardian Phone</th>
                              <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {classStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-4 px-6">
                                  <img
                                    src={student.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                                    alt="Passport"
                                    className="w-10 h-12 object-cover rounded-lg border border-slate-700 shadow-sm"
                                  />
                                </td>
                                <td className="py-4 px-4 font-mono font-medium text-amber-400">
                                  {student.admission_number}
                                </td>
                                <td className="py-4 px-4 font-semibold text-white">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="py-4 px-4">
                                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-950 border border-slate-800 text-slate-200">
                                    Section {student.section || "A"}
                                  </span>
                                </td>
                                <td className="py-4 px-4 capitalize text-slate-400">{student.gender}</td>
                                <td className="py-4 px-4 text-slate-400 font-mono text-xs">{student.guardian_phone || "—"}</td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => setSelectedStudentProfile(student)}
                                    title="View Profile"
                                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
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
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Academic Classes</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Select any class from Play to Class 12 to view its enrolled students
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {CLASS_LIST.map((className) => {
                      const count = students.filter((s) => s.class === className).length;
                      return (
                        <div
                          key={className}
                          onClick={() => setSelectedClassView(className)}
                          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm group-hover:scale-110 transition">
                              <BookOpen className="w-5 h-5" />
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-950 text-slate-400 border border-slate-800">
                              Sec A, B
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                            {className}
                          </h3>

                          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>Students:</span>
                            <span className="font-bold text-amber-400 font-mono text-sm">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 3. TEACHERS TAB ================= */}
          {activeTab === "teachers" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Teachers Management</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Manage faculty members, designations, subjects and login credentials
                  </p>
                </div>
                {isRole === "admin" && (
                  <button
                    onClick={() => {
                      const nextId = `TCH-2026-${String(teachers.length + 1).padStart(3, "0")}`;
                      setTeacherForm({
                        ...teacherForm,
                        teacher_id: nextId
                      });
                      setIsAddTeacherOpen(true);
                    }}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add Teacher
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400">
                  Total Faculty: <b className="text-amber-400 font-mono">{teachers.length} Teachers</b>
                </span>
                <div className="relative w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, ID or subject..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                  />
                </div>
              </div>

              {/* Teachers Cards Grid */}
              {loadingTeachers ? (
                <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                  <p>Loading faculty records...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <UserCheck className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-base font-semibold text-slate-300">No teachers found</p>
                  <p className="text-xs text-slate-500 mt-1">Click "Add Teacher" to register faculty members.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative hover:border-slate-700 transition"
                    >
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                        <img
                          src={teacher.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={teacher.full_name}
                          className="w-16 h-18 object-cover rounded-xl border border-slate-700 shadow-sm"
                        />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="text-lg font-bold text-white truncate">{teacher.full_name}</h3>
                          <p className="text-xs text-amber-400 font-mono font-semibold">{teacher.teacher_id}</p>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {teacher.designation}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4 text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Speciality: <b className="text-slate-200">{teacher.subject_speciality || "All"}</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono">{teacher.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{teacher.email || "—"}</span>
                        </div>
                      </div>

                      {isRole === "admin" && (
                        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}
                            title="Delete Teacher"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 4. STUDENTS TAB ================= */}
          {activeTab === "students" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Student Management</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Manage students, passport photos (35×45mm), and guardians directory
                  </p>
                </div>
                {isRole === "admin" && (
                  <button
                    onClick={() => {
                      resetStudentForm();
                      setIsAddStudentOpen(true);
                    }}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add Student
                  </button>
                )}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Class:</span>
                  </div>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="All">All Classes</option>
                    {CLASS_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 font-mono">
                    ({filteredStudents.length} Students)
                  </span>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, roll, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
              </div>

              {/* Students Table */}
              {loadingStudents ? (
                <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                  <p>Loading database records...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <User className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-base font-semibold text-slate-300">No students found</p>
                  <p className="text-xs text-slate-500 mt-1">Try another search or add a new student.</p>
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-4 px-6">Photo (35×45mm)</th>
                          <th className="py-4 px-4">Admission No</th>
                          <th className="py-4 px-4">Student Name</th>
                          <th className="py-4 px-4">Class & Sec</th>
                          <th className="py-4 px-4">Guardian & Phone</th>
                          <th className="py-4 px-4">Blood Group</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-4 px-6">
                              <img
                                src={student.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                                alt="Passport"
                                className="w-10 h-12 object-cover rounded-lg border border-slate-700 shadow-sm"
                              />
                            </td>
                            <td className="py-4 px-4 font-mono font-medium text-amber-400">
                              {student.admission_number}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => setSelectedStudentProfile(student)}
                                className="font-semibold text-white hover:text-amber-400 transition text-left cursor-pointer"
                              >
                                {student.first_name} {student.last_name}
                              </button>
                              <p className="text-[11px] text-slate-500 capitalize">{student.gender}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-200">
                                {student.class} ({student.section || "A"})
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs">
                              <p className="text-slate-300 font-medium">{student.father_name || "—"}</p>
                              <p className="text-slate-500 font-mono mt-0.5">{student.guardian_phone || "—"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {student.blood_group || "N/A"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedStudentProfile(student)}
                                  title="Full Profile"
                                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {isRole === "admin" && (
                                  <>
                                    <button
                                      onClick={() => handleEditClick(student)}
                                      title="Edit Student"
                                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                                      title="Delete"
                                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
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

          {/* ================= 5. DASHBOARD TAB ================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: "Total Students", value: students.length, icon: Users, color: "text-amber-400", tab: "students" },
                  { label: "Total Faculty", value: teachers.length, icon: UserCheck, color: "text-blue-400", tab: "teachers" },
                  { label: "Total Classes", value: CLASS_LIST.length, icon: BookOpen, color: "text-emerald-400", tab: "classes" },
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

          {/* ================= 6. OTHER TABS ================= */}
          {activeTab !== "students" && activeTab !== "teachers" && activeTab !== "classes" && activeTab !== "dashboard" && activeTab !== "attendance" && (
            <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white capitalize">{activeTab} Section</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Current Role: <b>{isRole}</b>. Proceeding to Phase 6 & beyond for this module.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL 1: ADD / EDIT STUDENT ================= */}
      {isAddStudentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddStudentOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isEditing ? "Edit Student Profile" : "Add New Student"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Academic Year: 2026 • Samir Academy Records
                </p>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-5">
              <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-24 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                    {processingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    ) : photoPreview ? (
                      <img src={photoPreview} alt="Passport" className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200">Passport Photo (Auto 35mm×45mm Crop)</h4>
                  <p className="text-[11px] text-slate-500">
                    Upload any image; it will automatically center-crop and compress under 200 KB.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariqul"
                    value={studentForm.first_name}
                    onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Islam"
                    value={studentForm.last_name}
                    onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="SA-2026-002"
                    value={studentForm.admission_number}
                    onChange={(e) => setStudentForm({ ...studentForm, admission_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Class *</label>
                  <select
                    value={studentForm.class}
                    onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {CLASS_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section *</label>
                  <select
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                  <input
                    type="text"
                    disabled
                    value={studentForm.academic_year}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm font-mono text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={studentForm.date_of_birth}
                    onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={studentForm.blood_group}
                    onChange={(e) => setStudentForm({ ...studentForm, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Father's Name</label>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    value={studentForm.father_name}
                    onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    placeholder="Mother's full name"
                    value={studentForm.mother_name}
                    onChange={(e) => setStudentForm({ ...studentForm, mother_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="018XXXXXXXX"
                    value={studentForm.guardian_phone}
                    onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Village, Road, Thana, District"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-sm font-medium text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || processingPhoto}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? "Update Student Profile" : "Save Student & Create ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FULL STUDENT PROFILE VIEW ================= */}
      {selectedStudentProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudentProfile(null);
          }}
        >
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudentProfile(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
              <img
                src={selectedStudentProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt="Avatar"
                className="w-20 h-24 object-cover rounded-2xl border-2 border-amber-500/50 shadow-md"
              />
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedStudentProfile.first_name} {selectedStudentProfile.last_name}
                </h3>
                <p className="text-sm font-mono text-amber-400 font-bold mt-0.5">
                  ID: {selectedStudentProfile.admission_number}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedStudentProfile.class} • Sec {selectedStudentProfile.section || "A"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedStudentProfile.blood_group || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-6 text-sm">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date of Birth
                </span>
                <p className="font-semibold text-slate-200 mt-1">{selectedStudentProfile.date_of_birth}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Gender
                </span>
                <p className="font-semibold text-slate-200 mt-1 capitalize">{selectedStudentProfile.gender}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500">Father's Name</span>
                <p className="font-semibold text-slate-200 mt-1">{selectedStudentProfile.father_name || "—"}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500">Mother's Name</span>
                <p className="font-semibold text-slate-200 mt-1">{selectedStudentProfile.mother_name || "—"}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Guardian Phone
                </span>
                <p className="font-semibold text-amber-400 font-mono mt-1">{selectedStudentProfile.guardian_phone || "—"}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Residential Address
                </span>
                <p className="font-semibold text-slate-200 mt-1 truncate">{selectedStudentProfile.address || "—"}</p>
              </div>
            </div>

            {isRole === "admin" && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleEditClick(selectedStudentProfile)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => handleDeleteStudent(selectedStudentProfile.id, `${selectedStudentProfile.first_name} ${selectedStudentProfile.last_name}`)}
                  className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-bold rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD TEACHER ================= */}
      {isAddTeacherOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddTeacherOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Register Faculty Member</h3>
                <p className="text-xs text-slate-400 mt-0.5">Creates a teacher profile & login credentials</p>
              </div>
              <button
                onClick={() => setIsAddTeacherOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teacher Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahbubul Alam"
                    value={teacherForm.full_name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teacher ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="TCH-2026-002"
                    value={teacherForm.teacher_id}
                    onChange={(e) => setTeacherForm({ ...teacherForm, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation *</label>
                  <select
                    value={teacherForm.designation}
                    onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Headmaster">Headmaster</option>
                    <option value="Assistant Headmaster">Assistant Headmaster</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Assistant Teacher">Assistant Teacher</option>
                    <option value="Junior Teacher">Junior Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Speciality *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, English"
                    value={teacherForm.subject_speciality}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject_speciality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="teacher@academy.com"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Paste image link or leave blank"
                  value={teacherForm.avatar_url}
                  onChange={(e) => setTeacherForm({ ...teacherForm, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-sm font-medium text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teacherSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {teacherSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Teacher & Create ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
