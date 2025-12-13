import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminDashboard from "../src/pages/MISAdminDashboard";
import { vi, beforeEach, it, expect } from "vitest";

// --- mock setup ---
window.fetch = vi.fn();
const mockToken = "fake_admin_token";
localStorage.setItem("mis_token", mockToken);

beforeEach(() => {
	vi.restoreAllMocks();
	window.fetch.mockReset();
});

// 🧪 1️⃣ should render dashboard title and load all tables successfully
it("renders Admin Dashboard and loads data", async () => {
	// mock all 4 API endpoints in parallel
	window.fetch
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				students: [
					{
						mis_id: "MIS-001",
						firstname: "John",
						lastname: "Doe",
						course_name: "Computer Engineering",
						email: "john@uni.com",
						fee_status: "Paid",
					},
				],
			}),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				teachers: [
					{
						teacher_id: 1,
						full_name: "Dr. Aayushi",
						email: "aayushi@coep.ac.in",
						phone: "9999999999",
						joined_on: "2025-10-30",
					},
				],
			}),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				courses: [
					{ course_id: 1, course_name: "Computer Engg", course_code: "COE101", duration: 4 },
				],
			}),
		})
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				subjects: [
					{
						subject_id: 1,
						subject_name: "AI",
						course_name: "Computer Engg",
						teacher_name: "Dr. Aayushi",
					},
				],
			}),
		});

	render(<AdminDashboard />);

	// Wait for heading
	expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();

	// Students tab visible by default
	await waitFor(() => screen.getByText("All Students"));
	expect(screen.getByText("MIS-001")).toBeInTheDocument();
	expect(screen.getByText(/john doe/i)).toBeInTheDocument();
});

//
// 🧪 2️⃣ Switch between tabs (teachers, courses, subjects)
//
it("switches between tabs properly", async () => {
	// repeat mocks to avoid parallel issue
	window.fetch
		.mockResolvedValueOnce({ ok: true, json: async () => ({ students: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ teachers: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ courses: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ subjects: [] }) });

	render(<AdminDashboard />);

	// Wait for initial load
	await waitFor(() => screen.getByText("All Students"));

	// switch to teachers tab
	fireEvent.click(screen.getByRole("button", { name: /teachers/i }));
	expect(await screen.findByText(/all teachers/i)).toBeInTheDocument();

	// switch to courses tab
	fireEvent.click(screen.getByRole("button", { name: /courses/i }));
	expect(await screen.findByText(/all courses/i)).toBeInTheDocument();

	// switch to subjects tab
	fireEvent.click(screen.getByRole("button", { name: /subjects/i }));
	expect(await screen.findByText(/all subjects/i)).toBeInTheDocument();
});

//
// 🧪 3️⃣ Add course form submits successfully and shows toast
//
it("submits Add Course form and shows success toast", async () => {
	window.fetch
		// initial load mocks
		.mockResolvedValueOnce({ ok: true, json: async () => ({ students: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ teachers: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ courses: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ subjects: [] }) })
		// form submission mock
		.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ message: "Course added successfully" }),
		})
		// refetch after success
		.mockResolvedValueOnce({ ok: true, json: async () => ({ students: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ teachers: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ courses: [] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ subjects: [] }) });

	render(<AdminDashboard />);

	// wait until "All Students" appears
	await waitFor(() => screen.getByText(/all students/i));

	// go to courses tab
	fireEvent.click(screen.getByRole("button", { name: /courses/i }));

	// wait for the "All Courses" title
	await waitFor(() => screen.getByText(/all courses/i));

	// fill and submit AddCourseForm
	fireEvent.change(screen.getByPlaceholderText(/course name/i), { target: { value: "AI Engineering" } });
	fireEvent.change(screen.getByPlaceholderText(/course code/i), { target: { value: "AI101" } });
	fireEvent.change(screen.getByPlaceholderText(/duration \(years\)/i), { target: { value: "4" } });

	fireEvent.click(screen.getByRole("button", { name: /add course/i }));

	// Expect toast to appear
	await waitFor(() =>
		expect(screen.getByText(/course added successfully/i)).toBeInTheDocument()
	);
});

//
// 🧪 4️⃣ Shows error toast on network failure
//
it("shows error toast on fetch failure", async () => {
	window.fetch.mockRejectedValueOnce(new Error("Network error"));

	render(<AdminDashboard />);

	await waitFor(() =>
		expect(screen.getByText(/failed to fetch data/i)).toBeInTheDocument()
	);
});
