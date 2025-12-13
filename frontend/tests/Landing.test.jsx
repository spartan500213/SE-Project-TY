import { render, screen, fireEvent } from "@testing-library/react";
import Landing from "../src/pages/Landing";
import { vi, it, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Helper to render with router context
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

beforeEach(() => {
	mockNavigate.mockReset();
});

//
// 🧪 1️⃣ Renders main heading and description
//
it("renders welcome heading and description", () => {
	renderWithRouter(<Landing />);

	expect(screen.getByText(/welcome to unimis/i)).toBeInTheDocument();
	expect(
		screen.getByText(/university management and admission system/i)
	).toBeInTheDocument();

	expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /signup/i })).toBeInTheDocument();
});

//
// 🧪 2️⃣ Clicking Login navigates to /login
//
it("navigates to /login when Login button clicked", () => {
	renderWithRouter(<Landing />);
	fireEvent.click(screen.getByRole("button", { name: /login/i }));
	expect(mockNavigate).toHaveBeenCalledWith("/login");
});

//
// 🧪 3️⃣ Clicking Signup navigates to /signup
//
it("navigates to /signup when Signup button clicked", () => {
	renderWithRouter(<Landing />);
	fireEvent.click(screen.getByRole("button", { name: /signup/i }));
	expect(mockNavigate).toHaveBeenCalledWith("/signup");
});
