// TeacherDashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

/**
 * Teacher Dashboard — polished version
 * - Requires TailwindCSS + framer-motion
 * - API endpoints are the same as your original code (localhost:3000/...)
 */

const fadeUp = {
	hidden: { opacity: 0, y: 8 },
	enter: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 28 } },
	exit: { opacity: 0, y: 6, transition: { duration: 0.18 } },
};

const cardHover = { scale: 1.02 };

function useToast() {
	const [toasts, setToasts] = useState([]);
	const push = (msg, type = "info", ttl = 3500) => {
		const id = Date.now() + Math.random();
		setToasts((t) => [...t, { id, msg, type }]);
		setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
	};
	return { toasts, push, remove: (id) => setToasts((t) => t.filter((x) => x.id !== id)) };
}

function Avatar({ firstname = "", lastname = "" }) {
	const initials = (firstname?.[0] || "") + (lastname?.[0] || "");
	return (
		<div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold">
			{initials || "NA"}
		</div>
	);
}

const SubjectCard = React.memo(({ subj, selected, onClick }) => {
	return (
		<motion.div
			layout
			initial="hidden"
			animate="enter"
			exit="exit"
			variants={fadeUp}
			whileHover={cardHover}
			onClick={() => onClick(subj.subject_id)}
			className={`cursor-pointer p-5 rounded-2xl border transition-shadow ${selected ? "bg-indigo-50 border-indigo-500 shadow-md" : "bg-white border-gray-100 hover:shadow-sm"}`}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick(subj.subject_id)}
		>
			<h3 className="text-lg font-semibold text-indigo-700">{subj.subject_name}</h3>
			<p className="text-sm text-gray-500 mt-1">{subj.course_name}</p>
			<div className="mt-3 text-xs text-gray-400">ID: {subj.subject_id}</div>
		</motion.div>
	);
});

function LoadingSkeleton() {
	return (
		<div className="space-y-3">
			<div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
				))}
			</div>
		</div>
	);
}

export default function TeacherDashboard() {
	const token = localStorage.getItem("mis_token");

	const [teacher, setTeacher] = useState(null);
	const [subjects, setSubjects] = useState([]);
	const [students, setStudents] = useState([]);
	const [selectedSubject, setSelectedSubject] = useState(null);

	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loadingSubjects, setLoadingSubjects] = useState(false);
	const [loadingStudents, setLoadingStudents] = useState(false);

	const [error, setError] = useState("");
	const [pendingOps, setPendingOps] = useState({}); // { "misid:action": true }
	const toast = useToast();

	// Fetch Teacher Profile
	useEffect(() => {
		let mounted = true;
		const fetchTeacher = async () => {
			setLoadingProfile(true);
			try {
				const res = await fetch("http://localhost:3000/mis/teacher/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data?.error || "Failed to load profile");
				if (mounted) setTeacher(data.teacher);
			} catch (err) {
				setError(err.message || "Unknown error");
				toast.push("Could not load profile.", "error");
			} finally {
				if (mounted) setLoadingProfile(false);
			}
		};
		fetchTeacher();
		return () => { mounted = false; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	// Load Subjects
	const loadSubjects = useCallback(async () => {
		setLoadingSubjects(true);
		try {
			const res = await fetch("http://localhost:3000/mis/teacher/subjects", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load subjects");
			setSubjects(data.subjects || []);
			setStudents([]);
			setSelectedSubject(null);
			toast.push("Subjects loaded", "success");
		} catch (err) {
			toast.push(err.message || "Failed to load subjects", "error");
		} finally {
			setLoadingSubjects(false);
		}
	}, [token, toast]);

	// Load Students for a Subject
	const viewStudents = useCallback(async (subjectId) => {
		if (!subjectId) return;
		setSelectedSubject(subjectId);
		setLoadingStudents(true);
		try {
			const res = await fetch(`http://localhost:3000/mis/teacher/subject/${subjectId}/students`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load students");
			// ensure predictable keys / shape
			const normalized = (data.students || []).map((s) => ({
				...s,
				midsem_marks: s.midsem_marks ?? 0,
				endsem_marks: s.endsem_marks ?? 0,
				internal_marks: s.internal_marks ?? 0,
				lectures_attended: s.lectures_attended ?? 0,
				total_lectures: s.total_lectures ?? 0,
			}));
			setStudents(normalized);
			toast.push(`Loaded ${normalized.length} students`, "info");
		} catch (err) {
			toast.push(err.message || "Failed to load students", "error");
		} finally {
			setLoadingStudents(false);
		}
	}, [token, toast]);

	useEffect(() => {
		// Optionally auto-load subjects on mount
		if (!subjects.length) loadSubjects();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// optimistic helpers
	const setPending = (key, v = true) => setPendingOps((p) => ({ ...p, [key]: v }));
	const clearPending = (key) => setPendingOps((p) => { const cp = { ...p }; delete cp[key]; return cp; });

	// Mark attendance (optimistic)
	const markAttendance = async (mis_id, status) => {
		if (!selectedSubject) return;
		const key = `${mis_id}:attendance`;
		setPending(key, true);

		// optimistic update
		const prevStudents = students;
		const next = students.map((s) =>
			s.mis_id === mis_id
				? {
					...s,
					lectures_attended: status === "present" ? (Number(s.lectures_attended || 0) + 1) : Math.max(0, (Number(s.lectures_attended || 0) - 1)),
				}
				: s
		);
		setStudents(next);

		try {
			const res = await fetch(`http://localhost:3000/mis/teacher/subject/${selectedSubject}/attendance`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ mis_id, status }),
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.error || "Failed to mark attendance");
			}
			toast.push("Attendance updated", "success");
		} catch (err) {
			setStudents(prevStudents); // rollback
			toast.push(err.message || "Attendance update failed", "error");
		} finally {
			clearPending(key);
		}
	};

	// Update marks (optimistic, with simple validation)
	const updateMarks = async (mis_id, type, marksRaw) => {
		const marks = Number(marksRaw);
		const maxByType = { midsem: 30, endsem: 50, internal: 20 };
		if (Number.isNaN(marks) || marks < 0 || marks > (maxByType[type] ?? 100)) {
			toast.push(`Invalid ${type} marks. Must be 0–${maxByType[type]}`, "error");
			return;
		}

		const key = `${mis_id}:marks:${type}`;
		setPending(key, true);

		const prevStudents = students;
		const next = students.map((s) =>
			s.mis_id === mis_id ? { ...s, [`${type}_marks`]: marks } : s
		);
		setStudents(next);

		try {
			const res = await fetch(`http://localhost:3000/mis/teacher/subject/${selectedSubject}/marks`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ mis_id, type, marks }),
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.error || "Failed to update marks");
			}
			toast.push("Marks updated", "success");
		} catch (err) {
			setStudents(prevStudents); // rollback
			toast.push(err.message || "Marks update failed", "error");
		} finally {
			clearPending(key);
		}
	};

	const subjectsList = useMemo(() => subjects, [subjects]);

	if (error)
		return (
			<div className="flex justify-center items-center min-h-screen">
				<p className="text-red-600 text-lg font-medium">{error}</p>
			</div>
		);

	if (loadingProfile)
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="text-center">
					<div className="text-gray-600 mb-3">Loading teacher dashboard...</div>
					<div className="inline-block w-64 h-6 bg-gray-200 animate-pulse rounded" />
				</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-10 px-4">
			<div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
				<header className="flex items-center justify-between mb-6 gap-4">
					<div>
						<h1 className="text-3xl font-extrabold text-indigo-700">
							Welcome, {teacher.full_name} <span className="ml-2">👋</span>
						</h1>
						<p className="text-sm text-gray-500">Manage attendance, marks & student records — fast.</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={loadSubjects}
							disabled={loadingSubjects}
							className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:brightness-95 transition"
						>
							{loadingSubjects ? "Loading..." : "Reload Subjects"}
						</button>
						<div className="text-right">
							<div className="text-xs text-gray-400">Teacher ID</div>
							<div className="text-sm font-medium text-gray-700">{teacher.teacher_id ?? "—"}</div>
						</div>
					</div>
				</header>

				{/* subject grid */}
				<section className="mb-8">
					{loadingSubjects ? (
						<LoadingSkeleton />
					) : subjectsList.length > 0 ? (
						<motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
							<AnimatePresence>
								{subjectsList.map((subj) => (
									<SubjectCard
										key={subj.subject_id}
										subj={subj}
										selected={selectedSubject === subj.subject_id}
										onClick={viewStudents}
									/>
								))}
							</AnimatePresence>
						</motion.div>
					) : (
						<div className="rounded-xl p-6 bg-white border border-dashed border-gray-200 text-center text-gray-500">
							No subjects found. Click <button onClick={loadSubjects} className="text-indigo-600 underline">Load My Subjects</button>.
						</div>
					)}
				</section>

				{/* students table */}
				<section>
					<AnimatePresence>
						{loadingStudents ? (
							<motion.div {...fadeUp} className="p-6 bg-white rounded-lg shadow-sm">
								<div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-3" />
								<div className="space-y-2">
									{Array.from({ length: 6 }).map((_, i) => (
										<div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
									))}
								</div>
							</motion.div>
						) : students.length > 0 ? (
							<motion.div layout initial="hidden" animate="enter" exit="exit" variants={fadeUp}>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-2xl font-semibold text-indigo-700">Students Enrolled</h2>
									<div className="text-sm text-gray-500">Subject: <span className="font-medium text-gray-700">{selectedSubject}</span></div>
								</div>

								<div className="overflow-x-auto rounded-lg border border-gray-200">
									<table className="min-w-full">
										<thead className="bg-indigo-50">
											<tr>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">Student</th>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">MIS ID</th>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">Attendance</th>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">Midsem (30)</th>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">Endsem (50)</th>
												<th className="p-3 text-left text-xs font-semibold text-gray-600">Internal (20)</th>
											</tr>
										</thead>
										<tbody>
											{students.map((stu) => {
												const keyPresent = `${stu.mis_id}:attendance`;
												return (
													<motion.tr key={stu.mis_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t hover:bg-gray-50">
														<td className="p-3 flex items-center gap-3">
															<Avatar firstname={stu.firstname} lastname={stu.lastname} />
															<div>
																<div className="text-sm font-medium text-gray-800">{stu.firstname} {stu.lastname}</div>
																<div className="text-xs text-gray-400"> {stu.email ?? ""} </div>
															</div>
														</td>
														<td className="p-3 text-sm text-gray-600">{stu.mis_id}</td>
														<td className="p-3">
															<div className="flex items-center gap-2">
																<button
																	onClick={() => markAttendance(stu.mis_id, "present")}
																	disabled={!!pendingOps[keyPresent]}
																	className="px-2 py-1 rounded text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
																>
																	Present
																</button>
																<button
																	onClick={() => markAttendance(stu.mis_id, "absent")}
																	disabled={!!pendingOps[keyPresent]}
																	className="px-2 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
																>
																	Absent
																</button>
																<div className="text-xs text-gray-500">
																	{stu.lectures_attended}/{stu.total_lectures}
																</div>
															</div>
														</td>

														{/* marks columns */}
														<td className="p-3">
															<input
																type="number"
																min={0}
																max={30}
																defaultValue={stu.midsem_marks}
																onBlur={(e) => updateMarks(stu.mis_id, "midsem", e.target.value)}
																className="w-20 border rounded px-2 py-1 text-sm"
																aria-label={`Midsem marks for ${stu.firstname}`}
															/>
														</td>
														<td className="p-3">
															<input
																type="number"
																min={0}
																max={50}
																defaultValue={stu.endsem_marks}
																onBlur={(e) => updateMarks(stu.mis_id, "endsem", e.target.value)}
																className="w-20 border rounded px-2 py-1 text-sm"
																aria-label={`Endsem marks for ${stu.firstname}`}
															/>
														</td>
														<td className="p-3">
															<input
																type="number"
																min={0}
																max={20}
																defaultValue={stu.internal_marks}
																onBlur={(e) => updateMarks(stu.mis_id, "internal", e.target.value)}
																className="w-20 border rounded px-2 py-1 text-sm"
																aria-label={`Internal marks for ${stu.firstname}`}
															/>
														</td>
													</motion.tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</motion.div>
						) : selectedSubject ? (
							<motion.div {...fadeUp} className="p-6 bg-white rounded-lg text-gray-500">
								No students enrolled for this subject.
							</motion.div>
						) : null}
					</AnimatePresence>
				</section>

				{/* toast stack */}
				<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
					{toast.toasts.map((t) => (
						<motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`px-4 py-2 rounded shadow-md text-sm ${t.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : t.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-white border border-gray-200 text-gray-800"}`}>
							{t.msg}
						</motion.div>
					))}
				</div>
			</div>
		</div>
	);
}
