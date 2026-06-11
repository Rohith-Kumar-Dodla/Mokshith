import { createContext, useContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedAuth = localStorage.getItem('isAuthenticated');

    if (storedUser && storedRole && storedAuth === 'true') {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Login function with mock authentication
  const login = async (email, password, selectedRole) => {
    // Mock authentication - in production, this would call an API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock validation
        if (email && password && selectedRole) {
          const mockUser = {
            id: Math.random().toString(36).substr(2, 9),
            email: email,
            name: email.split('@')[0],
            role: selectedRole,
          };

          setUser(mockUser);
          setRole(selectedRole);
          setIsAuthenticated(true);

          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem('role', selectedRole);
          localStorage.setItem('isAuthenticated', 'true');

          resolve({ success: true, user: mockUser });
        } else {
          reject({ success: false, message: 'Invalid credentials' });
        }
      }, 500);
    });
  };

  // Register function with mock registration
  const register = async (userData) => {
    // Mock registration - in production, this would call an API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (userData.name && userData.email && userData.password && userData.role) {
          const mockUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
          };

          resolve({ success: true, user: mockUser });
        } else {
          reject({ success: false, message: 'Invalid registration data' });
        }
      }, 500);
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
  };

  // Context value
  const value = {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
