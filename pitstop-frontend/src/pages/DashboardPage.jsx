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
    

    const [sosData, setSosData] = useState(defaultSosData);

    //Fetch user's jobs - nop userId in URL, JWT handles identity
    useEffect(()=>{
        api.get('/api/jobs/my')
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
        navigator.geolocation.getCurrentPosition((pos) => {
            setSosData(prev => ({
                ...prev,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }));
            setShowSos(true);
        });
    };

    const submitSos = async () => {
        try{
            const res = await api.post('/api/jobs/sos', sosData);
            //Reset form 
            setSosData(defaultSosData);
            setShowSos(false);
            // Show success + refresh job list
            setSosSuccess(true);
            setJobs(prev =>[...prev, res.data]);
        } catch (err){
            setSosError('Failed to send SOS. Please try again.');
            console.log(err);
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

        <button onClick={submitSos}>Send SOS</button>
        <button onClick={() => setShowSos(false)}>Cancel</button>
    </div>
)}
    <button onClick={handleSos}>🆘 SOS</button>

            {/* Job list */}
            <h3>Your Jobs</h3>
            {jobs.length ==0 ? (
                <p>No jobs yet.</p>
            ) : (
                jobs.map(job => (
                    <div key ={job.id}>
                        <p>Status: {job.status}</p>
                        <p>Problem: {job.problemType}</p>
                        <p>Description: {job.description}</p>
                        <p>Address:{job.address}</p>
                    </div>
                ))
            )}
        </div>
    );
}