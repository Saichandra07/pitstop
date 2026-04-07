import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function RegisterPage(){
    const [form, setForm] = useState({
        name:"", email:"", phone:"",passwordHash:""
    });
    const navigate = useNavigate();

    const handleChange = (e) =>{
        setForm({...form, [e.target.name]: e.target.value});
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        try{
            await api.post("/api/users/register", form);
            alert("Registered! Please login.");
            navigate("/login");
        }catch(err){
            alert(err.response?.data?.message || "Registration failed");
        }
    };
    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input name="name"  placeholder="Name"  onChange={handleChange} />
            <input name="email"  placeholder="Email"  onChange={handleChange} />
            <input name="phone"  placeholder="Phone"  onChange={handleChange} />
            <input name="passwordHash"  placeholder="Password" type="password" onChange={handleChange} />
            <button type="submit">Register</button>
        </form>
    );
}