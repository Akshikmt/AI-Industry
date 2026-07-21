import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Phone, 
  Briefcase, 
  MapPin, 
  User as UserIcon,
  FileText,
  Camera,
  X,
  Edit2,
  Loader2,
  Save
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Photo Crop states
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  // Form states
  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [customDesignation, setCustomDesignation] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Prefill states when editing starts or user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDob(user.dob ? user.dob.substring(0, 10) : '');
      setPhone(user.phoneNumber || '');
      setNotes(user.notes || '');
      setAddressLine1(user.addressLine1 || '');
      setAddressLine2(user.addressLine2 || '');
      setSelectedCountry(user.country || '');
      setSelectedState(user.state || '');
      setSelectedCity(user.city || '');
      setZip(user.zipCode || '');

      const defaultDesignations = ["Maintenance Engineer", "Operations Manager", "Safety Officer", "Plant Supervisor", "Quality Inspector", "Technician"];
      if (user.designation) {
        if (defaultDesignations.includes(user.designation)) {
          setDesignation(user.designation);
          setCustomDesignation('');
        } else {
          setDesignation('Other');
          setCustomDesignation(user.designation);
        }
      } else {
        setDesignation('Maintenance Engineer');
        setCustomDesignation('');
      }

      const defaultDepartments = ["Maintenance", "Operations", "Safety", "Quality", "Production", "Engineering", "IT"];
      if (user.department) {
        if (defaultDepartments.includes(user.department)) {
          setDepartment(user.department);
          setCustomDepartment('');
        } else {
          setDepartment('Other');
          setCustomDepartment(user.department);
        }
      } else {
        setDepartment('Maintenance');
        setCustomDepartment('');
      }
    }
  }, [user, isEditing]);

  if (!user) return null;

  const getCountryName = (code?: string) => {
    if (!code) return 'N/A';
    return Country.getCountryByCode(code)?.name || code;
  };

  const getStateName = (stateCode?: string, countryCode?: string) => {
    if (!stateCode || !countryCode) return 'N/A';
    return State.getStateByCodeAndCountry(stateCode, countryCode)?.name || stateCode;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCropSave = () => {
    if (!tempImage) return;
    const img = new Image();
    img.src = tempImage;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const targetSize = 300; // High quality 300x300 avatar
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw clean background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Clip to circular avatar shape
      ctx.beginPath();
      ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate base dimensions matching object-fit: contain (exact preview match)
      const aspect = img.width / img.height;
      let baseW = targetSize;
      let baseH = targetSize;
      if (aspect > 1) {
        baseH = targetSize / aspect;
      } else {
        baseW = targetSize * aspect;
      }

      // Map 200px preview container offset & zoom to 300px target canvas
      const scaleFactor = targetSize / 200;
      const drawW = baseW * zoom;
      const drawH = baseH * zoom;
      const centerX = targetSize / 2 + offset.x * scaleFactor;
      const centerY = targetSize / 2 + offset.y * scaleFactor;
      const drawX = centerX - drawW / 2;
      const drawY = centerY - drawH / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const base64Image = canvas.toDataURL('image/jpeg', 0.92);

      try {
        setUploading(true);
        const res = await apiFetch('/auth/profile/photo', {
          method: 'PUT',
          body: JSON.stringify({ profilePhoto: base64Image })
        });

        updateUser(res.user);
        setTempImage(null);
      } catch (err: any) {
        alert(err.message || 'Failed to update profile photo.');
      } finally {
        setUploading(false);
      }
    };
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const designationValue = designation === 'Other' ? customDesignation.trim() : designation;
    const departmentValue = department === 'Other' ? customDepartment.trim() : department;

    if (!name.trim() || !designationValue || !departmentValue || !addressLine1.trim() || !selectedCountry || !selectedState || !selectedCity) {
      setError('Please fill in all required fields.');
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch(`/auth/members/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          email: user.email,
          role: user.role,
          dob: dob || undefined,
          phoneNumber: phone || undefined,
          designation: designationValue,
          department: departmentValue,
          profilePhoto: user.profilePhoto,
          notes: notes || undefined,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          country: selectedCountry,
          state: selectedState,
          city: selectedCity,
          zipCode: zip || undefined
        })
      });

      updateUser(res.member);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-slide-in">
      {/* Navigation Link */}
      <div className="flex justify-between items-center">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-teal hover:text-accent-tealHover transition-colors cursor-pointer outline-none font-sans"
        >
          <ArrowLeft className="w-4 h-4 text-accent-teal" />
          Back to Dashboard
        </Link>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-border bg-dark-card hover:bg-dark-border text-xs font-bold text-white cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-white" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-[2rem] font-extrabold text-white font-sans">My Profile</h1>
        <p className="text-xs text-dark-muted mt-1">Review and manage your workspace details, authentication privilege levels, and address records.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-accent-rose/25 bg-accent-rose/5 text-xs text-accent-rose font-semibold">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form or Read-Only Card layout */}
      <form onSubmit={handleSaveChanges}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Avatar Card */}
          <div className="lg:col-span-1 bg-dark-card/60 border border-dark-border rounded-2xl p-6 flex flex-col items-center text-center backdrop-blur-md h-fit space-y-4">
            
            {/* Circular Photo */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full border-2 border-accent-teal/30 bg-dark-bg cursor-pointer overflow-hidden group shrink-0"
              title="Upload profile photo"
            >
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-accent-teal uppercase tracking-wider">
                  {user.name.substring(0, 2)}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-full">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] font-bold text-white mt-1 uppercase tracking-wider">Upload</span>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
            />

            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{user.name}</h3>
              <p className="text-xs text-dark-muted font-medium mt-1">
                {user.designation || 'Workspace Administrator'}
              </p>
              {user.department && (
                <p className="text-[10px] text-accent-teal font-extrabold uppercase mt-0.5 tracking-wider">
                  {user.department} Department
                </p>
              )}
            </div>

            <div className="w-full pt-4 border-t border-dark-border flex items-center justify-center gap-1.5 text-xs font-bold text-accent-teal capitalize">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
              {user.role === 'admin' ? 'Administrator' : 'Workspace Member'}
            </div>
          </div>

          {/* Right Side: Panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Panel 1: Basic Information */}
            <div className="bg-dark-card/60 border border-dark-border rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1.5">
                Basic Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Full Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                      <UserIcon className="w-4 h-4 text-dark-muted shrink-0" />
                      <span className="truncate">{user.name}</span>
                    </div>
                  )}
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Work Email</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-dark-muted font-medium h-[38px] truncate cursor-not-allowed">
                    <Mail className="w-4 h-4 text-dark-muted shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* DOB */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px]">
                      <Calendar className="w-4 h-4 text-dark-muted shrink-0" />
                      <span>
                        {user.dob ? new Date(user.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="E.g. +1 555-987-6543"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px]">
                      <Phone className="w-4 h-4 text-dark-muted shrink-0" />
                      <span>{user.phoneNumber || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Designation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Designation *</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      >
                        <option value="Maintenance Engineer">Maintenance Engineer</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Safety Officer">Safety Officer</option>
                        <option value="Plant Supervisor">Plant Supervisor</option>
                        <option value="Quality Inspector">Quality Inspector</option>
                        <option value="Technician">Technician</option>
                        <option value="Other">Other</option>
                      </select>
                      {designation === 'Other' && (
                        <input
                          type="text"
                          required
                          placeholder="Specify Designation"
                          value={customDesignation}
                          onChange={(e) => setCustomDesignation(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px]">
                      <Briefcase className="w-4 h-4 text-dark-muted shrink-0" />
                      <span>{user.designation || 'N/A'}</span>
                    </div>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Department *</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      >
                        <option value="Maintenance">Maintenance</option>
                        <option value="Operations">Operations</option>
                        <option value="Safety">Safety</option>
                        <option value="Quality">Quality</option>
                        <option value="Production">Production</option>
                        <option value="Engineering">Engineering</option>
                        <option value="IT">IT</option>
                        <option value="Other">Other</option>
                      </select>
                      {department === 'Other' && (
                        <input
                          type="text"
                          required
                          placeholder="Specify Department"
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px]">
                      <Briefcase className="w-4 h-4 text-dark-muted shrink-0" />
                      <span>{user.department || 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 2: Address Details */}
            <div className="bg-dark-card/60 border border-dark-border rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1.5">
                Address Details
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Address Line 1 */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Address Line 1 *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                      <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                      <span className="truncate">{user.addressLine1 || 'N/A'}</span>
                    </div>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-muted uppercase">Address Line 2 (Optional)</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                      <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                      <span className="truncate">{user.addressLine2 || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-dark-muted uppercase">Country *</label>
                    {isEditing ? (
                      <select
                        value={selectedCountry}
                        onChange={(e) => {
                          setSelectedCountry(e.target.value);
                          setSelectedState('');
                          setSelectedCity('');
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                        <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                        <span className="truncate">{getCountryName(user.country)}</span>
                      </div>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-dark-muted uppercase">State/Province *</label>
                    {isEditing ? (
                      <select
                        value={selectedState}
                        disabled={!selectedCountry}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedCity('');
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px] disabled:opacity-50"
                      >
                        <option value="">Select State</option>
                        {selectedCountry && State.getStatesOfCountry(selectedCountry).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                        <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                        <span className="truncate">{getStateName(user.state, user.country)}</span>
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-dark-muted uppercase">City *</label>
                    {isEditing ? (
                      <select
                        value={selectedCity}
                        disabled={!selectedState}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px] disabled:opacity-50"
                      >
                        <option value="">Select City</option>
                        {selectedCountry && selectedState && City.getCitiesOfState(selectedCountry, selectedState).map(ci => <option key={ci.name} value={ci.name}>{ci.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px] truncate">
                        <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                        <span className="truncate">{user.city || 'N/A'}</span>
                      </div>
                    )}
                  </div>

                  {/* Zip Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-dark-muted uppercase">Zip Code (Optional)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      />
                    ) : (
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-dark-border bg-dark-bg/40 text-sm text-white font-medium h-[38px]">
                        <MapPin className="w-4 h-4 text-dark-muted shrink-0" />
                        <span>{user.zipCode || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Notes */}
            <div className="bg-dark-card/60 border border-dark-border rounded-2xl p-6 backdrop-blur-md space-y-3">
              <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1.5">
                Profile Notes / Remarks
              </div>
              {isEditing ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors resize-none"
                />
              ) : user.notes ? (
                <div className="flex gap-2.5 p-4 rounded-xl border border-dark-border bg-dark-bg/30 text-xs text-dark-muted leading-relaxed font-sans">
                  <FileText className="w-5 h-5 text-accent-teal shrink-0 mt-0.5" />
                  <p className="text-white italic">"{user.notes}"</p>
                </div>
              ) : (
                <p className="text-xs text-dark-muted font-sans italic">No remarks provided.</p>
              )}
            </div>

            {/* Form actions (visible only in editing mode) */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-lg border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-[#ffffff]" />
                  )}
                  Save Changes
                </button>
              </div>
            )}

          </div>
        </div>
      </form>

      {/* Crop & Zoom Modal Overlay */}
      {tempImage && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden relative p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white">Crop & Adjust Profile Photo</h3>
              <button
                type="button"
                onClick={() => setTempImage(null)}
                className="p-1 rounded-lg text-dark-muted hover:bg-dark-border hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Crop Frame container */}
            <div className="flex justify-center items-center">
              <div 
                className="w-[200px] h-[200px] rounded-full border border-dark-border bg-dark-bg relative overflow-hidden cursor-move select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img 
                  src={tempImage} 
                  alt="Crop Preview" 
                  className="absolute max-w-none pointer-events-none origin-center"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-100px',
                    marginTop: '-100px',
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain'
                  }}
                />
                
                <div className="absolute inset-0 rounded-full border-2 border-accent-teal/30 pointer-events-none" />
              </div>
            </div>

            <p className="text-[11px] text-dark-muted text-center leading-normal">
              Drag the photo to position it within the circular frame. Use the slider below to zoom.
            </p>

            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-dark-muted uppercase">
                <span>Zoom Level</span>
                <span className="text-accent-teal">{(zoom * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent-teal focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTempImage(null)}
                className="px-4 py-2 rounded-lg border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={uploading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? 'Saving...' : 'Save Profile Photo'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProfilePage;
