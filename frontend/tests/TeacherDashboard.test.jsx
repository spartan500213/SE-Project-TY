import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TeacherDashboard from "../src/pages/TeacherDashboard";
import { vi, beforeEach, it, expect } from "vitest";

// Mock localStorage token
beforeEach(() => {
	localStorage.setItem("mis_token", "fake_token_123");
	vi.restoreAllMocks();
});

// Mock global fetch
window.fetch = vi.fn();

//
// 🧪 1️⃣ Basic render & profile loading test
//
it("renders TeacherDashboard and shows teacher name after loading", async () => {
	// 1st call → teacher profile
	fetch
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				teacher: { full_name: "Dr. Aayushi", teacher_id: "T-001" },
			}),
		})
		// 2nd call → subjects
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				subjects: [
					{ subject_id: 1, subject_name: "AI", course_name: "B.Tech AI" },
					{ subject_id: 2, subject_name: "Robotics", course_name: "B.Tech AI" },
				],
			}),
		});

	render(<TeacherDashboard />);

	// Should first show loading screen
	expect(screen.getByText(/loading teacher dashboard/i)).toBeInTheDocument();

	// After fetch resolves, wait for welcome message
	await waitFor(() => expect(screen.getByText(/Welcome, Dr. Aayushi/i)).toBeInTheDocument());

	// Subjects should also render
	await waitFor(() => expect(screen.getByText("AI")).toBeInTheDocument());
	expect(screen.getByText("Robotics")).toBeInTheDocument();
});

//
// 🧪 2️⃣ Subject click → loads students
//
it("loads students when a subject is clicked", async () => {
	// Mock profile & subjects first
	fetch
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ teacher: { full_name: "Prof. Soham", teacher_id: "T-002" } }),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				subjects: [{ subject_id: 42, subject_name: "Machine Learning", course_name: "AI & DS" }],
			}),
		})
		// Then mock students list
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				students: [
					{
						firstname: "John",
						lastname: "Doe",
						mis_id: "MIS123",
						email: "john@uni.com",
						lectures_attended: 3,
						total_lectures: 5,
						midsem_marks: 20,
						endsem_marks: 35,
						internal_marks: 10,
					},
				],
			}),
		});

	render(<TeacherDashboard />);

	// Wait for subjects to load
	await waitFor(() => screen.getByText("Machine Learning"));

	// Click on the subject card
	fireEvent.click(screen.getByText("Machine Learning"));

	// Wait for student table to appear
	await waitFor(() => screen.getByText(/Students Enrolled/i));

	// Check student's details
	expect(screen.getByText("John Doe")).toBeInTheDocument();
	expect(screen.getByText("MIS123")).toBeInTheDocument();
});

//
// 🧪 3️⃣ Error handling
//
it("shows error message if profile fetch fails", async () => {
	fetch.mockRejectedValueOnce(new Error("Network failure"));

	render(<TeacherDashboard />);

	await waitFor(() => expect(screen.getByText(/network failure/i)).toBeInTheDocument());
});

//
// 🧪 4️⃣ Attendance update optimistic test (mock success)
//
it("calls attendance API and updates toast", async () => {
	// Mock profile → subjects → students → attendance POST
	fetch
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ teacher: { full_name: "Aayushi", teacher_id: "T-005" } }),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				subjects: [{ subject_id: 99, subject_name: "AI", course_name: "B.Tech AI" }],
			}),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				students: [
					{
						firstname: "Soham",
						lastname: "Powar",
						mis_id: "MIS777",
						email: "soham@coep.ac.in",
						lectures_attended: 0,
						total_lectures: 5,
						midsem_marks: 10,
						endsem_marks: 40,
						internal_marks: 15,
					},
				],
			}),
		})
		// mock attendance POST
		.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

	render(<TeacherDashboard />);

	await waitFor(() => screen.getByText("AI"));
	fireEvent.click(screen.getByText("AI"));

	await waitFor(() => screen.getByText("Students Enrolled"));

	// Click "Present" button
	const presentBtn = screen.getByText("Present");
	fireEvent.click(presentBtn);

	// Expect attendance toast to appear
	await waitFor(() => expect(screen.getByText(/Attendance updated/i)).toBeInTheDocument());
});
