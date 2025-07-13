import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, updateUser } from "../services/user";

const UserContext = createContext();

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUserData = async (updates) => {
    try {
      setLoading(true);
      const updatedUser = await updateUser(updates);
      setUser(updatedUser);
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

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        updateUserData,
        clearUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
