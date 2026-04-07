import { createContext, useState, useContext } from "react";
const AuthContext = createContext();

export const AuthProvider = ({children}) =>{
    const[token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const login = (tokenData, userData) =>{
        localStorage.setItem('token', tokenData);
        localStorage.setItem('user',JSON.stringify(userData));
        setToken(tokenData);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }
    
    return (
        <AuthContext.Provider value={{token, user, login, logout}}>
            {children}
            </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);