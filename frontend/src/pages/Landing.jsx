import { useNavigate } from "react-router-dom";

export default function Landing() {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
			<h1 className="text-4xl font-bold mb-4 text-purple-700">Welcome to UniMIS</h1>
			<p className="text-gray-600 max-w-lg mb-8">
				University Management and Admission System — a centralized platform where
				students can apply for admission, and administrators can manage applications
				efficiently.
			</p>
			<div className="flex gap-4">
				<button
					onClick={() => navigate("/login")}
					className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
				>
					Login
				</button>
				<button
					onClick={() => navigate("/signup")}
					className="border border-purple-600 text-purple-600 px-6 py-2 rounded hover:bg-purple-100"
				>
					Signup
				</button>
			</div>
		</div>
	);
}
