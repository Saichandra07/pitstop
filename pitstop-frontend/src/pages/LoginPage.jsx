import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const {login} = useAuth();
    const navigate = useNavigate();


    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            const response = await api.post('/auth/login', {email, password});
            login(response.data.token, {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
                verificationStatus: response.data.verificationStatus
            });
            const role = response.data.role;
            if (role === "ADMIN") navigate("/admin/dashboard");
            else if (role === "MECHANIC") navigate("/mechanic/dashboard");
            else navigate("/dashboard");
        } catch (err){
            console.log('Error:', err.response);
            setError('Invalid email or password');
        }
    };

    return(
        <div>
            <h2>Login</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type = "submit">Login</button>
                <p>Don't have an account ? <a href="/register">Register here</a></p>
            </form>
        </div>
    );
};
export default LoginPage;