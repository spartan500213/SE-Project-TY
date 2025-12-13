import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

function App() {
	return (
		<AuthProvider>
			<Router>
				{/* Navbar stays visible on all pages */}
				<Navbar />

				{/* Center page content below the navbar */}
				<div className="flex justify-center mt-10">
					<AppRoutes />
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;
