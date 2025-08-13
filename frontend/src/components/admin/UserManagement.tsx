import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'react-toastify';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  UserCheck,
  UserX,
  X
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  lastLogin: string;
  createdAt: string;
}

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'patient' | 'doctor';
  tcNo: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  address: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Esma Kocabaş",
      email: "esma@example.com",
      role: "doctor",
      lastLogin: "2 saat önce",
      createdAt: "15.12.2024"
    },
    {
      id: 2,
      name: "Fatma Demir",
      email: "fatma@example.com",
      role: "patient",
      lastLogin: "1 gün önce",
      createdAt: "14.12.2024"
    },
    {
      id: 3,
      name: "Mehmet Özkan",
      email: "mehmet@example.com",
      role: "doctor",
      lastLogin: "3 saat önce",
      createdAt: "13.12.2024"
    },
    {
      id: 4,
      name: "Ayşe Yıldız",
      email: "ayse@example.com",
      role: "patient",
      lastLogin: "1 hafta önce",
      createdAt: "10.12.2024"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    tcNo: '',
    birthDate: '',
    gender: 'male',
    address: ''
  });
  
  // Orijinal kullanıcı verilerini sakla
  const [originalUser, setOriginalUser] = useState<NewUser>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    tcNo: '',
    birthDate: '',
    gender: 'male',
    address: ''
  });
  
  // Şifre görünürlük state'leri
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('Kullanıcı başarıyla silindi!');
    }
  };

    const handleAddUser = () => {
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    // Şifre kısıtlamalarını kontrol et
    const hasUpperCase = /[A-Z]/.test(newUser.password);
    const hasLowerCase = /[a-z]/.test(newUser.password);
    const hasNumbers = /\d/.test(newUser.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newUser.password);
    const hasMinLength = newUser.password.length >= 8;
    
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      toast.error('Lütfen gerekli alanları doldurun!');
      return;
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || !hasMinLength) {
        toast.error('Şifre tüm kısıtlamaları karşılamıyor!');
        return;
      }

    const user: User = {
      id: users.length + 1,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      role: newUser.role,
      lastLogin: 'Henüz giriş yapmadı',
      createdAt: new Date().toLocaleDateString('tr-TR')
    };

    setUsers([...users, user]);
    
    // Formu temizle
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      tcNo: '',
      birthDate: '',
      gender: 'male',
      address: ''
    });
    
    setIsAddUserOpen(false);
    toast.success('Kullanıcı başarıyla eklendi!');
  };

  // Modal açıldığında orijinal verileri sakla
  const handleOpenModal = () => {
    setOriginalUser({...newUser});
    setIsAddUserOpen(true);
  };

  // Modal kapatma işlemi
  const handleCloseModal = () => {
    // Orijinal verilere geri dön
    setNewUser({...originalUser});
    setIsAddUserOpen(false);
  };

  // Kullanıcı düzenleme modal'ını aç
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // Kullanıcı adını parçala
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setNewUser({
      firstName,
      lastName,
      email: user.email,
      phone: '', 
      password: '',
      confirmPassword: '',
      role: user.role === 'admin' ? 'doctor' : user.role, 
      tcNo: '', 
      birthDate: '', 
      gender: 'male', 
      address: ''
    });
    setOriginalUser({
      firstName,
      lastName,
      email: user.email,
      phone: '',
      password: '',
      confirmPassword: '',
      role: user.role === 'admin' ? 'doctor' : user.role,
      tcNo: '',
      birthDate: '',
      gender: 'male',
      address: ''
    });
    setIsEditUserOpen(true);
  };

  // Kullanıcı düzenleme modal'ını kapat
  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditUserOpen(false);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      tcNo: '',
      birthDate: '',
      gender: 'male',
      address: ''
    });
  };

  // Kullanıcı güncelleme işlemi
  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!newUser.firstName || !newUser.lastName || !newUser.email) {
      toast.error('Lütfen gerekli alanları doldurun!');
      return;
    }

    // Kullanıcıyı güncelle
    const updatedUsers = users.map(user => {
      if (user.id === editingUser.id) {
        return {
          ...user,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          role: newUser.role
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    handleCloseEditModal();
    toast.success('Kullanıcı başarıyla güncellendi!');
  };

  // Değişiklik olup olmadığını kontrol et
  const hasChanges = () => {
    if (!editingUser) return false;
    
    const nameParts = editingUser.name.split(' ');
    const originalFirstName = nameParts[0] || '';
    const originalLastName = nameParts.slice(1).join(' ') || '';
    
    return (
      newUser.firstName !== originalFirstName ||
      newUser.lastName !== originalLastName ||
      newUser.email !== editingUser.email ||
      newUser.role !== (editingUser.role === 'admin' ? 'doctor' : editingUser.role)
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="secondary">Admin</Badge>;
      case 'doctor':
        return <Badge variant="secondary">Doktor</Badge>;
      case 'patient':
        return <Badge variant="secondary">Hasta</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-2">Sistemdeki tüm kullanıcıları yönetin</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={handleCloseModal}>
          <Button onClick={handleOpenModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Yeni Kullanıcı Ekle
          </Button>
          <DialogContent 
            className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Yeni Kullanıcı Ekle
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Kişisel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Kişisel Bilgiler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      className="border border-gray-300 rounded-md"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      className="border border-gray-300 rounded-md"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tcNo">T.C. Kimlik No</Label>
                    <Input
                      id="tcNo"
                      value={newUser.tcNo}
                      className="border border-gray-300 rounded-md"
                      onChange={(e) => setNewUser({...newUser, tcNo: e.target.value})}
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Doğum Tarihi</Label>
                    <Input
                      id="birthDate"
                      className="border border-gray-300 rounded-md"
                      type="date"
                      value={newUser.birthDate}
                      onChange={(e) => setNewUser({...newUser, birthDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="w-1/3">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <Select value={newUser.gender} onValueChange={(value: 'male' | 'female' | 'other') => setNewUser({...newUser, gender: value})}>
                    <SelectTrigger className="border border-gray-300 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="other">Belirtmek istemiyorum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">İletişim Bilgileri</h3>
                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    className="border border-gray-300 rounded-md"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="ornek@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    className="border border-gray-300 rounded-md"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                
                                 <div>
                   <Label htmlFor="address">Adres</Label>
                   <Textarea
                     id="address"
                     className="border border-gray-300 rounded-md min-h-[20px]"
                     value={newUser.address}
                     onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                     placeholder="Tam adres bilgisi"
                     maxLength={200}
                   />
                   <div className="text-xs text-gray-500 mt-1">
                     {newUser.address.length}/200 karakter
                   </div>
                 </div>
              </div>

              {/* Hesap Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Hesap Bilgileri</h3>
                <div className="w-1/3">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={newUser.role} onValueChange={(value: 'patient' | 'doctor') => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="border border-gray-300 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Hasta</SelectItem>
                      <SelectItem value="doctor">Doktor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="password">Şifre *</Label>
                     <div className="relative">
                       <Input
                         id="password"
                         className="border border-gray-300 rounded-md pr-10"
                         type={showPassword ? "text" : "password"}
                         value={newUser.password}
                         onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                         placeholder="Şifre"
                       />
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                         onClick={() => setShowPassword(!showPassword)}
                       >
                         {showPassword ? (
                           <EyeOff className="h-4 w-4 text-gray-500" />
                         ) : (
                           <Eye className="h-4 w-4 text-gray-500" />
                         )}
                       </Button>
                     </div>
                     <div className="text-xs text-gray-500 mt-1 space-y-1">
                       <div className={`${/[A-Z]/.test(newUser.password) ? 'text-green-600' : 'text-red-500'}`}>
                         {/[A-Z]/.test(newUser.password) ? '✓' : '✗'} En az 1 büyük harf
                       </div>
                       <div className={`${/[a-z]/.test(newUser.password) ? 'text-green-600' : 'text-red-500'}`}>
                         {/[a-z]/.test(newUser.password) ? '✓' : '✗'} En az 1 küçük harf
                       </div>
                       <div className={`${/\d/.test(newUser.password) ? 'text-green-600' : 'text-red-500'}`}>
                         {/\d/.test(newUser.password) ? '✓' : '✗'} En az 1 sayı
                       </div>
                       <div className={`${/[!@#$%^&*(),.?":{}|<>]/.test(newUser.password) ? 'text-green-600' : 'text-red-500'}`}>
                         {/[!@#$%^&*(),.?":{}|<>]/.test(newUser.password) ? '✓' : '✗'} En az 1 noktalama işareti
                       </div>
                       <div className={`${newUser.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                         {newUser.password.length >= 8 ? '✓' : '✗'} En az 8 karakter
                       </div>
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                     <div className="relative">
                       <Input
                         id="confirmPassword"
                         className="border border-gray-300 rounded-md pr-10"
                         type={showConfirmPassword ? "text" : "password"}
                         value={newUser.confirmPassword}
                         onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                         placeholder="Şifre tekrar"
                       />
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       >
                         {showConfirmPassword ? (
                           <EyeOff className="h-4 w-4 text-gray-500" />
                         ) : (
                           <Eye className="h-4 w-4 text-gray-500" />
                         )}
                       </Button>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline"
                  className='!border-2 !border-gray-300 !rounded-md'
                  onClick={handleCloseModal}>
                  İptal
                </Button>
                <Button onClick={handleAddUser}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Kullanıcı Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
                 </Dialog>

         {/* Kullanıcı Düzenleme Modal */}
         <Dialog open={isEditUserOpen} onOpenChange={handleCloseEditModal}>
           <DialogContent 
             className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
             onPointerDownOutside={(e) => e.preventDefault()}
           >
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <Edit className="w-5 h-5" />
                 Kullanıcı Düzenle: {editingUser?.name}
               </DialogTitle>
             </DialogHeader>
             
             <div className="space-y-6">
               {/* Kişisel Bilgiler */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Kişisel Bilgiler</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="editFirstName">Ad *</Label>
                     <Input
                       id="editFirstName"
                       className="border border-gray-300 rounded-md"
                       value={newUser.firstName}
                       onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                       placeholder="Ad"
                     />
                   </div>
                   <div>
                     <Label htmlFor="editLastName">Soyad *</Label>
                     <Input
                       id="editLastName"
                       className="border border-gray-300 rounded-md"
                       value={newUser.lastName}
                       onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                       placeholder="Soyad"
                     />
                   </div>
                 </div>
               </div>

               {/* İletişim Bilgileri */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">İletişim Bilgileri</h3>
                 <div>
                   <Label htmlFor="editEmail">E-posta *</Label>
                   <Input
                     id="editEmail"
                     className="border border-gray-300 rounded-md"
                     type="email"
                     value={newUser.email}
                     onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                     placeholder="ornek@email.com"
                   />
                 </div>
               </div>

               {/* Hesap Bilgileri */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Hesap Bilgileri</h3>
                 <div className="w-1/3">
                   <Label htmlFor="editRole">Rol</Label>
                   <Select value={newUser.role} onValueChange={(value: 'patient' | 'doctor') => setNewUser({...newUser, role: value})}>
                     <SelectTrigger className="border border-gray-300 rounded-md">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="patient">Hasta</SelectItem>
                       <SelectItem value="doctor">Doktor</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               {/* Butonlar */}
               <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button variant="outline"
                   className='!border-2 !border-gray-300 !rounded-md'
                   onClick={handleCloseEditModal}>
                   İptal
                 </Button>
                 <Button 
                   onClick={handleUpdateUser}
                   disabled={!hasChanges()}
                   className={!hasChanges() ? 'opacity-50 cursor-not-allowed' : ''}
                 >
                   <Edit className="w-4 h-4 mr-2" />
                   Güncelle
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Kullanıcı Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative border border-gray-300 rounded-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Roller</option>
                <option value="patient">Hasta</option>
                <option value="doctor">Doktor</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 font-medium">Kullanıcı</th>
                  <th className="text-left p-2 font-medium">E-posta</th>
                  <th className="text-left p-2 font-medium">Rol</th>
                  <th className="text-left p-2 font-medium">Son Giriş</th>
                  <th className="text-left p-2 font-medium">Kayıt Tarihi</th>
                  <th className="text-left p-2 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-gray-600">{user.email}</td>
                    <td className="p-2">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {user.lastLogin}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {user.createdAt}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                                                 <Button
                           variant="ghost"
                           size="sm"
                           className="p-1"
                           onClick={() => handleEditUser(user)}
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
