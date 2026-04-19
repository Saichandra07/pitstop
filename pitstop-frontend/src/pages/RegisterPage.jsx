import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "", email: "", password: ""
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // role: USER hardcoded — mechanic register is a separate page (MechanicRegisterPage)
            await api.post("/auth/register", { ...form, role: "USER" });
            alert("Registered! Please login.");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input name="name" placeholder="Name" onChange={handleChange} />
            <input name="email" placeholder="Email" type="email" onChange={handleChange} />
            <input name="password" placeholder="Password" type="password" onChange={handleChange} />
            <button type="submit">Register</button>
            <p>Already have an account? <a href="/login">Login here</a></p>
        </form>
    );
}