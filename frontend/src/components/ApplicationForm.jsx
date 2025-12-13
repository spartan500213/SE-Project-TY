import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ApplicationForm() {
	const { user } = useContext(AuthContext);
	const [userId, setUserId] = useState("");
	const [email, setEmail] = useState("");
	const [hasApplied, setHasApplied] = useState(false);
	const [feeStatus, setFeeStatus] = useState("pending");

	const [firstname, setFirstname] = useState("");
	const [middlename, setMiddlename] = useState("");
	const [lastname, setLastname] = useState("");
	const [dob, setDob] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [course, setCourse] = useState("");
	const [isScholarship, setIsScholarship] = useState(false);
	const [idDocument, setIdDocument] = useState(null);
	const [meritDocument, setMeritDocument] = useState(null);

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	// ✅ Fetch user info + check application
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const res = await fetch("http://localhost:3000/user/profile", {
					headers: {
						Authorization: `Bearer ${user.token}`,
						"Content-Type": "application/json",
					},
				});
				if (!res.ok) throw new Error("Failed to fetch user data");
				const data = await res.json();
				setEmail(data.email);
				setUserId(data.id);

				// ✅ Check if already applied + get fee status
				const checkRes = await fetch(
					`http://localhost:3000/application/check/${data.id}`,
					{ headers: { Authorization: `Bearer ${user.token}` } }
				);
				const checkData = await checkRes.json();

				if (checkData.hasApplied) {
					setHasApplied(true);
					setMessage("✅ You have already submitted your application.");
					if (checkData.application?.fee_status) {
						setFeeStatus(checkData.application.fee_status);
					}
				}
			} catch (err) {
				console.error(err);
				setError("Error fetching user info");
			}
		};
		fetchUserData();
	}, [user]);

	// ✅ Handle submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");

		try {
			const formData = new FormData();
			formData.append("user_id", userId);
			formData.append("firstname", firstname);
			formData.append("middlename", middlename);
			formData.append("lastname", lastname);
			formData.append("dob", dob);
			formData.append("phone", phone);
			formData.append("address", address);
			formData.append("email", email);
			formData.append("course", course);
			formData.append("is_scholarship", isScholarship);

			if (idDocument) formData.append("id_document", idDocument);
			if (meritDocument) formData.append("merit_document", meritDocument);

			const res = await fetch("http://localhost:3000/application/apply", {
				method: "POST",
				headers: { Authorization: `Bearer ${user.token}` },
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || "Failed to submit");

			setMessage("🎉 Application submitted successfully!");
			setHasApplied(true);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// ✅ Already applied view
	if (hasApplied) {
		return (
			<div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
				<h2 className="text-3xl font-bold text-purple-700 mb-4">Application Status</h2>
				<p className="text-green-600 text-lg font-medium mb-2">{message}</p>

				<p className="text-gray-700 mb-4">
					Fee Status:{" "}
					<span
						className={`font-semibold ${feeStatus === "paid"
							? "text-green-600"
							: feeStatus === "pending"
								? "text-yellow-500"
								: "text-blue-500"
							}`}
					>
						{feeStatus.toUpperCase()}
					</span>
				</p>

				<p className="text-gray-600">
					Thank you, <span className="font-semibold">{email}</span>. You can only submit once.
				</p>
			</div>
		);
	}

	// ✅ Show form if not applied
	return (
		<div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
			<h2 className="text-3xl font-bold text-center mb-8 text-purple-700">
				Submit Your Application
			</h2>

			<form className="space-y-6" onSubmit={handleSubmit}>
				{/* User Info */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block font-medium mb-1">
							Email <span className="text-red-500">*</span>
						</label>
						<input
							type="email"
							value={email}
							readOnly
							className="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
						/>
					</div>
					<div>
						<label className="block font-medium mb-1">User ID</label>
						<input
							type="text"
							value={userId}
							readOnly
							className="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
						/>
					</div>
				</div>

				{/* Name Fields */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{[
						{ label: "First Name", val: firstname, set: setFirstname, req: true },
						{ label: "Middle Name", val: middlename, set: setMiddlename },
						{ label: "Last Name", val: lastname, set: setLastname, req: true },
					].map((f, i) => (
						<div key={i}>
							<label className="block font-medium mb-1">
								{f.label} {f.req && <span className="text-red-500">*</span>}
							</label>
							<input
								type="text"
								value={f.val}
								onChange={(e) => f.set(e.target.value)}
								className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
								required={f.req}
							/>
						</div>
					))}
				</div>

				{/* DOB & Phone */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block font-medium mb-1">Date of Birth *</label>
						<input
							type="date"
							value={dob}
							onChange={(e) => setDob(e.target.value)}
							className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
							required
						/>
					</div>
					<div>
						<label className="block font-medium mb-1">Phone *</label>
						<input
							type="text"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
							required
						/>
					</div>
				</div>

				{/* Address */}
				<div>
					<label className="block font-medium mb-1">Address *</label>
					<textarea
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
						required
					/>
				</div>

				{/* Course & Scholarship */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block font-medium mb-1">Course *</label>
						<select
							value={course}
							onChange={(e) => setCourse(e.target.value)}
							className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
							required
						>
							<option value="">Select your course</option>
							<option value="Computer Engineering">Computer Engineering</option>
							<option value="Information Technology">Information Technology</option>
							<option value="Robotics and AI">Robotics and AI</option>
							<option value="Electronics and Telecommunication">
								Electronics and Telecommunication
							</option>
							<option value="Mechanical Engineering">Mechanical Engineering</option>
						</select>
					</div>

					<div className="flex items-center mt-6 gap-2">
						<input
							type="checkbox"
							checked={isScholarship}
							onChange={(e) => setIsScholarship(e.target.checked)}
							id="scholarship"
							className="w-4 h-4"
						/>
						<label htmlFor="scholarship" className="font-medium">
							Scholarship
						</label>
					</div>
				</div>

				{/* File Uploads */}
				<div>
					<label className="block font-medium mb-1">
						Upload Identification Document (PDF) <span className="text-red-500">*</span>
					</label>
					<input
						type="file"
						onChange={(e) => setIdDocument(e.target.files[0])}
						accept=".pdf"
						className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
						required
					/>
				</div>

				<div>
					<label className="block font-medium mb-1">
						Upload Merit Document (PDF) <span className="text-red-500">*</span>
					</label>
					<input
						type="file"
						onChange={(e) => setMeritDocument(e.target.files[0])}
						accept=".pdf"
						className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-purple-400"
						required
					/>
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={loading}
					className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
				>
					{loading ? "Submitting..." : "Submit Application"}
				</button>

				{message && <p className="text-green-600 mt-4 font-medium text-center">{message}</p>}
				{error && <p className="text-red-600 mt-4 font-medium text-center">{error}</p>}
			</form>
		</div>
	);
}
