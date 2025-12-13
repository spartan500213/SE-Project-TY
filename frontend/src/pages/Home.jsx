import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Home() {
	const { user, logout } = useContext(AuthContext);
	const [email, setEmail] = useState("");
	const [id, setId] = useState("");
	const [feeStatus, setFeeStatus] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// ✅ Check if current user is admin
	const isAdmin = (() => {
		try {
			const decoded = jwtDecode(user?.token);
			return decoded.email === "admin@unimis.com";
		} catch {
			return false;
		}
	})();

	// ✅ Fetch profile + fee status
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const token = user?.token;
				if (!token) throw new Error("No token found");

				const res = await fetch("http://localhost:3000/user/profile", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (!res.ok) throw new Error("Failed to fetch user data");

				const data = await res.json();
				setId(data.id);
				setEmail(data.email);

				// Fetch fee status (if student)
				if (!isAdmin) {
					const statusRes = await fetch(
						`http://localhost:3000/application/status/${data.id}`,
						{ headers: { Authorization: `Bearer ${token}` } }
					);
					const status = await statusRes.json();
					setFeeStatus(status.fee_status || "pending");
				}
			} catch (err) {
				setError(err.message);
			}
		};
		fetchUserData();
	}, [user, isAdmin]);

	// ✅ Handle Razorpay Payment
	const handlePayment = async () => {
		try {
			setLoading(true);

			const res = await fetch("http://localhost:3000/payment/create-order", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${user.token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ amount: 5000, user_id: id }),
			});

			const order = await res.json();
			if (!order.id) {
				alert(order.error || "Order creation failed");
				setLoading(false);
				return;
			}

			const options = {
				key: order.key,
				amount: order.amount,
				currency: "INR",
				name: "UniMIS",
				description: "Admission Fee Payment",
				order_id: order.id,
				prefill: { email },
				theme: { color: "#6B21A8" },
				handler: async (response) => {
					const verifyRes = await fetch("http://localhost:3000/payment/verify", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${user.token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							user_id: id,
							...response,
						}),
					});
					const data = await verifyRes.json();
					if (verifyRes.ok) {
						alert("Payment successful 🎉");
						setFeeStatus("paid");
					} else {
						alert(data.error || "Payment verification failed");
					}
				},
				modal: {
					ondismiss: () => setLoading(false),
				},
			};

			new window.Razorpay(options).open();
		} catch (err) {
			alert("Payment failed to start");
			console.error(err);
		}
	};

	return (
		// <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-b from-purple-50 to-white px-4">
		<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
			<h1 className="text-3xl font-bold text-purple-700 mb-4">
				Welcome to UniMIS!
			</h1>

			{email && (
				<p className="mb-2 text-gray-700">
					<span className="font-medium">Email:</span> {email}
				</p>
			)}
			{id && (
				<p className="mb-4 text-gray-700">
					<span className="font-medium">User ID:</span> {id}
				</p>
			)}
			{error && <p className="text-red-500 mb-4">{error}</p>}

			{/* === Student View === */}
			{!isAdmin && (
				<div className="flex flex-col gap-3">
					<button
						onClick={() => navigate("/apply")}
						className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition font-medium"
					>
						Go to Application Form
					</button>

					{feeStatus !== "paid" ? (
						<button
							onClick={handlePayment}
							disabled={loading}
							className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-lg transition font-medium"
						>
							{loading ? "Processing..." : "Pay Admission Fees"}
						</button>
					) : (
						<p className="text-green-600 font-medium">Fees Paid ✅</p>
					)}
				</div>
			)}

			{/* === Admin View === */}
			{isAdmin && (
				<button
					onClick={() => navigate("/admin")}
					className="bg-purple-700 text-white py-2 px-6 rounded-lg hover:bg-purple-800 transition font-medium"
				>
					Go to Admin Dashboard
				</button>
			)}

			<button
				onClick={logout}
				className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg mt-4 transition font-medium"
			>
				Logout
			</button>
		</div>
		// </div>
	);
}
