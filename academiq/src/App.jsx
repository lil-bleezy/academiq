import { useState, useEffect } from "react";

// ─── Grading Utilities ───────────────────────────────────────────────────────

const markToGradePoint = (mark) => {
  if (mark >= 80) return 4.0;
  if (mark >= 75) return 3.7;
  if (mark >= 70) return 3.3;
  if (mark >= 65) return 3.0;
  if (mark >= 60) return 2.7;
  if (mark >= 55) return 2.3;
  if (mark >= 50) return 2.0;
  if (mark >= 45) return 1.7;
  if (mark >= 40) return 1.0;
  return 0.0;
};

const markToLetter = (mark) => {
  if (mark >= 80) return "A";;
  if (mark >= 70) return "B";
  if (mark >= 60) return "C";
  if (mark >= 50) return "D";
  return "F";
};

const classFromCWA = (cwa) => {
  if (cwa >= 80) return { label: "First Class Honours", color: "#22c55e", short: "1st" };
  if (cwa >= 70) return { label: "Second Class Upper", color: "#3b82f6", short: "2:1" };
  if (cwa >= 60) return { label: "Second Class Lower", color: "#a855f7", short: "2:2" };
  if (cwa >= 50) return { label: "Third Class", color: "#f59e0b", short: "3rd" };
  if (cwa >= 40) return { label: "Pass", color: "#6b7280", short: "Pass" };
  return { label: "Fail", color: "#ef4444", short: "Fail" };
};

const computeSemesterStats = (courses) => {
  let totalCredits = 0, weightedMark = 0, weightedGP = 0;
  courses.forEach((c) => {
    const final = c.examScore * 0.6 + c.caScore * 0.4;
    const gp = markToGradePoint(final);
    totalCredits += c.credits;
    weightedMark += final * c.credits;
    weightedGP += gp * c.credits;
  });
  const cwa = totalCredits ? weightedMark / totalCredits : 0;
  const gpa = totalCredits ? weightedGP / totalCredits : 0;
  return { cwa, gpa, totalCredits };
};

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_TEACHERS = [
  { id: "TCH001", password: "teach123", name: "Dr. Ama Asante", department: "Computer Science" },
  { id: "TCH002", password: "prof456", name: "Prof. Kofi Mensah", department: "Mathematics" },
];

const SEED_STUDENTS = [
  { id: "STU001", password: "stu001", name: "Abena Owusu", programme: "BSc Computer Science", year: 1 },
  { id: "STU002", password: "stu002", name: "Kwame Darko", programme: "BSc Mathematics", year: 2 },
  { id: "STU003", password: "stu003", name: "Efua Boateng", programme: "BSc Computer Science", year: 3 },
];

// ─── Storage helpers ─────────────────────────────────────────────────────────

const loadData = async (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const saveData = async (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ═══════════════════════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [teachers, setTeachers] = useState(null);
  const [students, setStudents] = useState(null);
  const [results, setResults]   = useState(null);  // { STU001: { "1-1": [{...}], "1-2": [...], ... } }
  const [user, setUser]         = useState(null);  // { role, id, ... }
  const [page, setPage]         = useState("login"); // login | student-home | teacher-home | enter-results | student-results
  const [loading, setLoading]   = useState(true);

  // ── Boot ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const t = await loadData("sms:teachers", SEED_TEACHERS);
      const s = await loadData("sms:students", SEED_STUDENTS);
      const r = await loadData("sms:results", {});
      setTeachers(t); setStudents(s); setResults(r);
      setLoading(false);
    })();
  }, []);

  const saveResults = async (updated) => {
    setResults(updated);
    await saveData("sms:results", updated);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────

  const login = (role, id, password) => {
    const pool = role === "teacher" ? teachers : students;
    const found = pool.find((u) => u.id === id && u.password === password);
    if (!found) return false;
    setUser({ role, ...found });
    setPage(role === "teacher" ? "teacher-home" : "student-home");
    return true;
  };

  const registerTeacher = async (newTeacher) => {
    // Check duplicate ID
    if (teachers.find((t) => t.id === newTeacher.id)) return { ok: false, error: "A teacher with this ID already exists." };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    await saveData("sms:teachers", updated);
    return { ok: true };
  };

  const logout = () => { setUser(null); setPage("login"); };

  if (loading) return <Splash />;

  return (
    <div style={styles.root}>
      <BgGrid />
      {page === "login" && <LoginPage onLogin={login} onRegister={() => setPage("register-teacher")} />}
      {page === "register-teacher" && (
        <RegisterTeacherPage onRegister={registerTeacher} onBack={() => setPage("login")} />
      )}
      {page === "student-home" && (
        <StudentHome user={user} results={results} onLogout={logout} />
      )}
      {page === "teacher-home" && (
        <TeacherHome
          user={user}
          students={students}
          results={results}
          onEnter={(s) => setPage({ name: "enter-results", student: s })}
          onLogout={logout}
        />
      )}
      {page?.name === "enter-results" && (
        <EnterResults
          teacher={user}
          student={page.student}
          results={results}
          onSave={saveResults}
          onBack={() => setPage("teacher-home")}
        />
      )}
    </div>
  );
}

// ─── Background ──────────────────────────────────────────────────────────────

function BgGrid() {
  return (
    <div style={styles.bgGrid}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ ...styles.bgDot, opacity: Math.random() * 0.3 + 0.05 }} />
      ))}
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────

function Splash() {
  return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={styles.splashSpinner} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function LoginPage({ onLogin, onRegister }) {
  const [role, setRole]   = useState("student");
  const [id, setId]       = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!id || !pass) { setError("Please fill in all fields."); return; }
    const ok = onLogin(role, id.trim().toUpperCase(), pass.trim());
    if (!ok) {
      setError("Invalid credentials. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={styles.centerPage}>
      <div style={{ ...styles.card, ...styles.loginCard, animation: shaking ? "shake 0.4s ease" : undefined }}>
        {/* Header */}
        <div style={styles.loginHeader}>
          <div style={styles.logoMark}>
            <span style={{ fontSize: 28 }}></span>
          </div>
          <h1 style={styles.loginTitle}>AcademIQ</h1>
          <p style={styles.loginSub}>Student Management System</p>
        </div>

        {/* Role Toggle */}
        <div style={styles.roleToggle}>
          {["student", "teacher"].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(""); }}
              style={{ ...styles.roleBtn, ...(role === r ? styles.roleBtnActive : {}) }}
            >
              {r === "student" ? "‍ Student" : "‍ Teacher"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{role === "student" ? "Student ID" : "Teacher ID"}</label>
          <input
            style={styles.input}
            placeholder={role === "student" ? "e.g. STU001" : "e.g. TCH001"}
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button style={styles.loginBtn} onClick={handleLogin}>
          Sign In →
        </button>

        {/* Teacher-only register link */}
        {role === "teacher" && (
          <div style={styles.registerLinkWrap}>
            <span style={styles.registerLinkText}>New to AcademIQ?</span>
            <button onClick={onRegister} style={styles.registerLink}>
              Register as a Teacher →
            </button>
          </div>
        )}

        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>Demo Credentials</p>
          <p style={styles.demoLine}>Students: STU001–STU003 / stu001–stu003</p>
          <p style={styles.demoLine}>Teachers: TCH001 / teach123 &nbsp;|&nbsp; TCH002 / prof456</p>
        </div>
      </div>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TEACHER REGISTRATION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function RegisterTeacherPage({ onRegister, onBack }) {
  const [form, setForm] = useState({ id: "", name: "", department: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field, val) => { setForm((f) => ({ ...f, [field]: val })); setError(""); };

  const handleSubmit = async () => {
    const { id, name, department, password, confirm } = form;
    if (!id || !name || !department || !password || !confirm) {
      setError("All fields are required."); return;
    }
    if (!/^[A-Za-z0-9]+$/.test(id)) {
      setError("Teacher ID must be alphanumeric only (e.g. TCH003)."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); return;
    }
    setLoading(true);
    const result = await onRegister({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      department: department.trim(),
      password: password.trim(),
    });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setSuccess(true);
  };

  return (
    <div style={styles.centerPage}>
      <div style={{ ...styles.card, ...styles.loginCard, maxWidth: 480, animation: "fadeSlideUp 0.4s ease" }}>

        {/* Back */}
        <button onClick={onBack} style={styles.backBtn}>← Back to Login</button>

        {/* Header */}
        <div style={{ ...styles.loginHeader, marginBottom: 24 }}>
          <div style={{ ...styles.logoMark, background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
            <span style={{ fontSize: 28 }}>‍</span>
          </div>
          <h1 style={styles.loginTitle}>Teacher Registration</h1>
          <p style={styles.loginSub}>Create your AcademIQ account</p>
        </div>

        {success ? (
          <div style={styles.successBox}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: "0 0 6px", color: "#f1f5f9", fontSize: 18 }}>Registration Successful!</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Your account has been created. You can now sign in with your credentials.
            </p>
            <button onClick={onBack} style={styles.loginBtn}>Go to Login →</button>
          </div>
        ) : (
          <>
            {/* Step label */}
            <div style={styles.regStepLabel}>Account Details</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ ...styles.fieldGroup, gridColumn: "1/3" }}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} placeholder="e.g. Dr. Ama Asante"
                  value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Teacher ID</label>
                <input style={styles.input} placeholder="e.g. TCH003"
                  value={form.id} onChange={(e) => set("id", e.target.value)} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Department</label>
                <input style={styles.input} placeholder="e.g. Physics"
                  value={form.department} onChange={(e) => set("department", e.target.value)} />
              </div>
            </div>

            <div style={styles.regDivider} />
            <div style={styles.regStepLabel}>Set Password</div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <PasswordMatchInput
                value={form.confirm}
                match={form.password}
                onChange={(v) => set("confirm", v)}
              />
            </div>

            {/* Password strength */}
            {form.password && <PasswordStrength password={form.password} />}

            {error && <p style={styles.errorMsg}>{error}</p>}

            <button style={{ ...styles.loginBtn, background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 24px rgba(124,58,237,0.4)", opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating Account…" : "Create Account →"}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#475569" }}>
              Already have an account?{" "}
              <button onClick={onBack} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                Sign in here
              </button>
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function PasswordMatchInput({ value, match, onChange }) {
  const matches = value.length > 0 && value === match;
  const mismatch = value.length > 0 && value !== match;
  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...styles.input, borderColor: matches ? "rgba(34,197,94,0.5)" : mismatch ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)", paddingRight: 40 }}
        type="password" placeholder="Re-enter password"
        value={value} onChange={(e) => onChange(e.target.value)}
      />
      {(matches || mismatch) && (
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
          {matches ? "✅" : "❌"}
        </span>
      )}
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "6+ characters", ok: password.length >= 6 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < score ? colors[score - 1] : "rgba(255,255,255,0.08)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {checks.map((c) => (
            <span key={c.label} style={{ fontSize: 11, color: c.ok ? "#22c55e" : "#475569" }}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize: 11, color: colors[score - 1], fontWeight: 600 }}>{labels[score - 1]}</span>}
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

  // Overall stats
  let totalCreditWeightedMark = 0, totalCreditWeightedGP = 0, totalCredits = 0;
  for (let y = 1; y <= 4; y++) {
    for (let s = 1; s <= 2; s++) {
      const courses = myResults[`${y}-${s}`] || [];
      const stats = computeSemesterStats(courses);
      totalCreditWeightedMark += stats.cwa * stats.totalCredits;
      totalCreditWeightedGP   += stats.gpa * stats.totalCredits;
      totalCredits            += stats.totalCredits;
    }
  }
  const overallCWA = totalCredits ? totalCreditWeightedMark / totalCredits : null;
  const overallGPA = totalCredits ? totalCreditWeightedGP   / totalCredits : null;
  const cls = overallCWA != null ? classFromCWA(overallCWA) : null;

  const activeCourses = myResults[`${activeYear}-${activeSem}`] || [];
  const semStats = computeSemesterStats(activeCourses);

  return (
    <div style={styles.dashPage}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}> AcademIQ</div>
        <div style={styles.sidebarUser}>
          <div style={styles.avatar}>{user.name.charAt(0)}</div>
          <div>
            <div style={styles.sidebarName}>{user.name}</div>
            <div style={styles.sidebarId}>{user.id}</div>
            <div style={styles.sidebarProg}>{user.programme}</div>
          </div>
        </div>

        {/* Year / Sem nav */}
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map((y) => (
            <div key={y}>
              <div style={styles.sidebarYearLabel}>Year {y}</div>
              {[1, 2].map((s) => {
                const key = `${y}-${s}`;
                const has = (myResults[key] || []).length > 0;
                const isActive = activeYear === y && activeSem === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setActiveYear(y); setActiveSem(s); }}
                    style={{ ...styles.sidebarSemBtn, ...(isActive ? styles.sidebarSemBtnActive : {}), ...(has ? {} : styles.sidebarSemBtnEmpty) }}
                  >
                    {isActive ? "▸ " : "  "}Semester {s}
                    {has && <span style={styles.semDot} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button onClick={onLogout} style={styles.logoutBtn}>↩ Logout</button>
      </div>

      {/* Main */}
      <div style={styles.mainArea}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>Academic Results</h2>
          {cls && (
            <div style={{ ...styles.classBadge, background: cls.color + "22", border: `1px solid ${cls.color}55`, color: cls.color }}>
              {cls.label} · CWA {overallCWA.toFixed(2)} · GPA {overallGPA.toFixed(2)}
            </div>
          )}
        </div>

        {/* Stats cards */}
        {overallCWA != null && (
          <div style={styles.statsRow}>
            <StatCard label="Overall CWA" value={overallCWA.toFixed(2)} sub="Cumulative Weighted Avg" color="#3b82f6" />
            <StatCard label="Overall GPA" value={overallGPA.toFixed(2)} sub="4.0 Scale" color="#a855f7" />
            <StatCard label="Degree Class" value={cls.short} sub={cls.label} color={cls.color} />
            <StatCard label="Credits Earned" value={totalCredits} sub="Total Credit Hours" color="#f59e0b" />
          </div>
        )}

        {/* Semester panel */}
        <div style={styles.semPanel}>
          <div style={styles.semPanelHeader}>
            <span style={styles.semPanelTitle}>Year {activeYear} — Semester {activeSem}</span>
            {activeCourses.length > 0 && (
              <span style={styles.semPanelStats}>
                CWA: <b>{semStats.cwa.toFixed(2)}</b> · GPA: <b>{semStats.gpa.toFixed(2)}</b> · {classFromCWA(semStats.cwa).label}
              </span>
            )}
          </div>

          {activeCourses.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: 40 }}></p>
              <p style={styles.emptyText}>No results entered yet for this semester.</p>
              <p style={styles.emptySubText}>Your teacher will upload your grades.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Course", "Credits", "Exam (60%)", "CA (40%)", "Final Mark", "Grade", "Grade Point"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeCourses.map((c, i) => {
                    const final = c.examScore * 0.6 + c.caScore * 0.4;
                    const gp    = markToGradePoint(final);
                    const grade = markToLetter(final);
                    return (
                      <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}><b>{c.name}</b></td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{c.credits}</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{c.examScore.toFixed(1)}%</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{c.caScore.toFixed(1)}%</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span style={{ ...styles.markPill, background: markColor(final) + "33", color: markColor(final) }}>
                            {final.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>{grade}</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{gp.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Year summary across semesters */}
        <YearSummaryRow myResults={myResults} />
      </div>
    </div>
  );
}

function YearSummaryRow({ myResults }) {
  const years = [1, 2, 3, 4].map((y) => {
    let wm = 0, wg = 0, tc = 0;
    [1, 2].forEach((s) => {
      const st = computeSemesterStats(myResults[`${y}-${s}`] || []);
      wm += st.cwa * st.totalCredits;
      wg += st.gpa * st.totalCredits;
      tc += st.totalCredits;
    });
    return tc ? { year: y, cwa: wm / tc, gpa: wg / tc, credits: tc } : null;
  }).filter(Boolean);

  if (!years.length) return null;

  return (
    <div style={styles.yearSummaryRow}>
      <div style={styles.semPanelTitle}>Year-by-Year Summary</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
        {years.map(({ year, cwa, gpa, credits }) => {
          const cls = classFromCWA(cwa);
          return (
            <div key={year} style={{ ...styles.yearCard, borderColor: cls.color + "55" }}>
              <div style={styles.yearCardLabel}>Year {year}</div>
              <div style={{ ...styles.yearCardCWA, color: cls.color }}>{cwa.toFixed(2)}</div>
              <div style={styles.yearCardSub}>CWA</div>
              <div style={styles.yearCardGPA}>GPA {gpa.toFixed(2)}</div>
              <div style={{ ...styles.yearCardClass, color: cls.color }}>{cls.short}</div>
              <div style={styles.yearCardSub}>{credits} credits</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ ...styles.statCard, borderColor: color + "44" }}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

const markColor = (m) => {
  if (m >= 70) return "#22c55e";
  if (m >= 55) return "#3b82f6";
  if (m >= 40) return "#f59e0b";
  return "#ef4444";
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TEACHER HOME
// ═══════════════════════════════════════════════════════════════════════════════

function TeacherHome({ user, students, results, onEnter, onLogout }) {
  return (
    <div style={styles.dashPage}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}> AcademIQ</div>
        <div style={styles.sidebarUser}>
          <div style={{ ...styles.avatar, background: "#7c3aed" }}>{user.name.charAt(0)}</div>
          <div>
            <div style={styles.sidebarName}>{user.name}</div>
            <div style={styles.sidebarId}>{user.id}</div>
            <div style={styles.sidebarProg}>{user.department}</div>
          </div>
        </div>
        <div style={{ ...styles.sidebarYearLabel, marginTop: 32 }}>Navigation</div>
        <div style={{ ...styles.sidebarSemBtn, ...styles.sidebarSemBtnActive }}>▸ Student Records</div>
        <button onClick={onLogout} style={styles.logoutBtn}>↩ Logout</button>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>Teacher Dashboard</h2>
          <div style={{ ...styles.classBadge, background: "#7c3aed22", border: "1px solid #7c3aed55", color: "#a78bfa" }}>
            {user.department}
          </div>
        </div>

        <div style={styles.semPanel}>
          <div style={styles.semPanelHeader}>
            <span style={styles.semPanelTitle}>All Students</span>
            <span style={styles.semPanelStats}>Click a student to enter / edit results</span>
          </div>
          <div style={styles.studentGrid}>
            {students.map((s) => {
              const myR = results[s.id] || {};
              let tc = 0;
              for (let y = 1; y <= 4; y++) for (let sm = 1; sm <= 2; sm++) {
                tc += computeSemesterStats(myR[`${y}-${sm}`] || []).totalCredits;
              }
              let wm = 0, wg = 0, creds = 0;
              for (let y = 1; y <= 4; y++) for (let sm = 1; sm <= 2; sm++) {
                const st = computeSemesterStats(myR[`${y}-${sm}`] || []);
                wm += st.cwa * st.totalCredits;
                wg += st.gpa * st.totalCredits;
                creds += st.totalCredits;
              }
              const cwa = creds ? wm / creds : null;
              const cls = cwa != null ? classFromCWA(cwa) : null;

              return (
                <button key={s.id} onClick={() => onEnter(s)} style={styles.studentCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ ...styles.avatar, width: 40, height: 40, fontSize: 16 }}>{s.name.charAt(0)}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={styles.studentCardName}>{s.name}</div>
                      <div style={styles.studentCardId}>{s.id} · {s.programme}</div>
                    </div>
                  </div>
                  {cwa != null ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ ...styles.classBadge, background: cls.color + "22", color: cls.color, border: `1px solid ${cls.color}44`, fontSize: 11 }}>
                        CWA {cwa.toFixed(2)} · {cls.short}
                      </span>
                      <span style={{ ...styles.classBadge, background: "#ffffff10", color: "#94a3b8", fontSize: 11 }}>
                        {tc} credits
                      </span>
                    </div>
                  ) : (
                    <span style={{ ...styles.classBadge, background: "#ffffff08", color: "#64748b", fontSize: 11 }}>
                      No results yet
                    </span>
                  )}
                  <div style={styles.studentCardEdit}>Edit Results →</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENTER RESULTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function EnterResults({ teacher, student, results, onSave, onBack }) {
  const [activeYear, setActiveYear] = useState(1);
  const [activeSem, setActiveSem]   = useState(1);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const semKey = `${activeYear}-${activeSem}`;
  const existing = (results[student.id] || {})[semKey] || [];

  const [courses, setCourses] = useState(existing.map((c) => ({ ...c })));

  // When switching semester, load its courses
  const switchSem = (y, s) => {
    setActiveYear(y); setActiveSem(s);
    const key = `${y}-${s}`;
    const ex = (results[student.id] || {})[key] || [];
    setCourses(ex.map((c) => ({ ...c })));
    setSaved(false);
  };

  const addCourse = () => {
    setCourses([...courses, { name: "", credits: 3, examScore: 0, caScore: 0 }]);
    setSaved(false);
  };
  const removeCourse = (i) => {
    setCourses(courses.filter((_, idx) => idx !== i));
    setSaved(false);
  };
  const updateCourse = (i, field, val) => {
    const updated = [...courses];
    updated[i] = { ...updated[i], [field]: val };
    setCourses(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    // Validate
    for (const c of courses) {
      if (!c.name.trim()) return alert("Please enter a name for all courses.");
      if (c.credits < 1 || c.credits > 6) return alert("Credits must be between 1 and 6.");
      if (c.examScore < 0 || c.examScore > 100) return alert("Exam scores must be 0-100.");
      if (c.caScore < 0 || c.caScore > 100) return alert("CA scores must be 0-100.");
    }
    setSaving(true);
    const updated = {
      ...results,
      [student.id]: { ...(results[student.id] || {}), [semKey]: courses },
    };
    await onSave(updated);
    setSaving(false);
    setSaved(true);
  };

  const semStats = computeSemesterStats(courses);

  return (
    <div style={styles.dashPage}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}> AcademIQ</div>
        <div style={styles.sidebarUser}>
          <div style={{ ...styles.avatar, background: "#7c3aed" }}>{teacher.name.charAt(0)}</div>
          <div>
            <div style={styles.sidebarName}>{teacher.name}</div>
            <div style={styles.sidebarId}>{teacher.id}</div>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map((y) => (
            <div key={y}>
              <div style={styles.sidebarYearLabel}>Year {y}</div>
              {[1, 2].map((s) => {
                const isActive = activeYear === y && activeSem === s;
                const has = ((results[student.id] || {})[`${y}-${s}`] || []).length > 0;
                return (
                  <button key={s} onClick={() => switchSem(y, s)}
                    style={{ ...styles.sidebarSemBtn, ...(isActive ? styles.sidebarSemBtnActive : {}), ...(has ? {} : styles.sidebarSemBtnEmpty) }}>
                    {isActive ? "▸ " : "  "}Semester {s}
                    {has && <span style={styles.semDot} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={onBack} style={styles.logoutBtn}>← Back</button>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.pageTitle}>Enter Results</h2>
            <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 2 }}>
              {student.name} · {student.id} · {student.programme}
            </div>
          </div>
          {courses.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Semester Preview</div>
              <div style={{ color: classFromCWA(semStats.cwa).color, fontWeight: 700, fontSize: 18 }}>
                CWA {semStats.cwa.toFixed(2)} · {classFromCWA(semStats.cwa).label}
              </div>
            </div>
          )}
        </div>

        <div style={styles.semPanel}>
          <div style={styles.semPanelHeader}>
            <span style={styles.semPanelTitle}>Year {activeYear} — Semester {activeSem}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addCourse} style={styles.addBtn}>+ Add Course</button>
              <button onClick={handleSave} style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : saved ? "✓ Saved" : "Save Results"}
              </button>
            </div>
          </div>

          {courses.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: 40 }}></p>
              <p style={styles.emptyText}>No courses added yet.</p>
              <button onClick={addCourse} style={styles.addBtn}>+ Add First Course</button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Course Name/Code", "Credits", "Exam Score (0-100)", "CA Score (0-100)", "Final Mark", "Grade", ""].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => {
                    const final = c.examScore * 0.6 + c.caScore * 0.4;
                    return (
                      <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}>
                          <input style={styles.tableInput} value={c.name}
                            onChange={(e) => updateCourse(i, "name", e.target.value)}
                            placeholder="e.g. CS101" />
                        </td>
                        <td style={styles.td}>
                          <input style={{ ...styles.tableInput, width: 50, textAlign: "center" }}
                            type="number" min={1} max={6} value={c.credits}
                            onChange={(e) => updateCourse(i, "credits", Number(e.target.value))} />
                        </td>
                        <td style={styles.td}>
                          <input style={{ ...styles.tableInput, width: 70, textAlign: "center" }}
                            type="number" min={0} max={100} step={0.5} value={c.examScore}
                            onChange={(e) => updateCourse(i, "examScore", Number(e.target.value))} />
                        </td>
                        <td style={styles.td}>
                          <input style={{ ...styles.tableInput, width: 70, textAlign: "center" }}
                            type="number" min={0} max={100} step={0.5} value={c.caScore}
                            onChange={(e) => updateCourse(i, "caScore", Number(e.target.value))} />
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span style={{ ...styles.markPill, background: markColor(final) + "33", color: markColor(final) }}>
                            {final.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>{markToLetter(final)}</td>
                        <td style={styles.td}>
                          <button onClick={() => removeCourse(i)} style={styles.removeBtn}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0f1e",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
  },
  bgGrid: {
    position: "fixed", inset: 0, pointerEvents: "none",
    display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(5, 1fr)",
    zIndex: 0,
  },
  bgDot: {
    width: 4, height: 4, borderRadius: "50%",
    background: "#3b82f6", margin: "auto",
  },
  centerPage: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", zIndex: 1, padding: 20,
  },
  card: {
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 20,
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
  },
  loginCard: { width: "100%", maxWidth: 440, padding: 40 },
  loginHeader: { textAlign: "center", marginBottom: 32 },
  logoMark: {
    width: 64, height: 64, borderRadius: 18,
    background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
  },
  loginTitle: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#f8fafc" },
  loginSub: { margin: "4px 0 0", color: "#64748b", fontSize: 14, fontFamily: "monospace" },
  roleToggle: {
    display: "flex", gap: 8, background: "rgba(255,255,255,0.04)",
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  roleBtn: {
    flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
    background: "transparent", color: "#64748b", cursor: "pointer",
    fontSize: 14, fontFamily: "inherit", transition: "all 0.2s",
  },
  roleBtnActive: {
    background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
    color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
  },
  fieldGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" },
  input: {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9", fontSize: 15, outline: "none", boxSizing: "border-box",
    fontFamily: "monospace", transition: "border-color 0.2s",
  },
  errorMsg: { color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" },
  loginBtn: {
    width: "100%", padding: "14px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
    color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
    marginTop: 8, boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
    fontFamily: "inherit", letterSpacing: "0.03em",
  },
  demoBox: {
    marginTop: 24, padding: "14px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)",
  },
  demoTitle: { margin: "0 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569" },
  demoLine: { margin: "2px 0", fontSize: 12, color: "#64748b", fontFamily: "monospace" },

  registerLinkWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 16, marginBottom: 4,
  },
  registerLinkText: { fontSize: 13, color: "#475569" },
  registerLink: {
    background: "none", border: "none", color: "#818cf8",
    cursor: "pointer", fontSize: 13, fontFamily: "inherit",
    fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted",
    padding: 0,
  },
  backBtn: {
    background: "none", border: "none", color: "#64748b", cursor: "pointer",
    fontSize: 13, fontFamily: "inherit", marginBottom: 20, padding: 0,
  },
  regStepLabel: {
    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em",
    color: "#a78bfa", fontWeight: 700, marginBottom: 12,
  },
  regDivider: {
    height: 1, background: "rgba(255,255,255,0.07)", margin: "16px 0 14px",
  },
  successBox: {
    textAlign: "center", padding: "20px 0",
  },

  // Dashboard layout
  dashPage: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 },
  sidebar: {
    width: 240, minHeight: "100vh", background: "rgba(10,15,30,0.98)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "24px 16px", display: "flex", flexDirection: "column",
    position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0,
  },
  sidebarLogo: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 24, paddingLeft: 8 },
  sidebarUser: {
    display: "flex", gap: 10, alignItems: "flex-start",
    padding: "14px 12px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", marginBottom: 8,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  sidebarName: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 },
  sidebarId: { fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  sidebarProg: { fontSize: 11, color: "#475569", marginTop: 2 },
  sidebarYearLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#334155", padding: "10px 8px 4px" },
  sidebarSemBtn: {
    display: "flex", alignItems: "center", gap: 4,
    width: "100%", textAlign: "left", padding: "8px 10px",
    borderRadius: 8, border: "none", background: "transparent",
    color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
    marginBottom: 2, transition: "all 0.15s",
  },
  sidebarSemBtnActive: { background: "rgba(59,130,246,0.15)", color: "#93c5fd" },
  sidebarSemBtnEmpty: { opacity: 0.5 },
  semDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginLeft: "auto" },
  logoutBtn: {
    marginTop: "auto", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13,
    fontFamily: "inherit", transition: "all 0.2s",
  },

  mainArea: { flex: 1, padding: "32px 40px", overflowY: "auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.5px" },
  classBadge: {
    padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
    fontFamily: "monospace",
  },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16, marginBottom: 24 },
  statCard: {
    padding: "20px 18px", borderRadius: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid",
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  statSub: { fontSize: 11, color: "#475569", marginTop: 2 },

  semPanel: {
    background: "rgba(255,255,255,0.03)", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 24,
  },
  semPanelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap", gap: 8,
  },
  semPanelTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  semPanelStats: { fontSize: 13, color: "#64748b", fontFamily: "monospace" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },
  td: { padding: "12px 16px", fontSize: 14, color: "#cbd5e1" },
  trEven: { background: "rgba(255,255,255,0.02)" },
  trOdd: { background: "transparent" },
  markPill: {
    display: "inline-block", padding: "3px 10px", borderRadius: 999,
    fontSize: 13, fontWeight: 600, fontFamily: "monospace",
  },

  emptyState: {
    padding: "60px 20px", textAlign: "center",
  },
  emptyText: { fontSize: 16, color: "#64748b", margin: "8px 0 4px" },
  emptySubText: { fontSize: 13, color: "#334155" },

  studentGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
    gap: 16, padding: 20,
  },
  studentCard: {
    background: "rgba(255,255,255,0.04)", borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "16px 18px", cursor: "pointer", textAlign: "left",
    transition: "all 0.2s", fontFamily: "inherit",
  },
  studentCardName: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  studentCardId: { fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  studentCardEdit: { marginTop: 12, fontSize: 13, color: "#3b82f6" },

  tableInput: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9", padding: "6px 10px", borderRadius: 8,
    fontSize: 13, fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box",
  },
  addBtn: {
    padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.4)",
    background: "rgba(59,130,246,0.1)", color: "#60a5fa", cursor: "pointer",
    fontSize: 13, fontFamily: "inherit",
  },
  saveBtn: {
    padding: "8px 20px", borderRadius: 8, border: "none",
    background: "linear-gradient(135deg,#16a34a,#15803d)",
    color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
  },
  removeBtn: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#f87171", padding: "4px 8px", borderRadius: 6, cursor: "pointer",
    fontSize: 12,
  },

  yearSummaryRow: {
    background: "rgba(255,255,255,0.03)", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", padding: 20,
  },
  yearCard: {
    flex: "1 1 120px", minWidth: 120,
    background: "rgba(255,255,255,0.04)", borderRadius: 12,
    border: "1px solid", padding: "16px 14px", textAlign: "center",
  },
  yearCardLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 6 },
  yearCardCWA: { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  yearCardSub: { fontSize: 11, color: "#475569", marginTop: 2 },
  yearCardGPA: { fontSize: 13, color: "#94a3b8", marginTop: 8 },
  yearCardClass: { fontSize: 13, fontWeight: 700, marginTop: 4 },

  splashSpinner: {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(59,130,246,0.2)",
    borderTopColor: "#3b82f6",
    animation: "spin 0.8s linear infinite",
  },
};