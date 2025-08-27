import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { BookOpen, FileDown, Save, Send, Search, Plus, Trash2, X } from 'lucide-react';

type Branch = { _id: string; name: string; code: string };
type Student = { _id: string; firstName: string; lastName: string; regdNo: string };
type Subject = { _id: string; name: string; code: string; semester: number };

type SubjectRow = {
  subject?: string;
  name: string;
  code: string;
  marksObtained: number;
  maxMarks: number;
  percentage?: number;
  grade?: string;
  gradePoint?: number;
  credits?: number;
};

function compute(subjects: SubjectRow[]) {
  const computed = subjects.map(s => {
    const max = s.maxMarks || 100;
    const marks = Math.max(0, Math.min(Number(s.marksObtained || 0), max));
    const pct = Math.round((marks / max) * 10000) / 100;
    let grade = 'F';
    let gp = 0;
    if (pct >= 90) { grade = 'O'; gp = 10; }
    else if (pct >= 80) { grade = 'E'; gp = 9; }
    else if (pct >= 70) { grade = 'A'; gp = 8; }
    else if (pct >= 60) { grade = 'B'; gp = 7; }
    else if (pct >= 50) { grade = 'C'; gp = 6; }
    else if (pct >= 40) { grade = 'D'; gp = 5; }
    else { grade = 'F'; gp = 0; }
    return { ...s, percentage: pct, grade, gradePoint: gp, credits: s.credits ?? 3 };
  });
  let totalCredits = 0; let totalGP = 0;
  computed.forEach(s => { const c = Number(s.credits||0); totalCredits += c; totalGP += c * Number(s.gradePoint||0); });
  const sgpa = totalCredits > 0 ? Math.round((totalGP / totalCredits) * 100) / 100 : 0;
  const status = computed.some(s => s.grade === 'F') ? 'Fail' : 'Pass';
  return { subjects: computed, sgpa, status };
}

const Examination: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [saving, setSaving] = useState(false);
  // removed per-student publish in favor of class-level publish
  const [overallCgpa, setOverallCgpa] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClassPublish, setConfirmClassPublish] = useState(false);
  const [confirmClassUnpublish, setConfirmClassUnpublish] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const token = localStorage.getItem('token');
  const filtersReady = (branchId?.trim() || '') !== '' && (semester?.trim() || '') !== '' && (academicYear?.trim() || '') !== '';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(getApiUrl('api/branches'), { headers: { Authorization: `Bearer ${token}` }});
        setBranches(res.data || []);
      } catch (e) { console.error(e); }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!branchId || !semester) return;
      try {
        const [stuRes, subRes] = await Promise.all([
          axios.get(getApiUrl(`api/students?branch=${branchId}&semester=${semester}&limit=1000`), { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(getApiUrl(`api/subjects?branch=${branchId}&semester=${semester}&activeOnly=true`), { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStudents(stuRes.data.students || []);
        setSubjects((subRes.data?.data) || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [branchId, semester]);

  const openAddResult = async (stu: Student) => {
    setSelectedStudent(stu);
    // Prefill rows from subjects
    const baseRows: SubjectRow[] = subjects.map(s => ({ subject: s._id, name: s.name, code: s.code, marksObtained: 0, maxMarks: 100, credits: 3 }));
    try {
      const res = await axios.get(getApiUrl(`api/results/student/${stu._id}?semester=${semester}&academicYear=${academicYear}`), { headers: { Authorization: `Bearer ${token}` } });
      const existing = res.data?.data?.results?.[0];
      if (existing && existing.subjects?.length) {
        setRows(existing.subjects.map((s:any) => ({ subject: s.subject, name: s.name, code: s.code, marksObtained: s.marksObtained, maxMarks: s.maxMarks, credits: s.credits })));
        setShowModal(true);
        return;
      }
    } catch (e) { /* ignore missing */ }
    setRows(baseRows);
    setShowModal(true);
    // Fetch overall CGPA across semesters
    try {
      const cg = await axios.get(getApiUrl(`api/results/student/${stu._id}`), { headers: { Authorization: `Bearer ${token}` } });
      setOverallCgpa(cg.data?.data?.cgpa ?? null);
    } catch { setOverallCgpa(null); }
  };

  const { subjects: computedRows, sgpa, status } = useMemo(() => compute(rows), [rows]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? students.filter(s =>
      s.regdNo.toLowerCase().includes(q) ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
    ) : students;
    return list;
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const save = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const payload = { studentId: selectedStudent._id, semester: Number(semester), academicYear, subjects: rows };
      const res = await axios.post(getApiUrl('api/results'), payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Saved');
      // update rows with computed from server
      const data = res.data?.data;
      if (data?.subjects) setRows(data.subjects);
    } catch (e:any) {
      alert(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  // per-student publish removed; using class-level publish below

  const exportCsv = async () => {
    if (!filtersReady) {
      alert('Please select Branch, Semester, and Academic Year first.');
      return;
    }
    try {
      const res = await axios.get(getApiUrl(`api/results/export?branchId=${branchId}&semester=${semester}&academicYear=${academicYear}`), { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${semester}_${academicYear}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <BookOpen className="w-6 h-6" /> Examination
      </div>

      {/* Modern filter card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Branch</label>
            <select className="mt-1 w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={branchId} onChange={e => { setBranchId(e.target.value); setSelectedStudent(null); }}>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Semester</label>
            <select className="mt-1 w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={semester} onChange={e => { setSemester(e.target.value); setSelectedStudent(null); }}>
              <option value="">Select Semester</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Academic Year</label>
            <input className="mt-1 w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g., 2024-25 or 2025" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Top bar actions */}
      {/* Toolbar: search and actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by Regd No or Name" className="w-full pl-9 pr-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={exportCsv} disabled={!filtersReady} className="px-3 py-2 rounded border flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><FileDown size={16}/> Export CSV</button>
          <button onClick={() => filtersReady && setConfirmClassPublish(true)} disabled={!filtersReady} className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"><Send size={16}/> Publish Class Results</button>
          <button onClick={() => filtersReady && setConfirmClassUnpublish(true)} disabled={!filtersReady} className="px-3 py-2 rounded bg-yellow-600 text-white flex items-center gap-2 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"><Send size={16}/> Unpublish Class Results</button>
        </div>
      </div>

      {/* Students table with actions */}
      <div className="overflow-auto border rounded-xl mt-3 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="p-4 border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200">Registration No</th>
              <th className="p-4 border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200">Student Name</th>
              <th className="p-4 border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200">Branch</th>
              <th className="p-4 border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200">Sem</th>
              <th className="p-4 border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200">Options</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {pagedStudents.map(s => (
              <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center">{s.regdNo}</td>
                <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center">{s.firstName} {s.lastName}</td>
                <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center">{branches.find(b => b._id === branchId)?.code || '-'}</td>
                <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center">{semester || '-'}</td>
                <td className="p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openAddResult(s)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    >
                      Add Result
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(s._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-red-300 text-red-700 dark:border-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <div>Showing {(filteredStudents.length === 0) ? 0 : ((currentPage - 1) * pageSize + 1)} - {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="px-2 py-1 border rounded" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>

      {/* Add/Edit Result Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-xl shadow-2xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Add Result • {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.regdNo})</div>
              <div className="flex gap-2">
                <button onClick={() => setRows(prev => [...prev, { name: '', code: '', marksObtained: 0, maxMarks: 100, credits: 3 }])} className="px-3 py-2 rounded border flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"><Plus size={16}/> Add Row</button>
                <button onClick={save} disabled={saving} className="px-3 py-2 rounded bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700"><Save size={16}/> {saving? 'Saving...' : 'Save'}</button>
                <button onClick={() => setShowModal(false)} className="px-3 py-2 rounded border flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"><X size={16}/> Close</button>
              </div>
            </div>
            <div className="overflow-auto rounded-lg">
              <table className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Code</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Subject</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Marks</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Max</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">%</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Grade</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">GP</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Cr</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {computedRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-40">
                        <select
                          className="w-full border rounded p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          value={rows[idx]?.code ?? ''}
                          onChange={e => {
                            const sel = e.target.value;
                            const subj = subjects.find(s => s.code === sel);
                            setRows(prev => prev.map((x,i)=> i===idx? { ...x, code: sel, name: subj?.name || x.name, subject: subj?._id || x.subject }: x));
                          }}
                        >
                          <option value="">Select code</option>
                          {subjects.map(s => (
                            <option key={s._id} value={s.code}>{s.code} — {s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700">
                        <input className="w-full border rounded p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={rows[idx]?.name ?? ''} onChange={e => {
                          const v = e.target.value;
                          setRows(prev => prev.map((x,i)=> i===idx? { ...x, name: v }: x));
                        }}/>
                      </td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-24"><input type="number" min={0} className="w-full border rounded p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={rows[idx]?.marksObtained ?? 0} onChange={e => {
                        const v = Number(e.target.value);
                        setRows(prev => prev.map((x,i)=> i===idx? { ...x, marksObtained: v }: x));
                      }}/></td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-20"><input type="number" min={1} className="w-full border rounded p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={rows[idx]?.maxMarks ?? 100} onChange={e => {
                        const v = Number(e.target.value);
                        setRows(prev => prev.map((x,i)=> i===idx? { ...x, maxMarks: v }: x));
                      }}/></td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-20">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded">
                            <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, r.percentage || 0))}%` }}></div>
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300 w-10 text-right">{r.percentage?.toFixed(0)}%</div>
                        </div>
                      </td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-16 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.grade === 'F' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>{r.grade}</span>
                      </td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-12 text-center text-gray-900 dark:text-gray-100">{r.gradePoint}</td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-12"><input type="number" min={0} className="w-full border rounded p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={rows[idx]?.credits ?? 3} onChange={e => {
                        const v = Number(e.target.value);
                        setRows(prev => prev.map((x,i)=> i===idx? { ...x, credits: v }: x));
                      }}/></td>
                      <td className="p-1 border border-gray-200 dark:border-gray-700 w-12 text-center">
                        <button className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-200 dark:border-red-700" onClick={() => setRows(prev => prev.filter((_x,i)=> i!==idx))}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200">SGPA: <span className="font-semibold">{sgpa.toFixed(2)}</span> • Status: <span className={`font-semibold ${status==='Pass'?'text-green-600':'text-red-600'}`}>{status}</span> {overallCgpa !== null && <> • CGPA: <span className="font-semibold">{Number(overallCgpa).toFixed(2)}</span></>}</div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Delete result permanently?</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">This will delete the result from database for the selected semester and academic year. This action cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={async () => {
                try {
                  await axios.delete(getApiUrl(`api/results/by-student`), { params: { studentId: confirmDeleteId, semester, academicYear }, headers: { Authorization: `Bearer ${token}` }});
                  setConfirmDeleteId(null);
                  alert('Result deleted');
                } catch (e:any) {
                  alert(e?.response?.data?.message || 'Delete failed');
                }
              }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Class publish confirmation */}
      {confirmClassPublish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Publish all results?</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">This will publish results for all students in the selected Branch, Semester, and Academic Year.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setConfirmClassPublish(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700" onClick={async () => {
                try {
                  await axios.post(getApiUrl('api/results/class/publish'), { branchId, semester: Number(semester), academicYear }, { headers: { Authorization: `Bearer ${token}` } });
                  setConfirmClassPublish(false);
                  alert('Class results published');
                } catch (e:any) {
                  alert(e?.response?.data?.message || 'Publish failed');
                }
              }}>Confirm Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* Class unpublish confirmation */}
      {confirmClassUnpublish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Unpublish all results?</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">This will unpublish results for all students in the selected Branch, Semester, and Academic Year. Students will no longer see these results.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setConfirmClassUnpublish(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700" onClick={async () => {
                try {
                  await axios.post(getApiUrl('api/results/class/unpublish'), { branchId, semester: Number(semester), academicYear }, { headers: { Authorization: `Bearer ${token}` } });
                  setConfirmClassUnpublish(false);
                  alert('Class results unpublished');
                } catch (e:any) {
                  alert(e?.response?.data?.message || 'Unpublish failed');
                }
              }}>Confirm Unpublish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Examination;
