import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function AdminDashboard() {
	const [students, setStudents] = useState([]);
	const [teachers, setTeachers] = useState([]);
	const [courses, setCourses] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [activeTab, setActiveTab] = useState("students");
	const [toast, setToast] = useState(null);
	const token = localStorage.getItem("mis_token");

	const showToast = (msg, type = "info") => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3000);
	};

	// Fetch all data
	const fetchAll = async () => {
		try {
			const [stRes, teRes, coRes, suRes] = await Promise.all([
				fetch("http://localhost:3000/mis/admin/students", { headers: { Authorization: `Bearer ${token}` } }),
				fetch("http://localhost:3000/mis/admin/teachers", { headers: { Authorization: `Bearer ${token}` } }),
				fetch("http://localhost:3000/mis/admin/courses", { headers: { Authorization: `Bearer ${token}` } }),
				fetch("http://localhost:3000/mis/admin/subjects", { headers: { Authorization: `Bearer ${token}` } }),
			]);

			const st = await stRes.json();
			const te = await teRes.json();
			const co = await coRes.json();
			const su = await suRes.json();

			setStudents(st.students || []);
			setTeachers(te.teachers || []);
			setCourses(co.courses || []);
			setSubjects(su.subjects || []);
		} catch (err) {
			showToast("Failed to fetch data", "error");
			console.error(err);
		}
	};

	useEffect(() => {
		fetchAll();
	}, []);

	const addEntity = async (entity, data) => {
		try {
			const res = await fetch(`http://localhost:3000/mis/admin/${entity}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.error);
			showToast(result.message, "success");
			fetchAll();
		} catch (err) {
			showToast(err.message, "error");
		}
	};

	// 🗑️ Delete Entity
	const deleteEntity = async (entity, id) => {
		if (!window.confirm(`Are you sure you want to delete this ${entity.slice(0, -1)}?`)) return;
		try {
			const res = await fetch(`http://localhost:3000/mis/admin/${entity}/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error);
			showToast(result.message, "success");
			fetchAll();
		} catch (err) {
			showToast(err.message, "error");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 py-10 px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-purple-100"
			>
				<h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-8 text-center">
					Admin Dashboard
				</h1>

				{/* Tabs */}
				<div className="flex justify-center gap-4 mb-8">
					{["students", "teachers", "courses", "subjects"].map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`px-5 py-2 rounded-full font-medium shadow transition ${activeTab === tab
								? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
								: "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
								}`}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					))}
				</div>

				{/* === Students Table === */}
				{activeTab === "students" && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<h2 className="text-2xl font-semibold text-purple-700 mb-4">All Students</h2>
						<div className="overflow-x-auto">
							<table className="w-full border border-gray-200 text-sm">
								<thead className="bg-purple-100 text-purple-800">
									<tr>
										<th className="p-2">MIS ID</th>
										<th className="p-2">Name</th>
										<th className="p-2">Course</th>
										<th className="p-2">Email</th>
										<th className="p-2">Fee</th>
									</tr>
								</thead>
								<tbody>
									{students.map((s) => (
										<tr key={s.mis_id} className="border-b hover:bg-purple-50">
											<td className="p-2">{s.mis_id}</td>
											<td className="p-2">{`${s.firstname} ${s.middlename || ""} ${s.lastname}`}</td>
											<td className="p-2">{s.course_name}</td>
											<td className="p-2">{s.email}</td>
											<td className="p-2">{s.fee_status}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</motion.div>
				)}

				{/* === Teachers Table === */}
				{activeTab === "teachers" && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<h2 className="text-2xl font-semibold text-indigo-700 mb-4">All Teachers</h2>
						<div className="overflow-x-auto">
							<table className="w-full border text-sm">
								<thead className="bg-indigo-100 text-indigo-800">
									<tr>
										<th className="p-2">Teacher ID</th>
										<th className="p-2">Name</th>
										<th className="p-2">Email</th>
										<th className="p-2">Phone</th>
										<th className="p-2">Joined On</th>
										<th className="p-2 text-center">Action</th>
									</tr>
								</thead>
								<tbody>
									{teachers.map((t) => (
										<tr key={t.teacher_id} className="border-b hover:bg-indigo-50">
											<td className="p-2">{t.teacher_id}</td>
											<td className="p-2">{t.full_name}</td>
											<td className="p-2">{t.email}</td>
											<td className="p-2">{t.phone}</td>
											<td className="p-2">{new Date(t.joined_on).toLocaleDateString()}</td>
											<td className="p-2 text-center">
												<button
													onClick={() => deleteEntity("teachers", t.teacher_id)}
													className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<AddTeacherForm onSubmit={(data) => addEntity("teacher", data)} />
					</motion.div>
				)}

				{/* === Courses Table === */}
				{activeTab === "courses" && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<h2 className="text-2xl font-semibold text-purple-700 mb-4">All Courses</h2>
						<div className="overflow-x-auto">
							<table className="w-full border text-sm">
								<thead className="bg-purple-100 text-purple-800">
									<tr>
										<th className="p-2">Course ID</th>
										<th className="p-2">Course Name</th>
										<th className="p-2">Code</th>
										<th className="p-2">Duration (Years)</th>
										<th className="p-2 text-center">Action</th>
									</tr>
								</thead>
								<tbody>
									{courses.map((c) => (
										<tr key={c.course_id} className="border-b hover:bg-purple-50">
											<td className="p-2">{c.course_id}</td>
											<td className="p-2">{c.course_name}</td>
											<td className="p-2">{c.course_code}</td>
											<td className="p-2">{c.duration}</td>
											<td className="p-2 text-center">
												<button
													onClick={() => deleteEntity("courses", c.course_id)}
													className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<AddCourseForm onSubmit={(data) => addEntity("course", data)} />
					</motion.div>
				)}

				{/* === Subjects Table === */}
				{activeTab === "subjects" && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<h2 className="text-2xl font-semibold text-indigo-700 mb-4">All Subjects</h2>
						<div className="overflow-x-auto">
							<table className="w-full border text-sm">
								<thead className="bg-indigo-100 text-indigo-800">
									<tr>
										<th className="p-2">Subject ID</th>
										<th className="p-2">Name</th>
										<th className="p-2">Course</th>
										<th className="p-2">Teacher</th>
										<th className="p-2 text-center">Action</th>
									</tr>
								</thead>
								<tbody>
									{subjects.map((s) => (
										<tr key={s.subject_id} className="border-b hover:bg-indigo-50">
											<td className="p-2">{s.subject_id}</td>
											<td className="p-2">{s.subject_name}</td>
											<td className="p-2">{s.course_name}</td>
											<td className="p-2">{s.teacher_name}</td>
											<td className="p-2 text-center">
												<button
													onClick={() => deleteEntity("subjects", s.subject_id)}
													className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<AddSubjectForm
							courses={courses}
							teachers={teachers}
							onSubmit={(data) => addEntity("subject", data)}
						/>
					</motion.div>
				)}

				{/* Toast */}
				{toast && (
					<div
						className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm shadow-lg ${toast.type === "error"
							? "bg-red-100 text-red-700 border border-red-300"
							: "bg-green-100 text-green-700 border border-green-300"
							}`}
					>
						{toast.msg}
					</div>
				)}
			</motion.div>
		</div>
	);
}

/* === Helper Forms === */
function AddCourseForm({ onSubmit }) {
	const [course_name, setCourseName] = useState("");
	const [course_code, setCode] = useState("");
	const [duration, setDuration] = useState("");

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit({ course_name, course_code, duration });
				setCourseName(""); setCode(""); setDuration("");
			}}
			className="mt-6 flex flex-wrap gap-3 items-end"
		>
			<input value={course_name} onChange={(e) => setCourseName(e.target.value)} placeholder="Course name" className="border p-2 rounded w-64" />
			<input value={course_code} onChange={(e) => setCode(e.target.value)} placeholder="Course code" className="border p-2 rounded w-48" />
			<input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (years)" className="border p-2 rounded w-48" />
			<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Course</button>
		</form>
	);
}

function AddTeacherForm({ onSubmit }) {
	const [full_name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [joined_on, setJoined] = useState("");

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit({ full_name, email, phone, joined_on });
				setName(""); setEmail(""); setPhone(""); setJoined("");
			}}
			className="mt-6 flex flex-wrap gap-3 items-end"
		>
			<input value={full_name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border p-2 rounded w-64" />
			<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border p-2 rounded w-64" />
			<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="border p-2 rounded w-48" />
			<input type="date" value={joined_on} onChange={(e) => setJoined(e.target.value)} className="border p-2 rounded w-48" />
			<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Teacher</button>
		</form>
	);
}

function AddSubjectForm({ courses, teachers, onSubmit }) {
	const [subject_name, setName] = useState("");
	const [course_id, setCourse] = useState("");
	const [teacher_id, setTeacher] = useState("");

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit({ subject_name, course_id, teacher_id });
				setName(""); setCourse(""); setTeacher("");
			}}
			className="mt-6 flex flex-wrap gap-3 items-end"
		>
			<input value={subject_name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="border p-2 rounded w-64" />
			<select value={course_id} onChange={(e) => setCourse(e.target.value)} className="border p-2 rounded w-52">
				<option value="">Select Course</option>
				{courses.map((c) => (
					<option key={c.course_id} value={c.course_id}>{c.course_name}</option>
				))}
			</select>
			<select value={teacher_id} onChange={(e) => setTeacher(e.target.value)} className="border p-2 rounded w-52">
				<option value="">Select Teacher</option>
				{teachers.map((t) => (
					<option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>
				))}
			</select>
			<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Subject</button>
		</form>
	);
}
