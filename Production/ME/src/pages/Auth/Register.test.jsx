import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
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

describe('Register Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders registration form with all fields', () => {
    const { container } = renderWithRouter(<Register />);
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your phone number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create a password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('updates form fields on change', () => {
    const { container } = renderWithRouter(<Register />);
    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const roleSelect = screen.getByRole('combobox');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'vendor' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('test@example.com');
    expect(phoneInput.value).toBe('1234567890');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
    expect(roleSelect.value).toBe('vendor');
  });

  it('shows validation errors for invalid inputs', async () => {
    const { container } = renderWithRouter(<Register />);
    const form = container.querySelector('form');
    const createAccountButton = screen.getByRole('button', { name: /Create Account/i });
    
    // Remove required attributes to bypass HTML5 validation
    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const roleSelect = screen.getByRole('combobox');

    // Test empty name
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
    
    // Test name too short
    fireEvent.change(nameInput, { target: { value: 'J' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
    });
    
    // Test invalid email
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const { container } = renderWithRouter(<Register />);
    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const roleSelect = screen.getByRole('combobox');
    const form = container.querySelector('form');
    const createAccountButton = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'vendor' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createAccountButton).toBeDisabled();
    });
  });
});
