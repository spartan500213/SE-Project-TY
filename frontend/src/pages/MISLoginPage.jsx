import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MISLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("http://localhost:3000/mis/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Invalid credentials");

			// Store token in localStorage
			localStorage.setItem("mis_token", data.token);
			localStorage.setItem("mis_role", data.role);

			// Redirect based on role
			if (data.role === "teacher") navigate("/mis/teacher");
			else if (data.role === "student") navigate("/mis/student");
			else navigate("/mis/admin"); // optional admin login

		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-purple-100 to-white">
			<form
				onSubmit={handleSubmit}
				className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-gray-200"
			>
				<h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
					MIS Portal Login
				</h2>

				<p className="text-center text-gray-600 mb-4">
					Teachers and Students can log in here
				</p>

				<div className="mb-4">
					<label className="block font-medium mb-1">Email</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
						placeholder="Enter your MIS email"
					/>
				</div>

				<div className="mb-4">
					<label className="block font-medium mb-1">Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
						placeholder="Enter your password"
					/>
				</div>

				{error && (
					<p className="text-red-600 text-center mb-3 font-medium">{error}</p>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50 transition"
				>
					{loading ? "Logging in..." : "Login"}
				</button>
			</form>
		</div>
	);
}
