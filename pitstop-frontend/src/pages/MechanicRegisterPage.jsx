import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function MechanicRegisterPage(){
    const [form, setForm] = useState({
        name: "", email:"", password:"",
        phone:"", expertise: "", serviceRadiusKm: ""
    });

    const navigate = useNavigate();

    const handleChange = (e)=> {
        setForm({...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) =>{
        e.preventDefault();
        try {
            await api.post("/auth/register", {
                ...form,
                role: "MECHANIC",
                serviceRadiusKm: Number(form.serviceRadiusKm)
            });
            alert("Registered! Your account is pending verification. Please login");
            navigate("/login");
        } catch (err){
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return(
        <form onSubmit={handleSubmit}>
            <h2>Mechanic Register</h2>
            <input name="name" placeholder="Name" onChange={handleChange}/>
            <input name="email" placeholder="Email" type="email" onChange={handleChange}/>
            <input name="password" placeholder="Password" type="password" onChange={handleChange}/>
            <input name="phone" placeholder="Phone" onChange={handleChange}/>
            <input name="expertise" placeholder="Expertise (e.g. Engine Tyres)" onChange={handleChange}/>
            <input name="serviceRadiusKm" placeholder="Service Radius (Km)" type="number" onChange={handleChange}/>
            <button type="submit">Register as Mechanic</button>
            <p>Already have an account? <a href="/login">Login here</a></p>
        </form>
    )
}