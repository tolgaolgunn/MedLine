import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Appointment = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('face_to_face');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Doktor bilgisi çekilsin
  useEffect(() => {
    fetch(`http://localhost:3005/api/doctors`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(d => String(d.user_id) === String(doctorId));
        setDoctor(found || null);
      });
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!date || !time) {
      setError('Tarih ve saat seçmelisiniz!');
      return;
    }
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const datetime = `${date}T${time}`;
      const response = await fetch('http://localhost:3005/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          patient_id: user.user_id,
          doctor_id: doctorId,
          datetime,
          type
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Randevu başarıyla oluşturuldu!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.message || 'Randevu oluşturulamadı!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'80vh'}}>
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 2px 16px rgba(0,0,0,0.08)',padding:'32px 20px',maxWidth:400,width:'100%'}}>
        <h2 style={{color:'#1976d2',textAlign:'center'}}>Randevu Al</h2>
        {doctor ? (
          <div style={{margin:'18px 0',textAlign:'center'}}>
            <b>{doctor.full_name}</b><br/>
            <span style={{color:'#1976d2'}}>{doctor.specialty}</span><br/>
            <span style={{fontSize:13}}>{doctor.city} / {doctor.district} - {doctor.hospital_name}</span>
          </div>
        ) : (
          <div style={{margin:'18px 0',textAlign:'center',color:'#888'}}>Doktor bilgisi yükleniyor...</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Tarih</label>
            <input type="date" id="date" name="date" value={date} onChange={e => setDate(e.target.value)} required style={{width:'100%',padding:8,marginBottom:12}} />
          </div>
          <div className="form-group">
            <label htmlFor="time">Saat</label>
            <input type="time" id="time" name="time" value={time} onChange={e => setTime(e.target.value)} required style={{width:'100%',padding:8,marginBottom:12}} />
          </div>
          <div className="form-group">
            <label htmlFor="type">Randevu Tipi</label>
            <select id="type" name="type" value={type} onChange={e => setType(e.target.value)} style={{width:'100%',padding:8,marginBottom:12}}>
              <option value="face_to_face">Yüz Yüze</option>
              <option value="online">Online</option>
            </select>
          </div>
          <button type="submit" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:'bold',width:'100%',cursor:'pointer'}} disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}</button>
          {error && <div style={{color:'red',marginTop:10, textAlign:'center'}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10, textAlign:'center'}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default Appointment; 