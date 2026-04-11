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

    //SOS request 
    const [showSos, setShowSos] = useState(false);
    const [sosData, setSosData] = useState({
        vehicleType:'CAR',
        problemType:'Tyre',
        description:'',
        address:''
    });

    const handleSos =()=>{
        navigator.geolocation.getCurrentPosition((pos)=>{
            setSosData(prev=>({
                ...prev,
                latitude:pos.coords.latitude,
                longitude:pos.coords.longitude
            }));
            setShowSos(true);
        });
    };

    const submitSos = async ()=>{
        await api.post('/api/jobs/sos', {
            ...sosData,
            userId: user.id
        });
        setShowSos(false);
    };

    return(
        <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Email: {user?.email}</p>
            <button onClick={handleLogout}>Logout</button>
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
        onChange={e => setSosData({...sosData, address: e.target.value})}
        />

        <button onClick={submitSos}>Send SOS</button>
        <button onClick={() => setShowSos(false)}>Cancel</button>
    </div>
)}
    <button onClick={handleSos}>🆘 SOS</button>
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