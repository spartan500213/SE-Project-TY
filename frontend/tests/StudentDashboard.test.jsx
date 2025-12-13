import { render, screen, waitFor } from "@testing-library/react";
import StudentDashboard from "../src/pages/StudentDashboard";
import { it, beforeEach, vi, expect } from "vitest";

// Mock localStorage token
beforeEach(() => {
	localStorage.setItem("mis_token", "fake_token_123");
	vi.restoreAllMocks();
});

// Mock fetch globally
window.fetch = vi.fn();

// 🧪 Basic render test
it("renders StudentDashboard with loading screen", async () => {
	fetch
		// mock for /mis/student/profile
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				student: { firstname: "Soham", email: "soham@coep.ac.in", mis_id: "MIS-STU-0001" },
			}),
		})
		// mock for /mis/student/enrollments
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ enrolledSubjects: [] }),
		});

	render(<StudentDashboard />);

	// Check initial loading state
	expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();

	// Wait for student name to appear
	await waitFor(() => expect(screen.getByText(/Welcome, Soham/i)).toBeInTheDocument());
});

// 🧪 Error handling test
it("shows error when API fails", async () => {
	fetch.mockRejectedValueOnce(new Error("Network failure"));

	render(<StudentDashboard />);

	await waitFor(() =>
		expect(screen.getByText(/network failure/i)).toBeInTheDocument()
	);
});
