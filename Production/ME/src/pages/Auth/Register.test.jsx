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

  it('renders vendor registration form with business fields', () => {
    renderWithRouter(<Register />);
    expect(screen.getByRole('heading', { name: /Vendor Registration/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your business name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter owner name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create a password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register as Vendor/i })).toBeInTheDocument();
  });

  it('updates form fields on change', () => {
    renderWithRouter(<Register />);
    const businessInput = screen.getByPlaceholderText(/Enter your business name/i);
    const ownerInput = screen.getByPlaceholderText(/Enter owner name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const phoneInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);

    fireEvent.change(businessInput, { target: { value: 'Acme Traders' } });
    fireEvent.change(ownerInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(businessInput.value).toBe('Acme Traders');
    expect(ownerInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('test@example.com');
    expect(phoneInput.value).toBe('1234567890');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('shows validation errors for invalid inputs', async () => {
    const { container } = renderWithRouter(<Register />);
    const form = container.querySelector('form');
    const createAccountButton = screen.getByRole('button', { name: /Register as Vendor/i });

    const ownerInput = screen.getByPlaceholderText(/Enter owner name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const phoneInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);

    fireEvent.change(ownerInput, { target: { value: '' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Owner name is required/i)).toBeInTheDocument();
    });

    fireEvent.change(ownerInput, { target: { value: 'J' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Owner name must be at least 2 characters/i)).toBeInTheDocument();
    });

    fireEvent.change(ownerInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Phone number must be 10 digits/i)).toBeInTheDocument();
    });

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your business name/i), {
      target: { value: 'Acme Traders' },
    });
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), {
      target: { value: '123 Main Street' },
    });
    fireEvent.change(screen.getByLabelText(/^Area$/i), { target: { value: 'Central' } });
    fireEvent.change(screen.getByLabelText(/^City$/i), { target: { value: 'Hyderabad' } });
    fireEvent.change(screen.getByLabelText(/^District$/i), { target: { value: 'Hyderabad' } });
    fireEvent.change(screen.getByLabelText(/^State$/i), { target: { value: 'Telangana' } });
    fireEvent.change(screen.getByLabelText(/^Pincode$/i), { target: { value: '500001' } });
    fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123' } });
    fireEvent.click(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });
});
