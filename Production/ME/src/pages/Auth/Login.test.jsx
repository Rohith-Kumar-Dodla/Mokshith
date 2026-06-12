import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../context/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn().mockRejectedValue(new Error('No session')),
    refreshToken: vi.fn(),
    getCsrfToken: vi.fn(),
  },
}));

const renderWithRouter = (ui) => {
  render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders login form with mobile and password fields', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('updates form fields on change', () => {
    renderWithRouter(<Login />);
    const mobileInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(mobileInput.value).toBe('9876543210');
    expect(passwordInput.value).toBe('password123');
  });

  it('shows loading state during submission', async () => {
    renderWithRouter(<Login />);
    const mobileInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(signInButton).toBeDisabled();
    });
  });
});
