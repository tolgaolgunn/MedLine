import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import '../../styles.css';

const worldCountries = [
  { value: 'TR', label: 'Türkiye' },
  { value: 'US', label: 'United States' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'RU', label: 'Russia' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'MX', label: 'Mexico' },
  { value: 'KR', label: 'South Korea' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'AR', label: 'Argentina' },
  { value: 'ZA', label: 'South Africa' },
 
];

const worldCities = [
  { value: 'Istanbul', label: 'Istanbul' },
  { value: 'London', label: 'London' },
  { value: 'New York', label: 'New York' },
  { value: 'Tokyo', label: 'Tokyo' },
  { value: 'Paris', label: 'Paris' },
  { value: 'Berlin', label: 'Berlin' },
  { value: 'Moscow', label: 'Moscow' },
  { value: 'Beijing', label: 'Beijing' },
  { value: 'Los Angeles', label: 'Los Angeles' },
  { value: 'Sydney', label: 'Sydney' },
  { value: 'Toronto', label: 'Toronto' },
  { value: 'Sao Paulo', label: 'Sao Paulo' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Seoul', label: 'Seoul' },
  { value: 'Mexico City', label: 'Mexico City' },
  { value: 'Rome', label: 'Rome' },
  { value: 'Madrid', label: 'Madrid' },
  { value: 'Bangkok', label: 'Bangkok' },
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  
];

const countryOptions = worldCountries;
const cityOptions = worldCities;
const bloodOptions = [
  { value: 'A RH +', label: 'A RH +' },
  { value: 'A RH -', label: 'A RH -' },
  { value: 'B RH +', label: 'B RH +' },
  { value: 'B RH -', label: 'B RH -' },
  { value: 'AB RH +', label: 'AB RH +' },
  { value: 'AB RH -', label: 'AB RH -' },
  { value: '0 RH +', label: '0 RH +' },
  { value: '0 RH -', label: '0 RH -' },
];

const defaultProfileImg = 'https://www.w3schools.com/howto/img_avatar.png';

const UpdateProfile = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    tc_no: '',
    height: '',
    weight: '',
    blood: '',
    country: countryOptions[0],
    city: cityOptions[0],
    family_doctor: '',
    profile_img: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3005/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setForm({
            full_name: data.full_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            birth_date: data.birth_date || '',
            tc_no: data.tc_no || '',
            height: data.height || '',
            weight: data.weight || '',
            blood: bloodOptions.find(opt => opt.value === data.blood) || null,
            country: countryOptions.find(opt => opt.value === data.country) || countryOptions[0],
            city: cityOptions.find(opt => opt.value === data.city) || cityOptions[0],
            family_doctor: data.family_doctor || '',
            profile_img: data.profile_img || '',
          });
        } else {
          setError(data.message || 'Profil alınamadı.');
        }
      } catch {
        setError('Sunucuya bağlanılamadı!');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelect = (name, option) => {
    setForm((prev) => ({ ...prev, [name]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // 4. E-posta kontrolü
    if (!form.email.includes('@')) {
      setError('Geçerli bir e-posta adresi giriniz.');
      return;
    }
    // 5. Boy ve kilo pozitif sayı kontrolü
    if (!form.height || isNaN(form.height) || Number(form.height) <= 0) {
      setError('Boy alanı pozitif bir sayı olmalıdır.');
      return;
    }
    if (!form.weight || isNaN(form.weight) || Number(form.weight) <= 0) {
      setError('Kilo alanı pozitif bir sayı olmalıdır.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3005/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          blood: form.blood?.value,
          country: form.country?.value,
          city: form.city?.value,
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Profil başarıyla güncellendi!');
      } else {
        setError(data.message || 'Profil güncellenemedi!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f6f8fa', minHeight: '100vh', maxHeight: '100vh', padding: '40px 0', overflow: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sol Profil Kartı */}
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(60,60,100,0.10)', padding: 32, minWidth: 320, maxWidth: 340, flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#111' }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#e3e8f0', overflow: 'hidden', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={form.profile_img || defaultProfileImg} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{form.full_name || 'Ad Soyad'}</div>
          <div style={{ color: '#555', fontSize: 16, marginBottom: 6 }}>{form.tc_no || 'TC Kimlik No'}</div>
          <div style={{ color: '#555', fontSize: 16, marginBottom: 6 }}>{form.birth_date ? new Date(form.birth_date).toLocaleDateString('tr-TR') : 'Doğum Tarihi'}</div>

        </div>
        {/* Sağ Bilgi Formu */}
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(60,60,100,0.10)', padding: 32, flex: 1, maxHeight: '80vh', overflow: 'auto', color: '#111' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
              <span style={{ fontSize: 26 }}>👤</span> Kişisel Bilgileriniz
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>e-Posta Adresi</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 16, background: '#f8fafc', marginTop: 4, color: '#111' }} required />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Cep Telefonu</label>
                <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 16, background: '#f8fafc', marginTop: 4, color: '#111' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Boy</label>
                <input type="number" name="height" value={form.height} onChange={e => {
                  // 5. Sadece pozitif sayı girilsin
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm(prev => ({ ...prev, height: val }));
                }} min="1" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 16, background: '#f8fafc', marginTop: 4, color: '#111' }} placeholder="cm" />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Kilo</label>
                <input type="number" name="weight" value={form.weight} onChange={e => {
                  // 5. Sadece pozitif sayı girilsin
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm(prev => ({ ...prev, weight: val }));
                }} min="1" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 16, background: '#f8fafc', marginTop: 4, color: '#111' }} placeholder="kg" />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Kan Grubu</label>
                <Select
                  options={bloodOptions}
                  value={form.blood}
                  onChange={opt => handleSelect('blood', opt)}
                  placeholder="Seçiniz"
                  styles={{
                    control: (base) => ({ ...base, minHeight: 40, fontSize: 15, background: '#f8fafc', color: '#111' }),
                    menu: (base) => ({ ...base, zIndex: 9999, color: '#111', background: '#fff' }),
                    option: (base, state) => ({ ...base, color: '#111', background: state.isFocused ? '#e3efff' : '#fff' }),
                    singleValue: (base) => ({ ...base, color: '#111' }),
                    input: (base) => ({ ...base, color: '#111' }),
                  }}
                  isClearable
                  isSearchable
                  isDisabled={false}
                  menuPlacement="auto"
                  
                />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Yaşadığı Ülke</label>
                <Select
                  options={countryOptions}
                  value={form.country}
                  onChange={opt => handleSelect('country', opt)}
                  placeholder="Seçiniz"
                  styles={{
                    control: (base) => ({ ...base, minHeight: 40, fontSize: 15, background: '#f8fafc', color: '#111' }),
                    menu: (base) => ({ ...base, zIndex: 9999, color: '#111', background: '#fff' }),
                    option: (base, state) => ({ ...base, color: '#111', background: state.isFocused ? '#e3efff' : '#fff' }),
                    singleValue: (base) => ({ ...base, color: '#111' }),
                    input: (base) => ({ ...base, color: '#111' }),
                  }}
                  isClearable
                />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#111' }}>Yaşadığı Şehir</label>
                <Select
                  options={cityOptions}
                  value={form.city}
                  onChange={opt => handleSelect('city', opt)}
                  placeholder="Seçiniz"
                  styles={{
                    control: (base) => ({ ...base, minHeight: 40, fontSize: 15, background: '#f8fafc', color: '#111' }),
                    menu: (base) => ({ ...base, zIndex: 9999, color: '#111', background: '#fff' }),
                    option: (base, state) => ({ ...base, color: '#111', background: state.isFocused ? '#e3efff' : '#fff' }),
                    singleValue: (base) => ({ ...base, color: '#111' }),
                    input: (base) => ({ ...base, color: '#111' }),
                  }}
                  isClearable
                />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#111' }}>Aile Hekimi Bilgileriniz</label>
              <textarea
                name="family_doctor"
                value={form.family_doctor}
                onChange={handleChange}
                style={{ minHeight: 60, width: '100%', borderRadius: 6, padding: '10px 12px', fontSize: 16, border: '1px solid #d1d5db', background: '#f8fafc', color: '#111', resize: 'vertical', marginTop: 4 }}
                placeholder="Aile hekiminizin adı, birimi vb."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, cursor: 'pointer', minWidth: 120 }} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
            {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile; 