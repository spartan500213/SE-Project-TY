import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MISLoginPage from "../src/pages/MISLoginPage";
import { vi, beforeEach, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

// --- wrap in Router (since component uses useNavigate)
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

// --- global mocks
window.fetch = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

beforeEach(() => {
	vi.restoreAllMocks();
	window.fetch.mockReset();
	localStorage.clear();
});

//
// 🧪 1️⃣ renders the login form correctly
//
it("renders MIS login form", () => {
	renderWithRouter(<MISLoginPage />);
	expect(screen.getByPlaceholderText(/enter your mis email/i)).toBeInTheDocument();
	expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

//
// 🧪 2️⃣ successful teacher login → navigates to /mis/teacher
//
it("logs in teacher and navigates to teacher dashboard", async () => {
	window.fetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({
			token: "abc123",
			role: "teacher",
		}),
	});

	renderWithRouter(<MISLoginPage />);

	fireEvent.change(screen.getByPlaceholderText(/enter your mis email/i), {
		target: { value: "teacher@uni.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "secret" },
	});

	fireEvent.click(screen.getByRole("button", { name: /login/i }));

	await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/mis/teacher"));
	expect(localStorage.getItem("mis_token")).toBe("abc123");
	expect(localStorage.getItem("mis_role")).toBe("teacher");
});

//
// 🧪 3️⃣ successful student login → navigates to /mis/student
//
it("logs in student and navigates to student dashboard", async () => {
	window.fetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({
			token: "xyz999",
			role: "student",
		}),
	});

	renderWithRouter(<MISLoginPage />);

	fireEvent.change(screen.getByPlaceholderText(/enter your mis email/i), {
		target: { value: "student@uni.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "pass123" },
	});

	fireEvent.click(screen.getByRole("button", { name: /login/i }));

	await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/mis/student"));
	expect(localStorage.getItem("mis_token")).toBe("xyz999");
	expect(localStorage.getItem("mis_role")).toBe("student");
});

//
// 🧪 4️⃣ failed login → shows error message
//
it("shows error on invalid credentials", async () => {
	window.fetch.mockResolvedValueOnce({
		ok: false,
		json: async () => ({ error: "Invalid credentials" }),
	});

	renderWithRouter(<MISLoginPage />);

	fireEvent.change(screen.getByPlaceholderText(/enter your mis email/i), {
		target: { value: "wrong@uni.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "badpass" },
	});

	fireEvent.click(screen.getByRole("button", { name: /login/i }));

	await waitFor(() =>
		expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
	);
});

//
// 🧪 5️⃣ shows loading state during submission
//
it("shows 'Logging in…' while request is pending", async () => {
	let resolveFetch;
	window.fetch.mockReturnValue(
		new Promise((res) => {
			resolveFetch = () =>
				res({
					ok: true,
					json: async () => ({ token: "mock", role: "teacher" }),
				});
		})
	);

	renderWithRouter(<MISLoginPage />);

	fireEvent.change(screen.getByPlaceholderText(/enter your mis email/i), {
		target: { value: "teacher@uni.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "secret" },
	});

	fireEvent.click(screen.getByRole("button", { name: /login/i }));

	// immediately after click, should show loading text
	expect(screen.getByRole("button")).toHaveTextContent(/logging in/i);

	// resolve fetch now
	resolveFetch();

	await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
});
