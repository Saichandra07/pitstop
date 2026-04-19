import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function HistoryPage() {
    const [jobs, setJobs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/jobs/my/history')
            .then(res => setJobs(res.data))
            .catch(err => console.log(err));
    }, []);

    return (
        <div>
            <h2>Job History</h2>
            <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

            {jobs.length === 0 ? (
                <p>No past jobs yet.</p>
            ) : (
                jobs.map(job => (
                    <div key={job.id} style={{ border: '1px solid #ccc', margin: '8px', padding: '8px' }}>
                        <p>Status: {job.status}</p>
                        <p>Vehicle: {job.vehicleType}</p>
                        <p>Problem: {job.problemType}</p>
                        <p>Description: {job.description}</p>
                        <p>Address: {job.address}</p>
                        <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                ))
            )}
        </div>
    );
}