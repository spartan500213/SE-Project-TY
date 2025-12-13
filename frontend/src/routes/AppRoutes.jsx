import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";

// --- Pages ---
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Home from "../pages/Home";
import ApplicationForm from "../components/ApplicationForm";
import AdminDashboard from "../components/AdminDashboard";

// --- MIS Portal ---
import MISLoginPage from "../pages/MISLoginPage";
import StudentDashboard from "../pages/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import MISAdminDashboard from "../pages/MISAdminDashboard"

export default function AppRoutes() {
	const { user } = useContext(AuthContext);
	let isAdmin = false;

	if (user?.token) {
		try {
			const decoded = jwtDecode(user.token);
			isAdmin = decoded.email === "admin@unimis.com";
		} catch {
			isAdmin = false;
		}
	}

	return (
		<Routes>
			{/* ===== Public Landing ===== */}
			<Route
				path="/"
				element={
					user ? (
						isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />
					) : (
						<Landing />
					)
				}
			/>

			{/* ===== Admissions System Auth ===== */}
			<Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
			<Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />

			{/* ===== Admissions Authenticated Routes ===== */}
			<Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
			<Route
				path="/apply"
				element={user ? <ApplicationForm /> : <Navigate to="/login" />}
			/>

			{/* ===== Admin Panel ===== */}
			<Route
				path="/admin"
				element={
					user ? (
						isAdmin ? <AdminDashboard /> : <Navigate to="/home" />
					) : (
						<Navigate to="/login" />
					)
				}
			/>

			{/* ===== MIS PORTAL ===== */}
			<Route path="/mis/login" element={<MISLoginPage />} />
			<Route path="/mis/student" element={<StudentDashboard />} />
			<Route path="/mis/teacher" element={<TeacherDashboard />} />
			<Route path="/mis/admin" element={<MISAdminDashboard />} />


			{/* ===== Fallback ===== */}
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	);
}
