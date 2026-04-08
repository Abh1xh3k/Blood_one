import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage or mock session
    const storedUser = localStorage.getItem('bloodbankUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    // Mock Admin Password check
    if (password === 'admin') {
      const userData = { email, role: 'admin' };
      setUser(userData);
      localStorage.setItem('bloodbankUser', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Use password: "admin"' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bloodbankUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
