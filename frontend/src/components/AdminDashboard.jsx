import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AdminDashboard() {
	const { user } = useContext(AuthContext);
	const [applications, setApplications] = useState([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [migrating, setMigrating] = useState(false);
	const [migrationMsg, setMigrationMsg] = useState("");

	useEffect(() => {
		const fetchApplications = async () => {
			try {
				const res = await fetch("http://localhost:3000/admin/applications", {
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				});

				if (!res.ok) throw new Error("Unauthorized or failed to fetch applications");

				const data = await res.json();
				setApplications(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchApplications();
	}, [user]);

	const handleStatusChange = async (id, status) => {
		try {
			const res = await fetch(`http://localhost:3000/admin/applications/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify({ status }),
			});

			if (!res.ok) throw new Error("Failed to update status");

			const updated = applications.map((app) =>
				app.id === id ? { ...app, admission_status: status } : app
			);
			setApplications(updated);
		} catch (err) {
			alert(err.message);
		}
	};

	// ✅ Handle migration
	const handleMigration = async () => {
		setMigrating(true);
		setMigrationMsg("");
		try {
			const res = await fetch("http://localhost:3000/admin/migrate", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Migration failed");

			setMigrationMsg(`✅ ${data.message || "Migration completed successfully!"}`);
		} catch (err) {
			setMigrationMsg(`❌ ${err.message}`);
		} finally {
			setMigrating(false);
		}
	};

	if (loading) return <p className="text-center mt-10">Loading applications...</p>;
	if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

	return (
		<div className="p-8 max-w-7xl mx-auto">
			<h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

			{/* Migration Button */}
			<div className="flex justify-center mb-6">
				<button
					onClick={handleMigration}
					disabled={migrating}
					className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow font-medium disabled:opacity-60"
				>
					{migrating ? "Migrating..." : "Migrate Confirmed Students to MIS"}
				</button>
			</div>
			{migrationMsg && (
				<p
					className={`text-center mb-4 font-medium ${migrationMsg.startsWith("✅") ? "text-green-600" : "text-red-600"
						}`}
				>
					{migrationMsg}
				</p>
			)}

			{/* Table */}
			<div className="overflow-x-auto bg-white rounded shadow-lg">
				<table className="w-full border-collapse">
					<thead className="bg-gray-100 text-gray-700">
						<tr>
							<th className="border p-3 text-left">ID</th>
							<th className="border p-3 text-left">Name</th>
							<th className="border p-3 text-left">Email</th>
							<th className="border p-3 text-left">Course</th>
							<th className="border p-3 text-left">Fee Status</th>
							<th className="border p-3 text-left">Scholarship</th>
							<th className="border p-3 text-left">Admission Status</th>
							<th className="border p-3 text-center">Actions</th>
							<th className="border p-3 text-center">Documents</th>
						</tr>
					</thead>
					<tbody>
						{applications.map((app) => (
							<tr key={app.id} className="hover:bg-gray-50">
								<td className="border p-3">{app.id}</td>
								<td className="border p-3">
									{app.firstname} {app.lastname}
								</td>
								<td className="border p-3">{app.email}</td>
								<td className="border p-3">{app.course}</td>
								<td className="border p-3 capitalize">{app.fee_status}</td>
								<td className="border p-3">{app.is_scholarship ? "Yes" : "No"}</td>
								<td className="border p-3 font-medium capitalize text-blue-600">
									{app.admission_status}
								</td>
								<td className="border p-3 text-center">
									<div className="flex justify-center gap-2">
										<button
											onClick={() => handleStatusChange(app.id, "confirmed")}
											className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
										>
											Approve
										</button>
										<button
											onClick={() => handleStatusChange(app.id, "rejected")}
											className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
										>
											Reject
										</button>
									</div>
								</td>
								<td className="border p-3 text-center">
									<a
										href={`http://localhost:3000/${app.id_document_path}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:underline block"
									>
										Receipt
									</a>
									<a
										href={`http://localhost:3000/${app.merit_document}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:underline block"
									>
										Merit
									</a>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
