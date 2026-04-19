import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const defaultSosData = {
        vehicleType: 'CAR',
        problemType: 'TYRE',
        description: '',
        address: ''
    };

export default function DashboardPage(){
    
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const[jobs, setJobs] = useState([]);
    const [showSos, setShowSos] = useState(false);
    const[sosSuccess, setSosSuccess] = useState(false);
    const[sosError, setSosError] = useState('');
    const [sosLoading, setSosLoading] = useState(false);
    const [sosData, setSosData] = useState(defaultSosData);
    const [cancelError, setCancelError] = useState('');



    //Fetch user's jobs - nop userId in URL, JWT handles identity
    useEffect(()=>{
        api.get('/jobs/my/active')
        .then(res => setJobs(res.data))
        .catch(err => console.log(err));
    }, []);

    const handleLogout =() =>{
        logout();
        navigate("/logout");
    };
    
    const handleSos = () => {
    setSosSuccess(false);
    setSosError('');
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setSosData(prev => ({
                ...prev,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }));
            setShowSos(true);
        },
        () => {
            setSosError('Location access denied. Please enable GPS and try again.');
        }
    );
    };

    const submitSos = async () => {
        setSosLoading(true);
        try {
            const res = await api.post('/jobs/sos', sosData);
            setSosData(defaultSosData);
            setShowSos(false);
            setSosSuccess(true);
            setJobs(prev => [...prev, res.data]);
    }   catch (err) {
            setSosError('Failed to send SOS. Please try again.');
        console.log(err);
    }   finally {
            setSosLoading(false);
        }
    };

    const cancelJob = async (jobId, status) => {
        setCancelError('');
        if (status === 'ACCEPTED') {
            const confirmed = window.confirm('A mechanic is already on the way. Cancel anyway?');
            if (!confirmed) return;
        }
        try {
            await api.patch(`/jobs/${jobId}/cancel`);
            setJobs(prev => prev.filter(job => job.id !== jobId));
        } catch (err) {
            setCancelError(err.response?.data?.message || 'Failed to cancel job.');
        }
    };
    
    return(
        <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Email: {user?.email}</p>
            <p>Role: {user?.role}</p>
            <button onClick={handleLogout}>Logout</button>

            {/* SOS success message */}
            {sosSuccess && (
                <p style={{ color: 'green' }}>
                    ✅ SOS sent! A mechanic will be assigned shortly.
                </p>
            )}
            {showSos && (
        <div>
        <h3>SOS Request</h3>

        <select value={sosData.vehicleType} 
            onChange={e => setSosData({...sosData, vehicleType: e.target.value})}>
        <option value="CAR">Car</option>
        <option value="BIKE">Bike</option>
        <option value="OTHER">Other</option>
        </select>

        <select value={sosData.problemType}
            onChange={e => setSosData({...sosData, problemType: e.target.value})}>
        <option value="TYRE">Tyre</option>
        <option value="BATTERY">Battery</option>
        <option value="ENGINE">Engine</option>
        <option value="ELECTRICAL">Electrical</option>
        <option value="UNKNOWN">Unknown</option>
        </select>

        <input 
      placeholder="Describe your problem..."
      value={sosData.description}
      onChange={e => setSosData({...sosData, description: e.target.value})}
    />

        <input 
        placeholder="Your location (e.g. Ameerpet, Hyderabad)"
        value={sosData.address}
        onChange={e => setSosData({ ...sosData, address: e.target.value})}
        />
        
        {sosError && <p style={{color:'red'}}>{sosError}</p>}

        <button onClick={submitSos} disabled={sosLoading}>{sosLoading ? 'Sending...' : 'SendSOS'}</button>
        <button onClick={() => setShowSos(false)}>Cancel</button>
    </div>
)}
    <button onClick={handleSos}>🆘 SOS</button>

            {/* Job list */}
            <h3>Your Jobs</h3>
            {cancelError && <p style={{ color: 'red' }}>{cancelError}</p>}
            {jobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #ccc', margin: '8px', padding: '8px' }}>
                    <p>Status: {job.status}</p>
                    <p>Problem: {job.problemType}</p>
                    <p>Description: {job.description}</p>
                    <p>Address: {job.address}</p>
                    {(job.status === 'PENDING' || job.status === 'ACCEPTED') && (
                        <button onClick={() => cancelJob(job.id, job.status)}>Cancel</button>
                    )}
                </div>
            ))}
        </div>
    );
}