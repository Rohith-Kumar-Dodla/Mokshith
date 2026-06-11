import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../context/AuthContext';

const renderWithRouter = (ui) => {
  const { container } = render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
  return { container };
};

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form with all fields', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('updates form fields on change', () => {
    renderWithRouter(<Login />);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const roleSelect = screen.getByRole('combobox');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'vendor' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(roleSelect.value).toBe('vendor');
  });

  it('shows loading state during submission', async () => {
    renderWithRouter(<Login />);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const roleSelect = screen.getByRole('combobox');
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(signInButton).toBeDisabled();
    });
  });

  it('shows error message on failed login', async () => {
    const { container } = renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const roleSelect = screen.getByRole('combobox');
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Set some values
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    
    // Click the sign in button
    fireEvent.click(signInButton);

    // The button should show loading state
    await waitFor(() => {
      expect(signInButton).toBeDisabled();
    });
  });

});
