import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const { login } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:3000/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Login failed");

			login(data.token);

			const decoded = jwtDecode(data.token);
			if (decoded.email === "admin@unimis.com") {
				navigate("/admin");
			} else {
				navigate("/home");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		// <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-b from-purple-50 to-white px-4">
		<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
			<h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
				UniMIS Login
			</h2>

			<form onSubmit={handleLogin} className="flex flex-col gap-5">
				<div>
					<label className="block text-gray-700 font-medium mb-1">
						Email
					</label>
					<input
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
						required
					/>
				</div>

				<div>
					<label className="block text-gray-700 font-medium mb-1">
						Password
					</label>
					<input
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg shadow-md transition disabled:opacity-60"
				>
					{loading ? "Logging in..." : "Login"}
				</button>
			</form>

			{error && (
				<p className="text-red-500 text-center text-sm mt-3">{error}</p>
			)}

			<p className="text-center text-sm text-gray-600 mt-6">
				Don’t have an account?{" "}
				<Link
					to="/signup"
					className="text-purple-600 font-medium hover:underline"
				>
					Sign up
				</Link>
			</p>
		</div>
		// </div>
	);
}
