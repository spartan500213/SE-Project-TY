import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

export default function StudentDashboard() {
	const [student, setStudent] = useState(null);
	const [subjects, setSubjects] = useState([]);
	const [selected, setSelected] = useState([]);
	const [enrolledSubjects, setEnrolledSubjects] = useState([]);
	const [error, setError] = useState("");
	const [modalSubject, setModalSubject] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loadingSubjects, setLoadingSubjects] = useState(false);
	const token = localStorage.getItem("mis_token");

	const [toast, setToast] = useState(null);
	const showToast = (msg, type = "info") => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3500);
	};

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await fetch("http://localhost:3000/mis/student/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
				setStudent(data.student);

				// Fetch already enrolled subjects
				const enrollRes = await fetch("http://localhost:3000/mis/student/enrollments", {
					headers: { Authorization: `Bearer ${token}` },
				});
				const enrollData = await enrollRes.json();
				if (enrollRes.ok) setEnrolledSubjects(enrollData.enrolledSubjects);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchProfile();
	}, [token]);

	const loadSubjects = async () => {
		setLoadingSubjects(true);
		try {
			const res = await fetch("http://localhost:3000/mis/student/subjects", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setSubjects(data.subjects);
			setSelected(data.enrolled);
			showToast("Subjects loaded", "success");
		} catch (err) {
			showToast(err.message, "error");
		} finally {
			setLoadingSubjects(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (selected.length !== 5) {
			showToast("Select exactly 5 subjects!", "error");
			return;
		}
		try {
			const res = await fetch("http://localhost:3000/mis/student/subjects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ selectedSubjects: selected }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			showToast(data.message, "success");
			setTimeout(() => window.location.reload(), 1000);
		} catch (err) {
			showToast(err.message, "error");
		}
	};

	// 🆕 Generate certificate or card
	const generateDocument = async (type) => {
		try {
			const res = await fetch(`http://localhost:3000/mis/student/certificate/${type}`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to generate document");
			}
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${type}.pdf`;
			a.click();
			showToast(`${type} generated successfully!`, "success");
		} catch (err) {
			showToast(err.message, "error");
		}
	};

	if (error)
		return (
			<div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-white">
				<p className="text-red-600 text-lg font-medium">{error}</p>
			</div>
		);

	if (loading)
		return (
			<div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-white">
				<div className="text-center">
					<div className="text-purple-600 text-lg mb-2">Loading your dashboard...</div>
					<div className="w-52 h-6 bg-purple-200/50 animate-pulse rounded"></div>
				</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-gradient-to-b from-purple-100 via-white to-white py-10 px-4 relative overflow-hidden">
			{/* floating gradient glow */}
			<div className="absolute -top-20 right-0 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
			<div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>

			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				className="max-w-5xl mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100 relative z-10"
			>
				<h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
					Welcome, {student.firstname}
				</h1>

				{/* === Student Info === */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
				>
					<div className="bg-purple-50 rounded-2xl p-5 shadow-inner border border-purple-100 space-y-2">
						<p><b>MIS ID:</b> {student.mis_id}</p>
						<p><b>Email:</b> {student.email}</p>
						<p><b>Phone:</b> {student.phone}</p>
						<p><b>Address:</b> {student.address}</p>
					</div>
					<div className="bg-indigo-50 rounded-2xl p-5 shadow-inner border border-indigo-100 space-y-2">
						<p><b>Course:</b> {student.course_name}</p>
						<p>
							<b>Fee Status:</b>{" "}
							<span className={`ml-2 px-2 py-1 rounded text-sm ${student.fee_status === "paid"
								? "bg-green-100 text-green-700"
								: "bg-yellow-100 text-yellow-700"
								}`}>
								{student.fee_status}
							</span>
						</p>
						<p><b>Scholarship:</b> {student.is_scholarship ? "Yes" : "No"}</p>
						<p><b>Payment:</b> ₹{student.payment_amount / 100 || 0}</p>
					</div>
				</motion.div>

				{/* === Subject Enrollment Section === */}
				<section className="mt-8">
					<h2 className="text-2xl font-bold text-purple-700 mb-4">
						Subject Selection (Semester 1)
					</h2>

					{enrolledSubjects.length > 0 ? (
						<>
							<p className="text-green-700 font-medium mb-3">
								You’ve already enrolled in these subjects:
							</p>
							<motion.ul
								layout
								className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
							>
								{enrolledSubjects.map((sub, i) => (
									<motion.li
										key={i}
										whileHover={{ scale: 1.04 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => setModalSubject(sub)}
										className="cursor-pointer border border-purple-200 bg-gradient-to-br from-purple-50 to-white px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition"
									>
										{sub.subject_name}
									</motion.li>
								))}
							</motion.ul>
						</>
					) : (
						<div className="space-y-4">
							<p className="text-gray-600">
								Select <span className="font-semibold text-purple-700">any 5</span> subjects.
							</p>
							<button
								onClick={loadSubjects}
								disabled={loadingSubjects}
								className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2 rounded-full shadow hover:brightness-110 transition"
							>
								{loadingSubjects ? "Loading..." : "Load Available Subjects"}
							</button>

							<AnimatePresence>
								{subjects.length > 0 && (
									<motion.form
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										onSubmit={handleSubmit}
									>
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4 mt-5">
											{subjects.map((subject) => (
												<label
													key={subject.subject_id}
													className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${selected.includes(subject.subject_id)
														? "bg-purple-100 border-purple-400"
														: "bg-white hover:bg-purple-50 border-purple-200"
														}`}
												>
													<input
														type="checkbox"
														checked={selected.includes(subject.subject_id)}
														onChange={(e) => {
															if (e.target.checked) {
																setSelected((prev) => [...prev, subject.subject_id]);
															} else {
																setSelected((prev) =>
																	prev.filter((id) => id !== subject.subject_id)
																);
															}
														}}
													/>
													{subject.subject_name}
												</label>
											))}
										</div>
										<button
											type="submit"
											className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition shadow"
										>
											Submit Subjects
										</button>
									</motion.form>
								)}
							</AnimatePresence>
						</div>
					)}
				</section>

				{/* === Documents Section === */}
				<section className="mt-10">
					<h2 className="text-2xl font-semibold text-purple-700 mb-4">Documents</h2>
					<div className="flex flex-col gap-2">
						<a
							href={`http://localhost:3000/${student.id_document_path}`}
							target="_blank"
							rel="noreferrer"
							className="text-indigo-600 hover:underline"
						>
							View Fee Receipt
						</a>
						<a
							href={`http://localhost:3000/${student.merit_document}`}
							target="_blank"
							rel="noreferrer"
							className="text-indigo-600 hover:underline"
						>
							View Merit Document
						</a>
					</div>
				</section>

				{/* 🆕 === Certificates & Cards Section === */}
				<section className="mt-10">
					<h2 className="text-2xl font-semibold text-purple-700 mb-4">
						Certificates & Cards
					</h2>
					<div className="flex flex-wrap gap-4">
						<button
							onClick={() => generateDocument("bonafide")}
							className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full shadow transition"
						>
							Generate Bonafide Certificate
						</button>
						<button
							onClick={() => generateDocument("librarycard")}
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full shadow transition"
						>
							Generate Library Card
						</button>
						<button
							onClick={() => generateDocument("idcard")}
							className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow transition"
						>
							Generate Student ID Card
						</button>
					</div>
				</section>
			</motion.div>

			{/* === Modal === */}
			<AnimatePresence>
				{modalSubject && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							className="bg-white rounded-2xl shadow-2xl p-6 w-96 relative"
						>
							<h3 className="text-xl font-semibold text-purple-700 mb-3">
								{modalSubject.subject_name}
							</h3>
							<p className="mb-2">
								<b>Instructor:</b> {modalSubject.instructor_name || "—"}
							</p>
							<p className="mb-2">
								<b>Attendance:</b>{" "}
								{modalSubject.total_lectures > 0
									? `${modalSubject.lectures_attended}/${modalSubject.total_lectures} (${(
										(modalSubject.lectures_attended /
											modalSubject.total_lectures) *
										100
									).toFixed(1)}%)`
									: "Not available"}
							</p>
							<p className="mb-4">
								<b>Marks:</b>{" "}
								{modalSubject.midsem_marks ?? 0}/30 + {modalSubject.endsem_marks ?? 0}/50 +{" "}
								{modalSubject.internal_marks ?? 0}/20 ={" "}
								<b>
									{(Number(modalSubject.midsem_marks ?? 0) +
										Number(modalSubject.endsem_marks ?? 0) +
										Number(modalSubject.internal_marks ?? 0)) / 1}
									/100
								</b>
							</p>

							<button
								onClick={() => setModalSubject(null)}
								className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
							>
								×
							</button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Toast */}
			<AnimatePresence>
				{toast && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg text-sm ${toast.type === "error"
							? "bg-red-100 border border-red-300 text-red-700"
							: toast.type === "success"
								? "bg-green-100 border border-green-300 text-green-700"
								: "bg-white border border-gray-200 text-gray-700"
							}`}
					>
						{toast.msg}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
