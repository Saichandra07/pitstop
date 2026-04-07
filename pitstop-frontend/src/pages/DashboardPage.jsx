import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function DashboardPage(){
    const { user, logout} = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);

    useEffect(()=>{
        api.get(`/api/jobs/user/${user.id}`)
        .then(res => setJobs(res.data))
        .catch(err => console.log(err));
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return(
        <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Email: {user?.email}</p>
            <button onClick={handleLogout}>Logout</button>

            <h3>Your Jobs</h3>
            {jobs.length ==0 ? (
                <p>No jobs yet.</p>
            ) : (
                jobs.map(job => (
                    <div key ={job.id}>
                        <p>Status: {job.status}</p>
                        <p>Description:{job.description}</p>
                    </div>
                ))
            )}
        </div>
    );
}