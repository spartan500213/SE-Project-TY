import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Navbar() {
	const { user, logout } = useContext(AuthContext);
	const navigate = useNavigate();

	const isAdmin = (() => {
		try {
			const decoded = jwtDecode(user?.token);
			return decoded.email === "admin@unimis.com";
		} catch {
			return false;
		}
	})();

	return (
		<nav className="bg-purple-700 text-white py-3 px-6 flex justify-between items-center shadow-md">
			<h1
				className="text-xl font-semibold cursor-pointer"
				onClick={() => navigate("/")}
			>
				UniMIS
			</h1>

			<div className="flex items-center gap-6">
				{/* Always visible links */}
				<Link to="/" className="hover:text-gray-200">
					Home
				</Link>

				{/* When no user is logged in (admissions side) */}
				{!user && (
					<>
						<Link to="/login" className="hover:text-gray-200">
							Login
						</Link>
						<Link to="/signup" className="hover:text-gray-200">
							Signup
						</Link>

						{/* MIS Login button (common for teachers & students) */}
						<Link
							to="/mis/login"
							className="bg-white text-purple-700 px-3 py-1 rounded font-medium hover:bg-gray-100 transition"
						>
							MIS Login
						</Link>
					</>
				)}

				{/* When admissions user (student/admin) is logged in */}
				{user && (
					<>
						{!isAdmin && (
							<Link to="/apply" className="hover:text-gray-200">
								Apply
							</Link>
						)}

						{isAdmin && (
							<Link to="/admin" className="hover:text-gray-200">
								Dashboard
							</Link>
						)}

						<button
							onClick={logout}
							className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
						>
							Logout
						</button>
					</>
				)}
			</div>
		</nav>
	);
}
