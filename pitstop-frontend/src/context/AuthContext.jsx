import { createContext, useState, useContext } from "react";
import api from "../api/axios";
const AuthContext = createContext();

export const AuthProvider = ({children}) =>{
    const[token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
});

    const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
};

    const logout = async () => {
        try {
            await api.post('/jobs/logout'); // must run before token is cleared (needs valid JWT)
        } catch {
            // best-effort — proceed with local logout even if the call fails
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (partial) => {
        const updated = { ...user, ...partial };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{token, user, login, logout, updateUser}}>
            {children}
            </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);