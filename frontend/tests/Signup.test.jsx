import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Signup from "../src/pages/Signup";
import { vi, beforeEach, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

// 🧩 helper to wrap Router (because component uses useNavigate & Link)
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

// 🧩 global mocks
window.fetch = vi.fn();
const mockNavigate = vi.fn();

// mock useNavigate from react-router-dom
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
});

//
// 🧪 1️⃣ Renders form fields and button
//
it("renders signup form properly", () => {
	renderWithRouter(<Signup />);
	expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
	expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
	expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
});

//
// 🧪 2️⃣ Shows error when passwords do not match
//
it("shows error when passwords do not match", async () => {
	renderWithRouter(<Signup />);

	fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
		target: { value: "test@example.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "123456" },
	});
	fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
		target: { value: "654321" },
	});

	fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

	await waitFor(() => {
		expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
	});
});

//
// 🧪 3️⃣ Successful signup → redirects to /login
//
it("navigates to /login on successful signup", async () => {
	window.fetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({ message: "User created successfully" }),
	});

	renderWithRouter(<Signup />);

	fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
		target: { value: "newuser@example.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "password123" },
	});
	fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
		target: { value: "password123" },
	});

	fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

	await waitFor(() => {
		expect(mockNavigate).toHaveBeenCalledWith("/login");
	});
});

//
// 🧪 4️⃣ Failed signup → shows API error
//
it("shows API error message on failed signup", async () => {
	window.fetch.mockResolvedValueOnce({
		ok: false,
		json: async () => ({ message: "Email already exists" }),
	});

	renderWithRouter(<Signup />);

	fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
		target: { value: "exists@example.com" },
	});
	fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
		target: { value: "password" },
	});
	fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
		target: { value: "password" },
	});

	fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

	await waitFor(() => {
		expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
	});
});
