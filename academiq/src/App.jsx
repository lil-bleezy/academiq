import { useState, useEffect } from "react";

// ─── Grading Utilities ───────────────────────────────────────────────────────

const markToGradePoint = (mark) => {
  if (mark >= 80) return 4.0; if (mark >= 75) return 3.7;
  if (mark >= 70) return 3.3; if (mark >= 65) return 3.0;
  if (mark >= 60) return 2.7; if (mark >= 55) return 2.3;
  if (mark >= 50) return 2.0; if (mark >= 45) return 1.7;
  if (mark >= 40) return 1.0; return 0.0;
};
const markToLetter = (mark) => {
  if (mark >= 80) return "A"; if (mark >= 75) return "A−";
  if (mark >= 70) return "B+"; if (mark >= 65) return "B";
  if (mark >= 60) return "B−"; if (mark >= 55) return "C+";
  if (mark >= 50) return "C"; if (mark >= 45) return "C−";
  if (mark >= 40) return "D"; return "F";
};
const classFromCWA = (cwa) => {
  if (cwa >= 70) return { label: "First Class Honours", color: "#22c55e", short: "1st" };
  if (cwa >= 60) return { label: "Second Class Upper", color: "#3b82f6", short: "2:1" };
  if (cwa >= 50) return { label: "Second Class Lower", color: "#a855f7", short: "2:2" };
  if (cwa >= 45) return { label: "Third Class", color: "#f59e0b", short: "3rd" };
  if (cwa >= 40) return { label: "Pass", color: "#6b7280", short: "Pass" };
  return { label: "Fail", color: "#ef4444", short: "Fail" };
};
const computeSemesterStats = (courses) => {
  let totalCredits = 0, weightedMark = 0, weightedGP = 0;
  courses.forEach((c) => {
    const final = c.examScore * 0.6 + c.caScore * 0.4;
    totalCredits += c.credits; weightedMark += final * c.credits;
    weightedGP += markToGradePoint(final) * c.credits;
  });
  return { cwa: totalCredits ? weightedMark / totalCredits : 0, gpa: totalCredits ? weightedGP / totalCredits : 0, totalCredits };
};
const markColor = (m) => m >= 70 ? "#22c55e" : m >= 55 ? "#3b82f6" : m >= 40 ? "#f59e0b" : "#ef4444";

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_TEACHERS = [
  { id: "TCH001", password: "teach123", name: "Dr. Ama Asante", department: "Computer Science" },
  { id: "TCH002", password: "prof456", name: "Prof. Kofi Mensah", department: "Mathematics" },
];
const SEED_STUDENTS = [
  { id: "STU001", password: "stu001", name: "Abena Owusu", programme: "BSc Computer Science", year: 1, department: "Computer Science", verified: true },
  { id: "STU002", password: "stu002", name: "Kwame Darko", programme: "BSc Mathematics", year: 2, department: "Mathematics", verified: true },
  { id: "STU003", password: "stu003", name: "Efua Boateng", programme: "BSc Computer Science", year: 3, department: "Computer Science", verified: true },
];

// ─── Storage ─────────────────────────────────────────────────────────────────

const loadData = async (key, fallback) => {
  try { const raw = localStorage.getItem(key);
 return raw ? JSON.parse(raw) : fallback; 
} catch { return fallback; }
};
const saveData = async (key, value) => { 
try { localStorage.setItem(key, 
JSON.stringify(value)); } catch {} };

// ═══════════════════════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [teachers, setTeachers] = useState(null);
  const [students, setStudents] = useState(null);
  const [results, setResults]   = useState(null);
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("login");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const t = await loadData("sms:teachers", SEED_TEACHERS);
      const s = await loadData("sms:students", SEED_STUDENTS);
      const r = await loadData("sms:results", {});
      setTeachers(t); setStudents(s); setResults(r); setLoading(false);
    })();
  }, []);

  const saveResults = async (updated) => { setResults(updated); await saveData("sms:results", updated); };

  const login = (role, id, password) => {
    const pool = role === "teacher" ? teachers : students;
    const found = pool.find((u) => u.id === id && u.password === password);
    if (!found) return { ok: false, error: "Invalid ID or password." };
    if (role === "student" && !found.verified)
      return { ok: false, error: "Your account is pending verification by your department teacher." };
    setUser({ role, ...found });
    setPage(role === "teacher" ? "teacher-home" : "student-home");
    return { ok: true };
  };

  const registerTeacher = async (t) => {
    if (teachers.find((x) => x.id === t.id)) return { ok: false, error: "A teacher with this ID already exists." };
    const updated = [...teachers, t];
    setTeachers(updated); await saveData("sms:teachers", updated);
    return { ok: true };
  };

  const registerStudent = async (s) => {
    if (students.find((x) => x.id === s.id)) return { ok: false, error: "A student with this ID already exists." };
    const updated = [...students, { ...s, verified: false }];
    setStudents(updated); await saveData("sms:students", updated);
    return { ok: true };
  };

  const teacherAddStudent = async (s) => {
    if (students.find((x) => x.id === s.id)) return { ok: false, error: "A student with this ID already exists." };
    const updated = [...students, { ...s, verified: true }];
    setStudents(updated); await saveData("sms:students", updated);
    return { ok: true };
  };

  const verifyStudent = async (studentId) => {
    const updated = students.map((s) => s.id === studentId ? { ...s, verified: true } : s);
    setStudents(updated); await saveData("sms:students", updated);
  };

  const logout = () => { setUser(null); setPage("login"); };

  if (loading) return <Splash />;

  return (
    <div style={S.root}>
      <BgGrid />
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {page === "login"            && <LoginPage onLogin={login} onRegisterTeacher={() => setPage("register-teacher")} onRegisterStudent={() => setPage("register-student")} />}
      {page === "register-teacher" && <RegisterTeacherPage onRegister={registerTeacher} onBack={() => setPage("login")} />}
      {page === "register-student" && <RegisterStudentPage onRegister={registerStudent} onBack={() => setPage("login")} />}
      {page === "student-home"     && <StudentHome user={user} results={results} onLogout={logout} />}
      {page === "teacher-home"     && <TeacherHome user={user} students={students} results={results} onEnter={(s) => setPage({ name:"enter-results", student:s })} onAddStudent={() => setPage("teacher-add-student")} onVerify={verifyStudent} onLogout={logout} />}
      {page === "teacher-add-student" && <TeacherAddStudentPage teacher={user} onAdd={teacherAddStudent} onBack={() => setPage("teacher-home")} />}
      {page?.name === "enter-results" && <EnterResults teacher={user} student={page.student} results={results} onSave={saveResults} onBack={() => setPage("teacher-home")} />}
    </div>
  );
}

// ─── Background & Splash ─────────────────────────────────────────────────────

function BgGrid() {
  return (
    <div style={S.bgGrid}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ ...S.bgDot, opacity: Math.random() * 0.3 + 0.05 }} />
      ))}
    </div>
  );
}
function Splash() {
  return <div style={{ ...S.root, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={S.splashSpinner}/></div>;
}

// ─── Shared form atoms ────────────────────────────────────────────────────────

function Field({ label, children }) {
  return <div style={S.fieldGroup}><label style={S.label}>{label}</label>{children}</div>;
}
function Inp(props) { return <input style={S.input} {...props} />; }
function Btn({ children, onClick, style = {}, disabled }) {
  return <button style={{ ...S.loginBtn, ...style, opacity: disabled ? 0.7 : 1 }} onClick={onClick} disabled={disabled}>{children}</button>;
}
function BackBtn({ onClick, label = "← Back to Login" }) {
  return <button onClick={onClick} style={S.backBtn}>{label}</button>;
}
function Note({ icon, color, text }) {
  return (
    <div style={{ ...S.demoBox, marginBottom: 16, borderColor: color + "44" }}>
      <p style={{ ...S.demoTitle, color }}>{icon}</p>
      <p style={{ ...S.demoLine, color: "#94a3b8" }}>{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function LoginPage({ onLogin, onRegisterTeacher, onRegisterStudent }) {
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!id || !pass) { setError("Please fill in all fields."); return; }
    const res = onLogin(role, id.trim().toUpperCase(), pass.trim());
    if (!res.ok) { setError(res.error); setShaking(true); setTimeout(() => setShaking(false), 500); }
  };

  return (
    <div style={S.centerPage}>
      <div style={{ ...S.card, ...S.loginCard, animation: shaking ? "shake 0.4s ease" : "fadeUp 0.4s ease" }}>
        <div style={S.loginHeader}>
          <div style={S.logoMark}><span style={{ fontSize: 28 }}>🎓</span></div>
          <h1 style={S.loginTitle}>AcademIQ</h1>
          <p style={S.loginSub}>Student Management System</p>
        </div>

        <div style={S.roleToggle}>
          {["student", "teacher"].map((r) => (
            <button key={r} onClick={() => { setRole(r); setError(""); setId(""); setPass(""); }}
              style={{ ...S.roleBtn, ...(role === r ? S.roleBtnActive : {}) }}>
              {r === "student" ? "👨‍🎓 Student" : "👩‍🏫 Teacher"}
            </button>
          ))}
        </div>

        <Field label={role === "student" ? "Student ID" : "Teacher ID"}>
          <Inp placeholder={role === "student" ? "e.g. STU001" : "e.g. TCH001"} value={id}
            onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </Field>
        <Field label="Password">
          <Inp type="password" placeholder="Enter your password" value={pass}
            onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </Field>

        {error && <p style={S.errorMsg}>{error}</p>}
        <Btn onClick={handleLogin}>Sign In →</Btn>

        <div style={S.registerLinkWrap}>
          <span style={S.registerLinkText}>No account?</span>
          <button onClick={role === "student" ? onRegisterStudent : onRegisterTeacher} style={S.registerLink}>
            {role === "student" ? "Sign up as a Student →" : "Register as a Teacher →"}
          </button>
        </div>

        <div style={S.demoBox}>
          <p style={S.demoTitle}>Demo Credentials</p>
          <p style={S.demoLine}>Students: STU001–STU003 · passwords: stu001–stu003</p>
          <p style={S.demoLine}>Teachers: TCH001 / teach123 · TCH002 / prof456</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT SIGN UP
// ═══════════════════════════════════════════════════════════════════════════════

function RegisterStudentPage({ onRegister, onBack }) {
  const [form, setForm] = useState({ id:"", name:"", programme:"", department:"", year:"1", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (f, v) => { setForm((x) => ({ ...x, [f]: v })); setError(""); };

  const submit = async () => {
    const { id, name, programme, department, year, password, confirm } = form;
    if (!id||!name||!programme||!department||!password||!confirm) { setError("All fields are required."); return; }
    if (!/^[A-Za-z0-9]+$/.test(id)) { setError("Student ID must be alphanumeric (e.g. STU010)."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const res = await onRegister({ id:id.trim().toUpperCase(), name:name.trim(), programme:programme.trim(), department:department.trim(), year:Number(year), password:password.trim() });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
  };

  return (
    <div style={S.centerPage}>
      <div style={{ ...S.card, ...S.loginCard, maxWidth:500, animation:"fadeUp 0.4s ease" }}>
        <BackBtn onClick={onBack} />
        <div style={{ ...S.loginHeader, marginBottom:20 }}>
          <div style={{ ...S.logoMark, background:"linear-gradient(135deg,#0891b2,#0e7490)" }}><span style={{ fontSize:28 }}>👨‍🎓</span></div>
          <h1 style={S.loginTitle}>Student Sign Up</h1>
          <p style={S.loginSub}>Create your AcademIQ account</p>
        </div>

        {success ? (
          <div style={S.successBox}>
            <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
            <h3 style={{ margin:"0 0 8px", color:"#f1f5f9", fontSize:20 }}>Account Created!</h3>
            <p style={{ color:"#94a3b8", fontSize:14, margin:"0 0 6px" }}>Your account is <strong style={{ color:"#f59e0b" }}>pending verification</strong> by your department teacher.</p>
            <p style={{ color:"#64748b", fontSize:13, margin:"0 0 24px" }}>Once approved, you can log in and view your results.</p>
            <Btn onClick={onBack} style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)", boxShadow:"0 8px 24px rgba(8,145,178,0.4)" }}>Back to Login →</Btn>
          </div>
        ) : (
          <>
            <div style={S.regStepLabel}>Your Information</div>
            <Field label="Full Name"><Inp placeholder="e.g. Abena Owusu" value={form.name} onChange={(e) => set("name",e.target.value)} /></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Student ID"><Inp placeholder="e.g. STU010" value={form.id} onChange={(e) => set("id",e.target.value)} /></Field>
              <Field label="Year">
                <select style={{ ...S.input, cursor:"pointer" }} value={form.year} onChange={(e) => set("year",e.target.value)}>
                  {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Programme"><Inp placeholder="e.g. BSc Computer Science" value={form.programme} onChange={(e) => set("programme",e.target.value)} /></Field>
            <Field label="Department"><Inp placeholder="e.g. Computer Science" value={form.department} onChange={(e) => set("department",e.target.value)} /></Field>
            <div style={S.regDivider}/>
            <div style={S.regStepLabel}>Set Password</div>
            <Field label="Password"><Inp type="password" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => set("password",e.target.value)} /></Field>
            <Field label="Confirm Password"><PasswordMatchInput value={form.confirm} match={form.password} onChange={(v) => set("confirm",v)} /></Field>
            {form.password && <PasswordStrength password={form.password} />}
            <Note icon="⚠️ Note" color="#f59e0b" text="After signing up your account must be verified by your department teacher before you can log in." />
            {error && <p style={S.errorMsg}>{error}</p>}
            <Btn onClick={submit} disabled={loading} style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)", boxShadow:"0 8px 24px rgba(8,145,178,0.4)" }}>
              {loading ? "Creating Account…" : "Create Account →"}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TEACHER REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

function RegisterTeacherPage({ onRegister, onBack }) {
  const [form, setForm] = useState({ id:"", name:"", department:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (f, v) => { setForm((x) => ({ ...x, [f]: v })); setError(""); };

  const submit = async () => {
    const { id, name, department, password, confirm } = form;
    if (!id||!name||!department||!password||!confirm) { setError("All fields are required."); return; }
    if (!/^[A-Za-z0-9]+$/.test(id)) { setError("Teacher ID must be alphanumeric (e.g. TCH003)."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const res = await onRegister({ id:id.trim().toUpperCase(), name:name.trim(), department:department.trim(), password:password.trim() });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
  };

  return (
    <div style={S.centerPage}>
      <div style={{ ...S.card, ...S.loginCard, maxWidth:480, animation:"fadeUp 0.4s ease" }}>
        <BackBtn onClick={onBack} />
        <div style={{ ...S.loginHeader, marginBottom:20 }}>
          <div style={{ ...S.logoMark, background:"linear-gradient(135deg,#7c3aed,#db2777)" }}><span style={{ fontSize:28 }}>👩‍🏫</span></div>
          <h1 style={S.loginTitle}>Teacher Registration</h1>
          <p style={S.loginSub}>Create your AcademIQ teacher account</p>
        </div>
        {success ? (
          <div style={S.successBox}>
            <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
            <h3 style={{ margin:"0 0 6px", color:"#f1f5f9", fontSize:20 }}>Registration Successful!</h3>
            <p style={{ color:"#94a3b8", fontSize:14, margin:"0 0 24px" }}>You can now sign in with your credentials.</p>
            <Btn onClick={onBack} style={{ background:"linear-gradient(135deg,#7c3aed,#db2777)" }}>Go to Login →</Btn>
          </div>
        ) : (
          <>
            <div style={S.regStepLabel}>Account Details</div>
            <Field label="Full Name"><Inp placeholder="e.g. Dr. Ama Asante" value={form.name} onChange={(e) => set("name",e.target.value)} /></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Teacher ID"><Inp placeholder="e.g. TCH003" value={form.id} onChange={(e) => set("id",e.target.value)} /></Field>
              <Field label="Department"><Inp placeholder="e.g. Physics" value={form.department} onChange={(e) => set("department",e.target.value)} /></Field>
            </div>
            <div style={S.regDivider}/>
            <div style={S.regStepLabel}>Set Password</div>
            <Field label="Password"><Inp type="password" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => set("password",e.target.value)} /></Field>
            <Field label="Confirm Password"><PasswordMatchInput value={form.confirm} match={form.password} onChange={(v) => set("confirm",v)} /></Field>
            {form.password && <PasswordStrength password={form.password} />}
            {error && <p style={S.errorMsg}>{error}</p>}
            <Btn onClick={submit} disabled={loading} style={{ background:"linear-gradient(135deg,#7c3aed,#db2777)", boxShadow:"0 8px 24px rgba(124,58,237,0.4)" }}>
              {loading ? "Creating Account…" : "Create Account →"}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TEACHER — ADD STUDENT
// ═══════════════════════════════════════════════════════════════════════════════

function TeacherAddStudentPage({ teacher, onAdd, onBack }) {
  const [form, setForm] = useState({ id:"", name:"", programme:"", year:"1", password:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (f, v) => { setForm((x) => ({ ...x, [f]: v })); setError(""); };

  const submit = async () => {
    const { id, name, programme, year, password } = form;
    if (!id||!name||!programme||!password) { setError("All fields are required."); return; }
    if (!/^[A-Za-z0-9]+$/.test(id)) { setError("Student ID must be alphanumeric (e.g. STU010)."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    setLoading(true);
    const res = await onAdd({ id:id.trim().toUpperCase(), name:name.trim(), programme:programme.trim(), department:teacher.department, year:Number(year), password:password.trim() });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess({ id:id.trim().toUpperCase(), name:name.trim() });
    setForm({ id:"", name:"", programme:"", year:"1", password:"" });
  };

  return (
    <div style={S.dashPage}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>🎓 AcademIQ</div>
        <div style={S.sidebarUser}>
          <div style={{ ...S.avatar, background:"linear-gradient(135deg,#7c3aed,#db2777)" }}>{teacher.name.charAt(0)}</div>
          <div><div style={S.sidebarName}>{teacher.name}</div><div style={S.sidebarId}>{teacher.id}</div><div style={S.sidebarProg}>{teacher.department}</div></div>
        </div>
        <BackBtn onClick={onBack} label="← Back to Dashboard" />
      </div>

      <div style={S.mainArea}>
        <div style={S.topBar}>
          <div>
            <h2 style={S.pageTitle}>Add Student</h2>
            <div style={{ color:"#94a3b8", fontSize:14, marginTop:2 }}>
              Department: <strong style={{ color:"#a78bfa" }}>{teacher.department}</strong>
            </div>
          </div>
        </div>

        {success && (
          <div style={{ padding:16, marginBottom:20, borderRadius:12, background:"rgba(22,163,74,0.08)", border:"1px solid rgba(22,163,74,0.3)" }}>
            <p style={{ color:"#4ade80", fontWeight:600, margin:0 }}>✅ {success.name} ({success.id}) added and verified — they can log in immediately!</p>
          </div>
        )}

        <div style={{ ...S.semPanel, padding:28, maxWidth:540 }}>
          <div style={{ ...S.semPanelTitle, marginBottom:20 }}>New Student Details</div>
          <div style={S.regStepLabel}>Student Information</div>
          <Field label="Full Name"><Inp placeholder="e.g. Kofi Asante" value={form.name} onChange={(e) => set("name",e.target.value)} /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Student ID"><Inp placeholder="e.g. STU010" value={form.id} onChange={(e) => set("id",e.target.value)} /></Field>
            <Field label="Year">
              <select style={{ ...S.input, cursor:"pointer" }} value={form.year} onChange={(e) => set("year",e.target.value)}>
                {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Programme"><Inp placeholder="e.g. BSc Computer Science" value={form.programme} onChange={(e) => set("programme",e.target.value)} /></Field>
          <div style={S.regDivider}/>
          <div style={S.regStepLabel}>Temporary Password</div>
          <Field label="Password (student uses this to log in)">
            <Inp type="text" placeholder="e.g. student123" value={form.password} onChange={(e) => set("password",e.target.value)} />
          </Field>
          <Note icon="ℹ️ Info" color="#38bdf8" text={`Students added by you are automatically verified and can log in immediately. They will be placed in the ${teacher.department} department.`} />
          {error && <p style={S.errorMsg}>{error}</p>}
          <Btn onClick={submit} disabled={loading} style={{ background:"linear-gradient(135deg,#16a34a,#15803d)", boxShadow:"0 8px 24px rgba(22,163,74,0.3)" }}>
            {loading ? "Adding…" : "✚ Add Student"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT HOME
// ═══════════════════════════════════════════════════════════════════════════════

function StudentHome({ user, results, onLogout }) {
  const myResults = results[user.id] || {};
  const [activeYear, setActiveYear] = useState(1);
  const [activeSem, setActiveSem]   = useState(1);

  let twm=0,twg=0,tc=0;
  for (let y=1;y<=4;y++) for (let s=1;s<=2;s++) {
    const st=computeSemesterStats(myResults[`${y}-${s}`]||[]);
    twm+=st.cwa*st.totalCredits; twg+=st.gpa*st.totalCredits; tc+=st.totalCredits;
  }
  const overallCWA = tc ? twm/tc : null;
  const overallGPA = tc ? twg/tc : null;
  const cls = overallCWA!=null ? classFromCWA(overallCWA) : null;
  const activeCourses = myResults[`${activeYear}-${activeSem}`] || [];
  const semStats = computeSemesterStats(activeCourses);

  return (
    <div style={S.dashPage}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>🎓 AcademIQ</div>
        <div style={S.sidebarUser}>
          <div style={S.avatar}>{user.name.charAt(0)}</div>
          <div><div style={S.sidebarName}>{user.name}</div><div style={S.sidebarId}>{user.id}</div><div style={S.sidebarProg}>{user.programme}</div></div>
        </div>
        <div style={{ marginTop:24 }}>
          {[1,2,3,4].map((y) => (
            <div key={y}>
              <div style={S.sidebarYearLabel}>Year {y}</div>
              {[1,2].map((s) => {
                const isActive=activeYear===y&&activeSem===s;
                const has=(myResults[`${y}-${s}`]||[]).length>0;
                return (
                  <button key={s} onClick={() => { setActiveYear(y); setActiveSem(s); }}
                    style={{ ...S.sidebarSemBtn, ...(isActive?S.sidebarSemBtnActive:{}), ...(!has?S.sidebarSemBtnEmpty:{}) }}>
                    {isActive?"▸ ":"  "}Semester {s}{has&&<span style={S.semDot}/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={onLogout} style={S.logoutBtn}>↩ Logout</button>
      </div>

      <div style={S.mainArea}>
        <div style={S.topBar}>
          <h2 style={S.pageTitle}>Academic Results</h2>
          {cls && <div style={{ ...S.classBadge, background:cls.color+"22", border:`1px solid ${cls.color}55`, color:cls.color }}>{cls.label} · CWA {overallCWA.toFixed(2)} · GPA {overallGPA.toFixed(2)}</div>}
        </div>

        {overallCWA!=null && (
          <div style={S.statsRow}>
            <StatCard label="Overall CWA" value={overallCWA.toFixed(2)} sub="Cumulative Weighted Avg" color="#3b82f6"/>
            <StatCard label="Overall GPA" value={overallGPA.toFixed(2)} sub="4.0 Scale" color="#a855f7"/>
            <StatCard label="Degree Class" value={cls.short} sub={cls.label} color={cls.color}/>
            <StatCard label="Credits Earned" value={tc} sub="Total Credit Hours" color="#f59e0b"/>
          </div>
        )}

        <div style={S.semPanel}>
          <div style={S.semPanelHeader}>
            <span style={S.semPanelTitle}>Year {activeYear} — Semester {activeSem}</span>
            {activeCourses.length>0 && <span style={S.semPanelStats}>CWA: <b>{semStats.cwa.toFixed(2)}</b> · GPA: <b>{semStats.gpa.toFixed(2)}</b> · {classFromCWA(semStats.cwa).label}</span>}
          </div>
          {activeCourses.length===0 ? (
            <div style={S.emptyState}><p style={{ fontSize:40 }}>📋</p><p style={S.emptyText}>No results entered yet.</p><p style={S.emptySubText}>Your teacher will upload your grades soon.</p></div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={S.table}>
                <thead><tr>{["Course","Credits","Exam (60%)","CA (40%)","Final Mark","Grade","Grade Point"].map((h)=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeCourses.map((c,i) => {
                    const final=c.examScore*0.6+c.caScore*0.4;
                    return (
                      <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                        <td style={S.td}><b>{c.name}</b></td>
                        <td style={{...S.td,textAlign:"center"}}>{c.credits}</td>
                        <td style={{...S.td,textAlign:"center"}}>{c.examScore.toFixed(1)}%</td>
                        <td style={{...S.td,textAlign:"center"}}>{c.caScore.toFixed(1)}%</td>
                        <td style={{...S.td,textAlign:"center"}}><span style={{...S.markPill,background:markColor(final)+"33",color:markColor(final)}}>{final.toFixed(2)}%</span></td>
                        <td style={{...S.td,textAlign:"center",fontWeight:700}}>{markToLetter(final)}</td>
                        <td style={{...S.td,textAlign:"center"}}>{markToGradePoint(final).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <YearSummaryRow myResults={myResults}/>
      </div>
    </div>
  );
}

function YearSummaryRow({ myResults }) {
  const years=[1,2,3,4].map((y)=>{ let wm=0,wg=0,tc=0; [1,2].forEach((s)=>{ const st=computeSemesterStats(myResults[`${y}-${s}`]||[]); wm+=st.cwa*st.totalCredits; wg+=st.gpa*st.totalCredits; tc+=st.totalCredits; }); return tc?{year:y,cwa:wm/tc,gpa:wg/tc,credits:tc}:null; }).filter(Boolean);
  if (!years.length) return null;
  return (
    <div style={S.yearSummaryRow}>
      <div style={S.semPanelTitle}>Year-by-Year Summary</div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:12 }}>
        {years.map(({year,cwa,gpa,credits})=>{ const cls=classFromCWA(cwa); return (
          <div key={year} style={{...S.yearCard,borderColor:cls.color+"55"}}>
            <div style={S.yearCardLabel}>Year {year}</div>
            <div style={{...S.yearCardCWA,color:cls.color}}>{cwa.toFixed(2)}</div>
            <div style={S.yearCardSub}>CWA</div>
            <div style={S.yearCardGPA}>GPA {gpa.toFixed(2)}</div>
            <div style={{...S.yearCardClass,color:cls.color}}>{cls.short}</div>
            <div style={S.yearCardSub}>{credits} credits</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{...S.statCard,borderColor:color+"44"}}>
      <div style={{...S.statValue,color}}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statSub}>{sub}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TEACHER HOME
// ═══════════════════════════════════════════════════════════════════════════════

function TeacherHome({ user, students, results, onEnter, onAddStudent, onVerify, onLogout }) {
  const [tab, setTab] = useState("verified");
  const deptStudents = students.filter((s) => s.department === user.department);
  const pending  = deptStudents.filter((s) => !s.verified);
  const verified = deptStudents.filter((s) => s.verified);

  return (
    <div style={S.dashPage}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>🎓 AcademIQ</div>
        <div style={S.sidebarUser}>
          <div style={{...S.avatar,background:"linear-gradient(135deg,#7c3aed,#db2777)"}}>{user.name.charAt(0)}</div>
          <div><div style={S.sidebarName}>{user.name}</div><div style={S.sidebarId}>{user.id}</div><div style={S.sidebarProg}>{user.department}</div></div>
        </div>
        <div style={{ marginTop:24 }}>
          <div style={S.sidebarYearLabel}>Navigation</div>
          <button onClick={() => setTab("verified")} style={{...S.sidebarSemBtn,...(tab==="verified"?S.sidebarSemBtnActive:{})}}>{tab==="verified"?"▸ ":"  "}My Students ({verified.length})</button>
          <button onClick={() => setTab("pending")} style={{...S.sidebarSemBtn,...(tab==="pending"?S.sidebarSemBtnActive:{})}}>
            {tab==="pending"?"▸ ":"  "}Pending Approval ({pending.length}){pending.length>0&&<span style={{...S.semDot,background:"#f59e0b"}}/>}
          </button>
        </div>
        <button onClick={onLogout} style={S.logoutBtn}>↩ Logout</button>
      </div>

      <div style={S.mainArea}>
        <div style={S.topBar}>
          <div>
            <h2 style={S.pageTitle}>{tab==="pending"?"Pending Approvals":"My Students"}</h2>
            <div style={{color:"#94a3b8",fontSize:14,marginTop:2}}>Department: <strong style={{color:"#a78bfa"}}>{user.department}</strong></div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {pending.length>0&&tab==="verified"&&<div style={{...S.classBadge,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontSize:12}}>⚠️ {pending.length} pending</div>}
            <button onClick={onAddStudent} style={{...S.saveBtn,padding:"10px 18px",fontSize:13}}>✚ Add Student</button>
          </div>
        </div>

        {tab === "pending" ? (
          <div style={S.semPanel}>
            <div style={S.semPanelHeader}>
              <span style={S.semPanelTitle}>Students Awaiting Verification</span>
              <span style={S.semPanelStats}>Approve students who self-registered</span>
            </div>
            {pending.length===0 ? (
              <div style={S.emptyState}><p style={{fontSize:40}}>✅</p><p style={S.emptyText}>No pending approvals.</p></div>
            ) : (
              <div style={S.studentGrid}>
                {pending.map((s) => (
                  <div key={s.id} style={{...S.studentCard,cursor:"default"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                      <div style={{...S.avatar,width:40,height:40,fontSize:16,background:"rgba(245,158,11,0.2)",color:"#f59e0b"}}>{s.name.charAt(0)}</div>
                      <div><div style={S.studentCardName}>{s.name}</div><div style={S.studentCardId}>{s.id} · {s.programme}</div></div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <span style={{...S.classBadge,background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontSize:11}}>Year {s.year}</span>
                      <span style={{...S.classBadge,background:"rgba(255,255,255,0.06)",color:"#94a3b8",fontSize:11}}>Self-registered</span>
                    </div>
                    <button onClick={() => onVerify(s.id)} style={{...S.saveBtn,width:"100%",fontSize:13}}>✓ Verify &amp; Approve</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={S.semPanel}>
            <div style={S.semPanelHeader}>
              <span style={S.semPanelTitle}>Verified Students</span>
              <span style={S.semPanelStats}>Click a student to enter or edit results</span>
            </div>
            {verified.length===0 ? (
              <div style={S.emptyState}><p style={{fontSize:40}}>👥</p><p style={S.emptyText}>No verified students yet.</p><p style={S.emptySubText}>Add students or approve pending sign-ups.</p></div>
            ) : (
              <div style={S.studentGrid}>
                {verified.map((s) => {
                  const myR=results[s.id]||{}; let wm=0,wg=0,cr=0;
                  for (let y=1;y<=4;y++) for (let sm=1;sm<=2;sm++) { const st=computeSemesterStats(myR[`${y}-${sm}`]||[]); wm+=st.cwa*st.totalCredits; wg+=st.gpa*st.totalCredits; cr+=st.totalCredits; }
                  const cwa=cr?wm/cr:null; const cls=cwa!=null?classFromCWA(cwa):null;
                  return (
                    <button key={s.id} onClick={() => onEnter(s)} style={S.studentCard}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <div style={{...S.avatar,width:40,height:40,fontSize:16}}>{s.name.charAt(0)}</div>
                        <div style={{textAlign:"left"}}><div style={S.studentCardName}>{s.name}</div><div style={S.studentCardId}>{s.id} · Year {s.year}</div></div>
                      </div>
                      {cwa!=null ? (
                        <div style={{display:"flex",gap:8}}>
                          <span style={{...S.classBadge,background:cls.color+"22",color:cls.color,border:`1px solid ${cls.color}44`,fontSize:11}}>CWA {cwa.toFixed(2)} · {cls.short}</span>
                          <span style={{...S.classBadge,background:"rgba(255,255,255,0.06)",color:"#94a3b8",fontSize:11}}>{cr} credits</span>
                        </div>
                      ) : <span style={{...S.classBadge,background:"rgba(255,255,255,0.06)",color:"#64748b",fontSize:11}}>No results yet</span>}
                      <div style={S.studentCardEdit}>Edit Results →</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENTER RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

function EnterResults({ teacher, student, results, onSave, onBack }) {
  const [activeYear,setActiveYear]=useState(1);
  const [activeSem,setActiveSem]=useState(1);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const semKey=`${activeYear}-${activeSem}`;
  const existing=(results[student.id]||{})[semKey]||[];
  const [courses,setCourses]=useState(existing.map((c)=>({...c})));

  const switchSem=(y,s)=>{ setActiveYear(y);setActiveSem(s); const ex=(results[student.id]||{})[`${y}-${s}`]||[]; setCourses(ex.map((c)=>({...c}))); setSaved(false); };
  const addCourse=()=>{ setCourses([...courses,{name:"",credits:3,examScore:0,caScore:0}]); setSaved(false); };
  const removeCourse=(i)=>{ setCourses(courses.filter((_,idx)=>idx!==i)); setSaved(false); };
  const updateCourse=(i,f,v)=>{ const u=[...courses]; u[i]={...u[i],[f]:v}; setCourses(u); setSaved(false); };

  const handleSave=async()=>{
    for (const c of courses) {
      if (!c.name.trim()) return alert("Please enter a name for all courses.");
      if (c.credits<1||c.credits>6) return alert("Credits must be 1–6.");
      if (c.examScore<0||c.examScore>100) return alert("Exam scores must be 0–100.");
      if (c.caScore<0||c.caScore>100) return alert("CA scores must be 0–100.");
    }
    setSaving(true);
    await onSave({...results,[student.id]:{...(results[student.id]||{}),[semKey]:courses}});
    setSaving(false); setSaved(true);
  };

  const semStats=computeSemesterStats(courses);

  return (
    <div style={S.dashPage}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>🎓 AcademIQ</div>
        <div style={S.sidebarUser}>
          <div style={{...S.avatar,background:"linear-gradient(135deg,#7c3aed,#db2777)"}}>{teacher.name.charAt(0)}</div>
          <div><div style={S.sidebarName}>{teacher.name}</div><div style={S.sidebarId}>{teacher.id}</div></div>
        </div>
        <div style={{ marginTop:24 }}>
          {[1,2,3,4].map((y)=>(
            <div key={y}>
              <div style={S.sidebarYearLabel}>Year {y}</div>
              {[1,2].map((s)=>{ const isActive=activeYear===y&&activeSem===s; const has=((results[student.id]||{})[`${y}-${s}`]||[]).length>0; return (
                <button key={s} onClick={()=>switchSem(y,s)} style={{...S.sidebarSemBtn,...(isActive?S.sidebarSemBtnActive:{}),...(!has?S.sidebarSemBtnEmpty:{})}}>
                  {isActive?"▸ ":"  "}Semester {s}{has&&<span style={S.semDot}/>}
                </button>
              ); })}
            </div>
          ))}
        </div>
        <button onClick={onBack} style={S.logoutBtn}>← Back</button>
      </div>

      <div style={S.mainArea}>
        <div style={S.topBar}>
          <div>
            <h2 style={S.pageTitle}>Enter Results</h2>
            <div style={{color:"#94a3b8",fontSize:14,marginTop:2}}>{student.name} · {student.id} · {student.programme}</div>
          </div>
          {courses.length>0&&<div style={{textAlign:"right"}}><div style={{color:"#94a3b8",fontSize:13}}>Semester Preview</div><div style={{color:classFromCWA(semStats.cwa).color,fontWeight:700,fontSize:18}}>CWA {semStats.cwa.toFixed(2)} · {classFromCWA(semStats.cwa).label}</div></div>}
        </div>

        <div style={S.semPanel}>
          <div style={S.semPanelHeader}>
            <span style={S.semPanelTitle}>Year {activeYear} — Semester {activeSem}</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addCourse} style={S.addBtn}>+ Add Course</button>
              <button onClick={handleSave} style={{...S.saveBtn,opacity:saving?0.7:1}}>{saving?"Saving…":saved?"✓ Saved":"Save Results"}</button>
            </div>
          </div>
          {courses.length===0 ? (
            <div style={S.emptyState}><p style={{fontSize:40}}>📝</p><p style={S.emptyText}>No courses added yet.</p><button onClick={addCourse} style={S.addBtn}>+ Add First Course</button></div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={S.table}>
                <thead><tr>{["Course Name/Code","Credits","Exam (0-100)","CA (0-100)","Final Mark","Grade",""].map((h)=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {courses.map((c,i)=>{ const final=c.examScore*0.6+c.caScore*0.4; return (
                    <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                      <td style={S.td}><input style={S.tableInput} value={c.name} onChange={(e)=>updateCourse(i,"name",e.target.value)} placeholder="e.g. CS101"/></td>
                      <td style={S.td}><input style={{...S.tableInput,width:50,textAlign:"center"}} type="number" min={1} max={6} value={c.credits} onChange={(e)=>updateCourse(i,"credits",Number(e.target.value))}/></td>
                      <td style={S.td}><input style={{...S.tableInput,width:70,textAlign:"center"}} type="number" min={0} max={100} step={0.5} value={c.examScore} onChange={(e)=>updateCourse(i,"examScore",Number(e.target.value))}/></td>
                      <td style={S.td}><input style={{...S.tableInput,width:70,textAlign:"center"}} type="number" min={0} max={100} step={0.5} value={c.caScore} onChange={(e)=>updateCourse(i,"caScore",Number(e.target.value))}/></td>
                      <td style={{...S.td,textAlign:"center"}}><span style={{...S.markPill,background:markColor(final)+"33",color:markColor(final)}}>{final.toFixed(2)}%</span></td>
                      <td style={{...S.td,textAlign:"center",fontWeight:700}}>{markToLetter(final)}</td>
                      <td style={S.td}><button onClick={()=>removeCourse(i)} style={S.removeBtn}>✕</button></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared form components ───────────────────────────────────────────────────

function PasswordMatchInput({ value, match, onChange }) {
  const ok=value.length>0&&value===match; const bad=value.length>0&&value!==match;
  return (
    <div style={{position:"relative"}}>
      <input style={{...S.input,borderColor:ok?"rgba(34,197,94,0.5)":bad?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.1)",paddingRight:40}} type="password" placeholder="Re-enter password" value={value} onChange={(e)=>onChange(e.target.value)}/>
      {(ok||bad)&&<span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:16}}>{ok?"✅":"❌"}</span>}
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks=[{label:"6+ chars",ok:password.length>=6},{label:"Uppercase",ok:/[A-Z]/.test(password)},{label:"Number",ok:/\d/.test(password)},{label:"Symbol",ok:/[^A-Za-z0-9]/.test(password)}];
  const score=checks.filter((c)=>c.ok).length;
  const colors=["#ef4444","#f97316","#f59e0b","#22c55e"];
  const labels=["Weak","Fair","Good","Strong"];
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",gap:4,marginBottom:6}}>{[0,1,2,3].map((i)=><div key={i} style={{flex:1,height:4,borderRadius:999,background:i<score?colors[score-1]:"rgba(255,255,255,0.08)",transition:"background 0.3s"}}/>)}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{checks.map((c)=><span key={c.label} style={{fontSize:11,color:c.ok?"#22c55e":"#475569"}}>{c.ok?"✓":"○"} {c.label}</span>)}</div>
        {score>0&&<span style={{fontSize:11,color:colors[score-1],fontWeight:600}}>{labels[score-1]}</span>}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root:{minHeight:"100vh",background:"#0a0f1e",fontFamily:"'Georgia','Times New Roman',serif",color:"#e2e8f0",position:"relative",overflow:"hidden"},
  bgGrid:{position:"fixed",inset:0,pointerEvents:"none",display:"grid",gridTemplateColumns:"repeat(8,1fr)",gridTemplateRows:"repeat(5,1fr)",zIndex:0},
  bgDot:{width:4,height:4,borderRadius:"50%",background:"#3b82f6",margin:"auto"},
  centerPage:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1,padding:20},
  card:{background:"rgba(15,23,42,0.95)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:20,backdropFilter:"blur(20px)",boxShadow:"0 25px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05)"},
  loginCard:{width:"100%",maxWidth:440,padding:40},
  loginHeader:{textAlign:"center",marginBottom:32},
  logoMark:{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 32px rgba(124,58,237,0.4)"},
  loginTitle:{margin:0,fontSize:28,fontWeight:700,letterSpacing:"-0.5px",color:"#f8fafc"},
  loginSub:{margin:"4px 0 0",color:"#64748b",fontSize:14,fontFamily:"monospace"},
  roleToggle:{display:"flex",gap:8,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,marginBottom:24},
  roleBtn:{flex:1,padding:"10px 8px",borderRadius:10,border:"none",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:14,fontFamily:"inherit",transition:"all 0.2s"},
  roleBtnActive:{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",color:"#fff",boxShadow:"0 4px 16px rgba(124,58,237,0.4)"},
  fieldGroup:{marginBottom:16},
  label:{display:"block",fontSize:13,color:"#94a3b8",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"},
  input:{width:"100%",padding:"12px 16px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#f1f5f9",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"monospace",transition:"border-color 0.2s"},
  errorMsg:{color:"#f87171",fontSize:13,marginBottom:12,textAlign:"center"},
  loginBtn:{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",color:"#fff",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:8,boxShadow:"0 8px 24px rgba(124,58,237,0.4)",fontFamily:"inherit",letterSpacing:"0.03em"},
  demoBox:{marginTop:24,padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(255,255,255,0.1)"},
  demoTitle:{margin:"0 0 4px",fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#475569"},
  demoLine:{margin:"2px 0",fontSize:12,color:"#64748b",fontFamily:"monospace"},
  registerLinkWrap:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:16,marginBottom:4},
  registerLinkText:{fontSize:13,color:"#475569"},
  registerLink:{background:"none",border:"none",color:"#818cf8",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600,textDecoration:"underline",textDecorationStyle:"dotted",padding:0},
  backBtn:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:20,padding:0,display:"block"},
  regStepLabel:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.14em",color:"#a78bfa",fontWeight:700,marginBottom:12},
  regDivider:{height:1,background:"rgba(255,255,255,0.07)",margin:"16px 0 14px"},
  successBox:{textAlign:"center",padding:"20px 0"},
  dashPage:{display:"flex",minHeight:"100vh",position:"relative",zIndex:1},
  sidebar:{width:240,minHeight:"100vh",background:"rgba(10,15,30,0.98)",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"24px 16px",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0},
  sidebarLogo:{fontSize:18,fontWeight:700,color:"#f1f5f9",marginBottom:24,paddingLeft:8},
  sidebarUser:{display:"flex",gap:10,alignItems:"flex-start",padding:"14px 12px",borderRadius:12,background:"rgba(255,255,255,0.04)",marginBottom:8},
  avatar:{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",flexShrink:0},
  sidebarName:{fontSize:14,fontWeight:600,color:"#f1f5f9",lineHeight:1.3},
  sidebarId:{fontSize:12,color:"#64748b",fontFamily:"monospace"},
  sidebarProg:{fontSize:11,color:"#475569",marginTop:2},
  sidebarYearLabel:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"#334155",padding:"10px 8px 4px"},
  sidebarSemBtn:{display:"flex",alignItems:"center",gap:4,width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:2,transition:"all 0.15s"},
  sidebarSemBtnActive:{background:"rgba(59,130,246,0.15)",color:"#93c5fd"},
  sidebarSemBtnEmpty:{opacity:0.5},
  semDot:{width:6,height:6,borderRadius:"50%",background:"#22c55e",marginLeft:"auto"},
  logoutBtn:{marginTop:"auto",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:13,fontFamily:"inherit",transition:"all 0.2s"},
  mainArea:{flex:1,padding:"32px 40px",overflowY:"auto"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12},
  pageTitle:{margin:0,fontSize:26,fontWeight:700,color:"#f8fafc",letterSpacing:"-0.5px"},
  classBadge:{padding:"6px 14px",borderRadius:999,fontSize:13,fontWeight:600,fontFamily:"monospace"},
  statsRow:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24},
  statCard:{padding:"20px 18px",borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid",borderColor:"rgba(255,255,255,0.08)"},
  statValue:{fontSize:32,fontWeight:700,lineHeight:1,marginBottom:4},
  statLabel:{fontSize:13,fontWeight:600,color:"#94a3b8"},
  statSub:{fontSize:11,color:"#475569",marginTop:2},
  semPanel:{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden",marginBottom:24},
  semPanelHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexWrap:"wrap",gap:8},
  semPanelTitle:{fontSize:16,fontWeight:700,color:"#f1f5f9"},
  semPanelStats:{fontSize:13,color:"#64748b",fontFamily:"monospace"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{padding:"12px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"},
  td:{padding:"12px 16px",fontSize:14,color:"#cbd5e1"},
  trEven:{background:"rgba(255,255,255,0.02)"},
  trOdd:{background:"transparent"},
  markPill:{display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:13,fontWeight:600,fontFamily:"monospace"},
  emptyState:{padding:"60px 20px",textAlign:"center"},
  emptyText:{fontSize:16,color:"#64748b",margin:"8px 0 4px"},
  emptySubText:{fontSize:13,color:"#334155"},
  studentGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,padding:20},
  studentCard:{background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",padding:"16px 18px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"inherit"},
  studentCardName:{fontSize:15,fontWeight:600,color:"#f1f5f9"},
  studentCardId:{fontSize:12,color:"#64748b",fontFamily:"monospace"},
  studentCardEdit:{marginTop:12,fontSize:13,color:"#3b82f6"},
  tableInput:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#f1f5f9",padding:"6px 10px",borderRadius:8,fontSize:13,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"},
  addBtn:{padding:"8px 16px",borderRadius:8,border:"1px solid rgba(59,130,246,0.4)",background:"rgba(59,130,246,0.1)",color:"#60a5fa",cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  saveBtn:{padding:"8px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",boxShadow:"0 4px 12px rgba(22,163,74,0.3)"},
  removeBtn:{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",padding:"4px 8px",borderRadius:6,cursor:"pointer",fontSize:12},
  yearSummaryRow:{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",padding:20},
  yearCard:{flex:"1 1 120px",minWidth:120,background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid",padding:"16px 14px",textAlign:"center"},
  yearCardLabel:{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#475569",marginBottom:6},
  yearCardCWA:{fontSize:28,fontWeight:700,lineHeight:1},
  yearCardSub:{fontSize:11,color:"#475569",marginTop:2},
  yearCardGPA:{fontSize:13,color:"#94a3b8",marginTop:8},
  yearCardClass:{fontSize:13,fontWeight:700,marginTop:4},
  splashSpinner:{width:48,height:48,borderRadius:"50%",border:"3px solid rgba(59,130,246,0.2)",borderTopColor:"#3b82f6",animation:"spin 0.8s linear infinite"},
};