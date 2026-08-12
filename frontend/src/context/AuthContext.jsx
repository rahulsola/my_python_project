import { createContext, useContext, useEffect, useState } from "react";
import API, {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from "../api/userApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const cachedUser = getStoredUser();

    if (!token) {
      setLoading(false);
      return;
    }

    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);

      API.get("/auth/me")
        .then((response) => {
          setUser(response.data);
          setAuthSession(token, response.data);
        })
        .catch(() => {
          clearAuthSession();
          setUser(null);
        });
      return;
    }

    API.get("/auth/me")
      .then((response) => {
        setUser(response.data);
        setAuthSession(token, response.data);
      })
      .catch(() => {
        clearAuthSession();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    setAuthSession(response.data.access_token, response.data.user);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (name, email, password) => {
    const response = await API.post("/auth/register", { name, email, password });
    setAuthSession(response.data.access_token, response.data.user);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
