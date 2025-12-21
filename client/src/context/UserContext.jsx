/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { getCurrentUser, updateUser } from "../services/user";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        // If authentication fails, clear user data
        if (err.response?.status === 401) {
          setUser(null);
          localStorage.removeItem("token");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Only load user if there's a token
    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const updateUserData = async (updates) => {
    try {
      setLoading(true);
      const updatedUser = await updateUser(updates);
      setUser(updatedUser);
      setError(null);
      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem("token");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        updateUserData,
        clearUser,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
