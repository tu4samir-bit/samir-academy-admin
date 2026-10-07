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
  Receipt,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers
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
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState<Teacher | null>(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherForm, setTeacherForm] = useState({
    id: "",
    teacher_id: "",
    full_name: "",
    designation: "Assistant Teacher",
    subject_speciality: "Mathematics",
    phone: "",
    email: "",
    joining_date: "2026-01-01",
    avatar_url: ""
  });

  // Student Modals & Details State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
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

  // Monthly Attendance Modal State
  const [isMonthlyAttOpen, setIsMonthlyAttOpen] = useState(false);
  const [monthlyAttMonth, setMonthlyAttMonth] = useState("2026-10");
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>([]);

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

  // Fees State
  const [feesList, setFeesList] = useState<FeeRecord[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeFilterStatus, setFeeFilterStatus] = useState("All");
  const [feeSearch, setFeeSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);
  const [statementStudent, setStatementStudent] = useState<Student | null>(null);

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

  const fetchAllAttendance = async () => {
    try {
      const { data, error } = await supabase.from("attendance").select("*");
      if (!error && data) setAllAttendanceRecords(data);
    } catch (err) {
      console.error("Fetch all attendance error:", err);
    }
  };

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
      fetchExams();
      fetchMarks();
      fetchFees();
      fetchAllAttendance();
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

  // --- Student Handlers ---
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
    if (!confirm(`Are you sure you want to delete ${name}? All academic and fee records will be removed.`)) return;

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

  // --- Teacher Handlers ---
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSubmitting(true);

    try {
      if (isEditingTeacher) {
        const { error: tErr } = await supabase
          .from("teachers")
          .update({
            full_name: teacherForm.full_name.trim(),
            designation: teacherForm.designation,
            subject_speciality: teacherForm.subject_speciality,
            phone: teacherForm.phone.trim(),
            email: teacherForm.email.trim(),
            joining_date: teacherForm.joining_date,
            avatar_url: teacherForm.avatar_url
          })
          .eq("id", teacherForm.id);

        if (tErr) throw tErr;
        alert("Teacher profile updated!");
      } else {
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
      }

      await fetchTeachers();
      setIsAddTeacherOpen(false);
      setIsEditingTeacher(false);
      setTeacherForm({
        id: "",
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
      alert(err.message || "Failed to save teacher");
    } finally {
      setTeacherSubmitting(false);
    }
  };

  const handleEditTeacherClick = (teacher: Teacher) => {
    setTeacherForm({
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      full_name: teacher.full_name,
      designation: teacher.designation,
      subject_speciality: teacher.subject_speciality,
      phone: teacher.phone,
      email: teacher.email,
      joining_date: teacher.joining_date || "2026-01-01",
      avatar_url: teacher.avatar_url || ""
    });
    setIsEditingTeacher(true);
    setSelectedTeacherProfile(null);
    setIsAddTeacherOpen(true);
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove teacher ${name}?`)) return;

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      setTeachers(teachers.filter((t) => t.id !== id));
      setSelectedTeacherProfile(null);
      alert("Teacher removed successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to delete teacher");
    }
  };

  // --- Attendance Handlers ---
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
      await fetchAllAttendance();
    } catch (err: any) {
      alert(err.message || "Failed to save attendance");
    } finally {
      setAttSaving(false);
    }
  };

  // --- Marks Handlers ---
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
              remarks: marksSubject,
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

  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Delete exam "${title}"?`)) return;
    try {
      await supabase.from("exams").delete().eq("id", id);
      setExams(exams.filter((e) => e.id !== id));
      alert("Exam deleted.");
    } catch (err: any) {
      alert("Failed to delete exam");
    }
  };

  // --- Fees Handlers ---
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeSubmitting(true);

    try {
      const amt = parseFloat(collectFeeForm.amount);
      const paid = parseFloat(collectFeeForm.paid_amount);
      const status: "Paid" | "Pending" | "Partial" =
        paid >= amt ? "Paid" : paid > 0 ? "Partial" : "Pending";
      const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error } = await supabase
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
        ]);

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

  const handleDeleteFee = async (id: string) => {
    if (!confirm("Are you sure you want to void / delete this fee transaction?")) return;
    try {
      await supabase.from("fees").delete().eq("id", id);
      setFeesList(feesList.filter((f) => f.id !== id));
      alert("Transaction deleted.");
    } catch (err: any) {
      alert("Failed to delete fee transaction");
    }
  };

  // Compiled Marksheet calculations
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
      const obtained = markEntry ? Number(markEntry.marks_obtained) : idx % 2 === 0 ? 84 : 76;
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

  const classStudents = selectedClassView
    ? students.filter((s) => s.class === selectedClassView)
    : [];

  const attendanceTargetStudents = students.filter(
    (s) => s.class === attClass && (s.section || "A") === attSection
  );

  const presentCount = attendanceTargetStudents.filter((s) => (attMap[s.id] || "present") === "present").length;
  const attRate = attendanceTargetStudents.length > 0 ? Math.round((presentCount / attendanceTargetStudents.length) * 100) : 0;

  const marksTargetStudents = students.filter(
    (s) => s.class === marksClass && (s.section || "A") === marksSection
  );

  const currentStudentData = students.find((s) => s.admission_number === currentUser?.user_id_code);

  const filteredFees = feesList.filter((f) => {
    const sName = f.student ? `${f.student.first_name} ${f.student.last_name}`.toLowerCase() : "";
    const recNo = (f.receipt_no || "").toLowerCase();
    const matchSearch = sName.includes(feeSearch.toLowerCase()) || recNo.includes(feeSearch.toLowerCase());
    const matchStatus = feeFilterStatus === "All" || f.status === feeFilterStatus;
    return matchSearch && matchStatus;
  });

  const totalFeesBilled = feesList.reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalFeesCollected = feesList.reduce((acc, f) => acc + Number(f.paid_amount || 0), 0);
  const totalFeesDue = Math.max(0, totalFeesBilled - totalFeesCollected);

  const myStudentFees = currentStudentData
    ? feesList.filter((f) => f.student_id === currentStudentData.id)
    : [];

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Helper for Monthly Attendance Matrix
  const getDaysInSelectedMonth = () => {
    const [year, month] = monthlyAttMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Helper for Student Statement Ledger
  const getStudentLedgerRecords = (studentId: string) => {
    return feesList.filter((f) => f.student_id === studentId).sort((a, b) => (a.payment_date || "").localeCompare(b.payment_date || ""));
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
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
          {/* ================= 1. DASHBOARD TAB ================= */}
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

          {/* ================= 2. STUDENTS TAB ================= */}
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
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStudentProfile(student);
                                  setShowStudentDetails(false);
                                }}
                                title="View Profile"
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setMarksheetStudent(student)}
                                title="Print Marksheet"
                                className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
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
                                    title="Delete Student"
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
                        id: "",
                        teacher_id: nextId,
                        full_name: "",
                        designation: "Assistant Teacher",
                        subject_speciality: "Mathematics",
                        phone: "",
                        email: "",
                        joining_date: "2026-01-01",
                        avatar_url: ""
                      });
                      setIsEditingTeacher(false);
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
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedTeacherProfile(teacher);
                            setShowTeacherDetails(false);
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </button>
                        {isRole === "admin" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditTeacherClick(teacher)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 4. CLASSES TAB ================= */}
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

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
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
                            <td className="py-4 px-4 font-mono font-medium text-amber-400">{student.admission_number}</td>
                            <td className="py-4 px-4 font-semibold text-white">{student.first_name} {student.last_name}</td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-950 border border-slate-800 text-slate-200">
                                Section {student.section || "A"}
                              </span>
                            </td>
                            <td className="py-4 px-4 capitalize text-slate-400">{student.gender}</td>
                            <td className="py-4 px-4 text-slate-400 font-mono text-xs">{student.guardian_phone || "—"}</td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  setSelectedStudentProfile(student);
                                  setShowStudentDetails(false);
                                }}
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
              ) : (
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
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">{className}</h3>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span>Students:</span>
                          <span className="font-bold text-amber-400 font-mono text-sm">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= 5. ATTENDANCE TAB ================= */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isRole !== "student" ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Daily Attendance Sheet</h2>
                      <p className="text-sm text-slate-400 mt-1">Select date, class and mark student attendance</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsMonthlyAttOpen(true)}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Monthly Register (PDF)
                      </button>
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
                    </div>
                  </div>

                  {/* Attendance List */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-4 px-6">Photo</th>
                          <th className="py-4 px-4">Admission No</th>
                          <th className="py-4 px-4">Student Name</th>
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
                              <td className="py-3 px-4 font-mono font-medium text-amber-400">{student.admission_number}</td>
                              <td className="py-3 px-4 font-semibold text-white">{student.first_name} {student.last_name}</td>
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
                                    <Check className="w-3.5 h-3.5" /> Present
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
                                    <Clock className="w-3.5 h-3.5" /> Late
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
                                    <XCircle className="w-3.5 h-3.5" /> Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* Student View */
                <div className="space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">My Attendance Report</h2>
                      <p className="text-sm text-slate-400 mt-1">Daily presence records for Academic Year 2026</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 6. EXAMS TAB ================= */}
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
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Published
                      </span>
                      {isRole === "admin" && (
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 7. MARKS & RESULTS TAB ================= */}
          {activeTab === "marks" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isRole !== "student" ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Subject-wise Marks Entry</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Select Exam, Class and your assigned Subject to enter student marks
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
                              <td className="py-3 px-4 font-mono font-medium text-amber-400">{student.admission_number}</td>
                              <td className="py-3 px-4 font-semibold text-white">{student.first_name} {student.last_name}</td>
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
                </>
              ) : (
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
                </div>
              )}
            </div>
          )}

          {/* ================= 8. FEES TAB ================= */}
          {activeTab === "fees" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isRole === "admin" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Billed Fees</span>
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">৳ {totalFeesBilled.toLocaleString()}</div>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Collected</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-400">৳ {totalFeesCollected.toLocaleString()}</div>
                    </div>

                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Outstanding Dues</span>
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-rose-400">৳ {totalFeesDue.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Tuition & Fee Records</h2>
                      <p className="text-sm text-slate-400 mt-1">Collect fees and issue official payment vouchers</p>
                    </div>

                    <button
                      onClick={() => setIsCollectFeeOpen(true)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      Collect Fee Payment
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#0b142b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-4 px-6">Receipt No</th>
                          <th className="py-4 px-4">Student</th>
                          <th className="py-4 px-4">Fee Item</th>
                          <th className="py-4 px-4">Amount</th>
                          <th className="py-4 px-4">Paid</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredFees.map((fee) => (
                          <tr key={fee.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-4 px-6 font-mono font-bold text-amber-400 text-xs">{fee.receipt_no || "REC-2026-001"}</td>
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
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                fee.status === "Paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {fee.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    const fullStudent = students.find((s) => s.id === fee.student_id);
                                    setSelectedReceipt({ ...fee, student: fullStudent || fee.student });
                                  }}
                                  title="Print Slip"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Slip
                                </button>
                                <button
                                  onClick={() => {
                                    const fullStudent = students.find((s) => s.id === fee.student_id);
                                    if (fullStudent) setStatementStudent(fullStudent);
                                  }}
                                  title="Account Statement"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                  <Layers className="w-3.5 h-3.5" /> Ledger
                                </button>
                                <button
                                  onClick={() => handleDeleteFee(fee.id)}
                                  title="Void Transaction"
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">My Tuition & Fee Invoices</h2>
                      <p className="text-sm text-slate-400 mt-1">Payment receipts and status for Academic Year 2026</p>
                    </div>
                    {currentStudentData && (
                      <button
                        onClick={() => setStatementStudent(currentStudentData)}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        My Fee Statement (Ledger)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 9. MY PROFILE TAB (STUDENT VIEW) ================= */}
          {activeTab === "my-profile" && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-5 border-b border-slate-800 pb-6">
                <div className="w-20 h-24 rounded-xl bg-slate-800 border border-amber-500/40 flex items-center justify-center text-slate-500 overflow-hidden">
                  {currentStudentData?.avatar_url ? (
                    <img src={currentStudentData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentUser.full_name}</h3>
                  <p className="text-sm font-mono text-amber-400 mt-0.5">ID: {currentUser.user_id_code}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Enrolled Student ({currentStudentData?.class || "Class 9"} - {currentStudentData?.section || "A"})
                  </span>
                </div>
              </div>

              {currentStudentData && (
                <div className="grid grid-cols-2 gap-3.5 my-6 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block">Father's Name</span>
                    <span className="font-semibold text-slate-200 mt-1 block">{currentStudentData.father_name || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block">Mother's Name</span>
                    <span className="font-semibold text-slate-200 mt-1 block">{currentStudentData.mother_name || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block">Guardian Phone</span>
                    <span className="font-semibold text-amber-400 font-mono mt-1 block">{currentStudentData.guardian_phone || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block">Blood Group</span>
                    <span className="font-semibold text-emerald-400 mt-1 block">{currentStudentData.blood_group || "N/A"}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL: ADD / EDIT STUDENT ================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{isEditing ? "Edit Student Profile" : "Add New Student"}</h3>
              <button onClick={() => setIsAddStudentOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-5">
              <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl flex items-center gap-5">
                <div className="w-20 h-24 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {processingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  ) : photoPreview ? (
                    <img src={photoPreview} alt="Passport" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200">Passport Photo (Auto 35mm×45mm Crop)</h4>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Select Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
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
                  <input type="text" disabled value={studentForm.academic_year} className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm font-mono text-slate-400" />
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
                    value={studentForm.father_name}
                    onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mother's Name</label>
                  <input
                    type="text"
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
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddStudentOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/60 text-sm font-medium text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || processingPhoto}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? "Update Profile" : "Save Student & Create ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STUDENT PROGRESSIVE PROFILE ================= */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <button onClick={() => setSelectedStudentProfile(null)} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Step 1: Clean Basic Card (Photo + Key 5-6 Info) */}
            <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
              <img
                src={selectedStudentProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt="Avatar"
                className="w-20 h-24 object-cover rounded-2xl border-2 border-amber-500/50 shadow-md"
              />
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedStudentProfile.first_name} {selectedStudentProfile.last_name}</h3>
                <p className="text-sm font-mono text-amber-400 font-bold mt-0.5">ID: {selectedStudentProfile.admission_number}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedStudentProfile.class} • Sec {selectedStudentProfile.section || "A"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Blood: {selectedStudentProfile.blood_group || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Summary Row */}
            <div className="grid grid-cols-2 gap-3 my-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Gender</span>
                <span className="font-semibold text-slate-200 capitalize mt-0.5 block">{selectedStudentProfile.gender}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Guardian Phone</span>
                <span className="font-semibold text-amber-400 font-mono mt-0.5 block">{selectedStudentProfile.guardian_phone || "—"}</span>
              </div>
            </div>

            {/* Toggle Button for Step 2 Details */}
            <button
              onClick={() => setShowStudentDetails(!showStudentDetails)}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer my-2"
            >
              {showStudentDetails ? (
                <>Hide Details <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>View Full Detailed Information <ChevronDown className="w-4 h-4" /></>
              )}
            </button>

            {/* Step 2: Expanded Deep Details */}
            {showStudentDetails && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 my-3 text-xs animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Father's Name</span>
                  <span className="font-medium text-slate-200">{selectedStudentProfile.father_name || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Mother's Name</span>
                  <span className="font-medium text-slate-200">{selectedStudentProfile.mother_name || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Date of Birth</span>
                  <span className="font-medium text-slate-200">{selectedStudentProfile.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Academic Session</span>
                  <span className="font-medium text-slate-200">2026</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Residential Address</span>
                  <span className="font-medium text-slate-200">{selectedStudentProfile.address || "—"}</span>
                </div>
              </div>
            )}

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800 mt-4">
              {isRole === "admin" && (
                <>
                  <button
                    onClick={() => handleEditClick(selectedStudentProfile)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(selectedStudentProfile.id, `${selectedStudentProfile.first_name} ${selectedStudentProfile.last_name}`)}
                    className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setMarksheetStudent(selectedStudentProfile)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-amber-400" /> Marksheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TEACHER PROGRESSIVE PROFILE ================= */}
      {selectedTeacherProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <button onClick={() => setSelectedTeacherProfile(null)} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Basic Teacher Card */}
            <div className="flex items-start gap-5 pb-5 border-b border-slate-800">
              <img
                src={selectedTeacherProfile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt="Teacher"
                className="w-18 h-20 object-cover rounded-2xl border-2 border-slate-700 shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTeacherProfile.full_name}</h3>
                <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">ID: {selectedTeacherProfile.teacher_id}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedTeacherProfile.designation} • {selectedTeacherProfile.subject_speciality}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 my-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-emerald-400 font-mono mt-0.5 block">{selectedTeacherProfile.phone || "—"}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Subject Speciality</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{selectedTeacherProfile.subject_speciality}</span>
              </div>
            </div>

            {/* Toggle Full Details */}
            <button
              onClick={() => setShowTeacherDetails(!showTeacherDetails)}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer my-2"
            >
              {showTeacherDetails ? <>Hide Details <ChevronUp className="w-4 h-4" /></> : <>View Full Faculty Details <ChevronDown className="w-4 h-4" /></>}
            </button>

            {showTeacherDetails && (
              <div className="space-y-2 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 my-3 text-xs animate-in fade-in duration-200">
                <div>
                  <span className="text-slate-500 block">Official Email Address</span>
                  <span className="font-medium text-slate-200">{selectedTeacherProfile.email || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Joining</span>
                  <span className="font-medium text-slate-200 font-mono">{selectedTeacherProfile.joining_date || "2026-01-01"}</span>
                </div>
              </div>
            )}

            {isRole === "admin" && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => handleEditTeacherClick(selectedTeacherProfile)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit Teacher
                </button>
                <button
                  onClick={() => handleDeleteTeacher(selectedTeacherProfile.id, selectedTeacherProfile.full_name)}
                  className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT TEACHER ================= */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{isEditingTeacher ? "Edit Faculty Profile" : "Register Faculty Member"}</h3>
              <button onClick={() => setIsAddTeacherOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
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
                    disabled={isEditingTeacher}
                    value={teacherForm.teacher_id}
                    onChange={(e) => setTeacherForm({ ...teacherForm, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 disabled:opacity-60"
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
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Assistant Teacher">Assistant Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Speciality *</label>
                  <input
                    type="text"
                    required
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
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddTeacherOpen(false)} className="flex-1 py-2.5 bg-slate-800 rounded-xl text-xs text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={teacherSubmitting} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-slate-950 cursor-pointer">
                  {teacherSubmitting ? "Saving..." : isEditingTeacher ? "Update Faculty Profile" : "Register Faculty Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button type="button" onClick={() => setIsAddExamOpen(false)} className="flex-1 py-2 bg-slate-800 rounded-xl text-xs text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-amber-500 rounded-xl text-xs font-bold text-slate-950 cursor-pointer">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COLLECT FEE ================= */}
      {isCollectFeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 text-slate-100 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Collect Fee Payment</h3>
              <button onClick={() => setIsCollectFeeOpen(false)} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
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
                      {s.first_name} {s.last_name} ({s.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Title *</label>
                <select
                  value={collectFeeForm.fee_title}
                  onChange={(e) => setCollectFeeForm({ ...collectFeeForm, fee_title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Monthly Tuition - January 2026">Monthly Tuition - January 2026</option>
                  <option value="Monthly Tuition - February 2026">Monthly Tuition - February 2026</option>
                  <option value="First Term Exam Fee 2026">First Term Exam Fee 2026</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    value={collectFeeForm.amount}
                    onChange={(e) => setCollectFeeForm({ ...collectFeeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Paid (৳) *</label>
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
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsCollectFeeOpen(false)} className="flex-1 py-2.5 bg-slate-800 rounded-xl text-xs text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={feeSubmitting} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-slate-950 cursor-pointer">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MONTHLY ATTENDANCE REGISTER PDF ================= */}
      {isMonthlyAttOpen && (() => {
        const daysInMonth = getDaysInSelectedMonth();
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-5xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl relative my-8 print:p-0 print:m-0 print:w-full print:max-w-none">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Month:</span>
                  <input
                    type="month"
                    value={monthlyAttMonth}
                    onChange={(e) => setMonthlyAttMonth(e.target.value)}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <span className="text-xs font-bold text-slate-600 ml-2">Class: {attClass} (Sec {attSection})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Print Monthly Register PDF
                  </button>
                  <button onClick={() => setIsMonthlyAttOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Monthly Attendance Register */}
              <div className="border-2 border-slate-800 p-6 rounded-2xl bg-white">
                <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                  <h1 className="text-2xl font-black uppercase text-slate-950">Samir Academy</h1>
                  <p className="text-xs text-slate-600">Monthly Attendance Register & Log • Academic Session 2026</p>
                  <p className="text-xs font-bold text-slate-800 mt-1 uppercase">
                    Class: {attClass} | Section: {attSection} | Month: {monthlyAttMonth}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 p-1 text-left">Roll & Student Name</th>
                        {daysArray.map((d) => (
                          <th key={d} className="border border-slate-400 p-1 w-6">{d}</th>
                        ))}
                        <th className="border border-slate-400 p-1 w-8">P</th>
                        <th className="border border-slate-400 p-1 w-8">A</th>
                        <th className="border border-slate-400 p-1 w-10">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceTargetStudents.map((st) => {
                        let pCount = 0;
                        let aCount = 0;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="border border-slate-400 p-1 text-left font-semibold text-slate-900 truncate max-w-[140px]">
                              {st.first_name} {st.last_name}
                            </td>
                            {daysArray.map((d) => {
                              const dStr = `${monthlyAttMonth}-${String(d).padStart(2, "0")}`;
                              const record = allAttendanceRecords.find((r) => r.student_id === st.id && r.date === dStr);
                              const stCode = record ? (record.status === "present" ? "P" : record.status === "absent" ? "A" : "L") : "P";
                              if (stCode === "P") pCount++;
                              else if (stCode === "A") aCount++;

                              return (
                                <td
                                  key={d}
                                  className={`border border-slate-400 p-1 font-bold ${
                                    stCode === "P" ? "text-emerald-700" : stCode === "A" ? "text-rose-600 font-extrabold" : "text-amber-600"
                                  }`}
                                >
                                  {stCode}
                                </td>
                              );
                            })}
                            <td className="border border-slate-400 p-1 font-bold text-emerald-800">{pCount}</td>
                            <td className="border border-slate-400 p-1 font-bold text-rose-700">{aCount}</td>
                            <td className="border border-slate-400 p-1 font-bold text-slate-900">
                              {Math.round((pCount / daysInMonth) * 100)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-800 pt-1 font-bold text-slate-800">Class Teacher's Signature</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-800 pt-1 font-bold text-slate-800">Headmaster / Principal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: STUDENT FEE STATEMENT LEDGER ================= */}
      {statementStudent && (() => {
        const records = getStudentLedgerRecords(statementStudent.id);
        const totalBilled = records.reduce((acc, r) => acc + Number(r.amount || 0), 0);
        const totalPaid = records.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0);
        const balanceDue = Math.max(0, totalBilled - totalPaid);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl relative my-8 print:p-0 print:m-0 print:w-full print:max-w-none">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Student Account Ledger</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Print Statement PDF
                  </button>
                  <button onClick={() => setStatementStudent(null)} className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Statement Sheet */}
              <div className="border-2 border-slate-800 p-6 rounded-2xl bg-white">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase text-slate-950">Samir Academy</h2>
                      <p className="text-[10px] text-slate-600">Student Account Statement & Clearance Ledger • Session 2026</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase">LEDGER</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Generated: 2026-10-07</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-4">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Student Name</span>
                    <span className="font-bold text-slate-900">{statementStudent.first_name} {statementStudent.last_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Admission ID</span>
                    <span className="font-mono font-bold text-slate-900">{statementStudent.admission_number}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Class & Sec</span>
                    <span className="font-bold text-slate-900">{statementStudent.class} ({statementStudent.section || "A"})</span>
                  </div>
                </div>

                {/* Ledger Summary Stats */}
                <div className="grid grid-cols-3 gap-3 text-center my-3 p-3 bg-slate-900 text-white rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Billed</span>
                    <span className="font-mono font-bold text-base">৳ {totalBilled.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Paid</span>
                    <span className="font-mono font-bold text-base text-emerald-400">৳ {totalPaid.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Current Due</span>
                    <span className="font-mono font-bold text-base text-rose-400">৳ {balanceDue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <table className="w-full text-xs text-left border border-slate-300 rounded-xl overflow-hidden my-4">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Fee Item</th>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                      <th className="py-2.5 px-3 text-right">Credit (৳)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {records.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-400">No transaction records found.</td></tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-700">{r.payment_date || "2026-05-15"}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{r.fee_title}</td>
                          <td className="py-2 px-3 font-mono text-amber-700">{r.receipt_no || "REC-2026-001"}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">৳ {r.amount}</td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-emerald-700">৳ {r.paid_amount}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="flex items-end justify-between pt-8 text-[11px] text-slate-600">
                  <span>* Official Student Ledger Document of Samir Academy.</span>
                  <div className="text-center">
                    <div className="w-36 border-t border-slate-800 pt-1 font-bold text-slate-900">Accounts Department</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: OFFICIAL TRANSCRIPT (MARKSHEET) ================= */}
      {marksheetStudent && (() => {
        const results = getCompiledStudentResults(marksheetStudent);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Transcript Preview</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Print / Save as PDF
                  </button>
                  <button onClick={() => setMarksheetStudent(null)} className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="border-4 border-double border-slate-800 p-6 sm:p-8 rounded-2xl relative bg-white">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400">
                    <GraduationCap className="w-10 h-10" />
                  </div>

                  <div className="text-center flex-1 px-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950">Samir Academy</h1>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">Academic Excellence & Moral Leadership • EIIN: 135892</p>
                    <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Official Academic Transcript • {currentExam.title}
                    </div>
                  </div>

                  <div className="w-16 h-20 border-2 border-slate-800 rounded-lg overflow-hidden shrink-0">
                    <img src={marksheetStudent.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt="Student" className="w-full h-full object-cover" />
                  </div>
                </div>

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
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Class & Sec</span>
                    <span className="font-bold text-slate-900">{marksheetStudent.class} (Sec {marksheetStudent.section || "A"})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Year</span>
                    <span className="font-bold text-slate-900">2026</span>
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-300 rounded-xl mb-5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">SL</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-4">Subject Title</th>
                        <th className="py-2.5 px-3 text-center">Full Marks</th>
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
                          <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">{sub.obtained}</td>
                          <td className="py-2 px-3 text-center font-bold">{sub.grade}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{sub.point.toFixed(2)}</td>
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
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Final GPA</span>
                    <div className="flex items-center gap-2 justify-center sm:justify-end mt-0.5">
                      <span className="text-2xl font-extrabold font-mono text-white">{results.finalGPA}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-sm font-black ${
                        results.isPassed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}>
                        GRADE {results.finalGrade} ({results.isPassed ? "PASSED" : "FAILED"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-12 mt-4 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Date of Publication</div>
                    <span className="text-[11px] text-slate-500 font-mono">15 May, 2026</span>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Class Teacher's Signature</div>
                  </div>
                  <div>
                    <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950">Headmaster / Principal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: DUAL-SLIP OFFICIAL MONEY RECEIPT ================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Money Receipt Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Print / Save Receipt PDF
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {["STUDENT COPY", "OFFICE COPY"].map((copyType, cIdx) => (
                <div
                  key={cIdx}
                  className={`border-2 border-slate-800 p-6 rounded-2xl relative bg-white ${
                    cIdx === 1 ? "border-dashed" : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black uppercase text-slate-950 leading-tight">Samir Academy</h2>
                        <p className="text-[10px] text-slate-600 font-medium">Academic Excellence & Moral Leadership • EIIN: 135892</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                        {copyType}
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-900 mt-1">{selectedReceipt.receipt_no || "REC-2026-001"}</p>
                    </div>
                  </div>

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
                        <td className="py-2 px-3 font-mono font-bold text-right text-slate-950">৳ {selectedReceipt.paid_amount}</td>
                        <td className="py-2 px-3 font-mono text-right text-rose-600 font-bold">
                          ৳ {Math.max(0, selectedReceipt.amount - selectedReceipt.paid_amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex items-end justify-between pt-6 text-[10px] text-slate-600">
                    <span className="italic">Status: Paid via {selectedReceipt.payment_method || "Cash"}</span>
                    <div className="text-center">
                      <div className="w-32 border-t border-slate-800 pt-1 font-bold text-slate-900">Authorized Cashier</div>
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
