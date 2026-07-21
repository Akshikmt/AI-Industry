import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { Country, State, City } from 'country-state-city';
import {
  UserPlus,
  Loader2,
  ShieldAlert,
  Mail,
  User as UserIcon,
  Plus,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  ChevronDown,
  Users,
  Edit2,
  Trash2,
  Upload,
  Download,
  Search,
  Eye,
  Building,
  Briefcase,
  UserCheck
} from 'lucide-react';

const phoneLimits: Record<string, number> = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  NZ: 9,
  SG: 8,
  AE: 9,
  ZA: 9,
  DE: 11,
  FR: 9,
  IT: 10,
  ES: 9,
  BR: 11,
  MX: 10,
  JP: 10,
  CN: 11,
};

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  dob?: string;
  phoneNumber?: string;
  designation?: string;
  department?: string;
  profilePhoto?: string;
  notes?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  hasLoggedIn?: boolean;
  status?: 'Active' | 'Inactive' | 'Pending';
  employeeId?: string;
  officeLocation?: string;
  reportingManager?: string;
}

const MembersPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // List States
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDesignation, setFilterDesignation] = useState<string>('All');
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Sorting States
  const [sortField, setSortField] = useState<'name' | 'email' | 'designation' | 'department' | 'role' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [tempGeneratedPassword, setTempGeneratedPassword] = useState<string>('');
  const [savedCredentialName, setSavedCredentialName] = useState<string>('');
  const [savedCredentialEmail, setSavedCredentialEmail] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [memberEmail, setMemberEmail] = useState<string>('');
  const [memberRole, setMemberRole] = useState<string>('employee');
  const [memberDob, setMemberDob] = useState<string>('');
  
  // Phone Code States
  const [countryCode, setCountryCode] = useState('+1');
  const [ccCountryIso, setCcCountryIso] = useState('US');
  const [memberPhone, setMemberPhone] = useState<string>('');
  
  const [memberDesignation, setMemberDesignation] = useState<string>('Technician');
  const [customDesignation, setCustomDesignation] = useState<string>('');
  const [memberDepartment, setMemberDepartment] = useState<string>('Operations');
  const [customDepartment, setCustomDepartment] = useState<string>('');
  
  // Address States (middle slide)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Dropdowns Open States
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  // Search filter query states
  const [ccSearch, setCcSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Refs for closing dropdowns when clicking outside
  const ccRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Search input refs for autofocusing
  const ccSearchRef = useRef<HTMLInputElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);
  const stateSearchRef = useRef<HTMLInputElement>(null);
  const citySearchRef = useRef<HTMLInputElement>(null);

  const [memberPhoto, setMemberPhoto] = useState<string>('');
  const [memberNotes, setMemberNotes] = useState<string>('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [slide, setSlide] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry) : [], [selectedCountry]);
  const cities = useMemo(() => (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState) : [], [selectedCountry, selectedState]);

  // Filter lists based on search states
  const filteredCountries = useMemo(() => countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())), [countries, countrySearch]);
  const filteredStates = useMemo(() => states.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase())), [states, stateSearch]);
  const filteredCities = useMemo(() => cities.filter(ci => ci.name.toLowerCase().includes(citySearch.toLowerCase())), [cities, citySearch]);

  const filteredCcCountries = useMemo(() => countries.filter(c => {
    const raw = c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`;
    return c.name.toLowerCase().includes(ccSearch.toLowerCase()) || raw.includes(ccSearch);
  }), [countries, ccSearch]);

  // Automatically sync Phone Country Code selection when Country is updated
  useEffect(() => {
    if (selectedCountry) {
      const countryData = Country.getCountryByCode(selectedCountry);
      if (countryData && countryData.phonecode) {
        const rawCode = countryData.phonecode;
        const code = rawCode.startsWith('+') ? rawCode : `+${rawCode}`;
        setCountryCode(code);
        setCcCountryIso(selectedCountry);
      }
    }
  }, [selectedCountry]);

  // Truncate phone number if it exceeds the limit of the selected country
  useEffect(() => {
    const limit = phoneLimits[ccCountryIso] || 15;
    const cleanPhone = memberPhone.replace(/\D/g, '');
    if (cleanPhone.length > limit) {
      setMemberPhone(cleanPhone.slice(0, limit));
    }
  }, [ccCountryIso, memberPhone]);

  // Autofocus search inputs when dropdown opens
  useEffect(() => {
    if (isCcOpen) setTimeout(() => ccSearchRef.current?.focus(), 50);
  }, [isCcOpen]);

  useEffect(() => {
    if (isCountryOpen) setTimeout(() => countrySearchRef.current?.focus(), 50);
  }, [isCountryOpen]);

  useEffect(() => {
    if (isStateOpen) setTimeout(() => stateSearchRef.current?.focus(), 50);
  }, [isStateOpen]);

  useEffect(() => {
    if (isCityOpen) setTimeout(() => citySearchRef.current?.focus(), 50);
  }, [isCityOpen]);

  // Click Outside Event Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ccRef.current && !ccRef.current.contains(target)) setIsCcOpen(false);
      if (countryRef.current && !countryRef.current.contains(target)) setIsCountryOpen(false);
      if (stateRef.current && !stateRef.current.contains(target)) setIsStateOpen(false);
      if (cityRef.current && !cityRef.current.contains(target)) setIsCityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmailChange = (val: string) => {
    setMemberEmail(val);
    if (!val.trim()) {
      setEmailError(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setEmailError('Please enter a valid enterprise email.');
      } else {
        const isDuplicate = members.some(m => m.email.toLowerCase() === val.trim().toLowerCase() && m.id !== editingMemberId);
        if (isDuplicate) {
          setEmailError('This email is already registered to a workspace member.');
        } else {
          setEmailError(null);
        }
      }
    }
  };

  const resetForm = () => {
    setEditingMemberId(null);
    setMemberName('');
    setMemberEmail('');
    setMemberRole('employee');
    setMemberDob('');
    setMemberPhone('');
    setMemberDesignation('Technician');
    setCustomDesignation('');
    setMemberDepartment('Operations');
    setCustomDepartment('');
    setMemberPhoto('');
    setMemberNotes('');
    setAddressLine1('');
    setAddressLine2('');
    setZipCode('');
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
    setCountrySearch('');
    setStateSearch('');
    setCitySearch('');
    setCcSearch('');
    setCountryCode('+1');
    setCcCountryIso('US');
    setEmailError(null);
    setSlide(1);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleStartEdit = (emp: any) => {
    setEditingMemberId(emp.id);
    setMemberName(emp.name);
    setMemberEmail(emp.email);
    setMemberRole(emp.role);
    setMemberDob(emp.dob ? emp.dob.substring(0, 10) : '');

    // Parse phone code and raw number
    let rawPhone = emp.phoneNumber || '';
    let matchedCode = '+1';
    let matchedIso = 'US';
    let cleanPhone = rawPhone.replace(/\D/g, ''); 
    
    const matched = Country.getAllCountries()
      .map(c => {
        const code = c.phonecode.replace(/\D/g, '');
        return { code, iso: c.isoCode, phonecode: c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}` };
      })
      .sort((a, b) => b.code.length - a.code.length) 
      .find(c => cleanPhone.startsWith(c.code));
    
    if (matched) {
      matchedCode = matched.phonecode;
      matchedIso = matched.iso;
      setMemberPhone(cleanPhone.substring(matched.code.length));
    } else {
      setMemberPhone(cleanPhone);
    }
    setCountryCode(matchedCode);
    setCcCountryIso(matchedIso);

    const defaultDesignations = ["Maintenance Engineer", "Operations Manager", "Safety Officer", "Plant Supervisor", "Quality Inspector", "Technician"];
    if (defaultDesignations.includes(emp.designation)) {
      setMemberDesignation(emp.designation);
      setCustomDesignation('');
    } else {
      setMemberDesignation('Other');
      setCustomDesignation(emp.designation || '');
    }

    const defaultDepartments = ["Maintenance", "Operations", "Safety", "Quality", "Production", "Engineering", "IT"];
    if (defaultDepartments.includes(emp.department)) {
      setMemberDepartment(emp.department);
      setCustomDepartment('');
    } else {
      setMemberDepartment('Other');
      setCustomDepartment(emp.department || '');
    }

    setMemberPhoto(emp.profilePhoto || '');
    setMemberNotes(emp.notes || '');

    setAddressLine1(emp.addressLine1 || '');
    setAddressLine2(emp.addressLine2 || '');
    setSelectedCountry(emp.country || '');
    setSelectedState(emp.state || '');
    setSelectedCity(emp.city || '');
    setZipCode(emp.zipCode || '');

    setSubmitError(null);
    setSubmitSuccess(null);
    setSlide(1);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the workspace?`)) {
      try {
        await apiFetch(`/auth/members/${id}`, {
          method: 'DELETE'
        });
        showToast(`Workspace member "${name}" removed successfully.`, 'info');
        fetchMembers(false);
      } catch (err: any) {
        setError(err.message || 'Failed to delete workspace member.');
        showToast(err.message || 'Failed to delete member.', 'error');
      }
    }
  };

  const fetchMembers = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/auth/members');
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve workspace member directory.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchMembers();
    }
  }, [user]);

  // Lock background screen scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const filteredAndSortedMembers = useMemo(() => {
    let result = members.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDesignation = filterDesignation === 'All' || emp.designation === filterDesignation;
      const matchesDepartment = filterDepartment === 'All' || emp.department === filterDepartment;
      const matchesRole = filterRole === 'All' || emp.role === filterRole;
      
      const statusStr = emp.hasLoggedIn ? 'Active' : 'Pending';
      const matchesStatus = filterStatus === 'All' || statusStr === filterStatus;

      return matchesSearch && matchesDesignation && matchesDepartment && matchesRole && matchesStatus;
    });

    if (sortField) {
      result.sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortField === 'name') { valA = a.name; valB = b.name; }
        else if (sortField === 'email') { valA = a.email; valB = b.email; }
        else if (sortField === 'designation') { valA = a.designation || ''; valB = b.designation || ''; }
        else if (sortField === 'department') { valA = a.department || ''; valB = b.department || ''; }
        else if (sortField === 'role') { valA = a.role; valB = b.role; }
        else if (sortField === 'status') {
          valA = a.hasLoggedIn ? 'Active' : 'Pending';
          valB = b.hasLoggedIn ? 'Active' : 'Pending';
        }

        const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [members, searchQuery, filterDesignation, filterDepartment, filterRole, filterStatus, sortField, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDesignation, filterDepartment, filterRole, filterStatus]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredAndSortedMembers.length);
  const paginatedMembers = useMemo(() => {
    return filteredAndSortedMembers.slice(startIndex, endIndex);
  }, [filteredAndSortedMembers, startIndex, endIndex]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMembers.length / rowsPerPage));

  // Deny access if user is not an administrator
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-dark-card/40 border border-dark-border rounded-2xl">
        <ShieldAlert className="w-16 h-16 text-accent-rose animate-pulse mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 font-sans">Access Denied</h3>
        <p className="text-dark-muted text-sm max-w-md font-sans">
          This section is restricted to workspace administrators. Operator roles are restricted from executing administrative directory write operations.
        </p>
      </div>
    );
  }

  const handleNextSlide1 = () => {
    setSubmitError(null);
    if (!memberName.trim() || !memberEmail.trim() || !memberDesignation || !memberDepartment || !memberRole) {
      setSubmitError('Please fill in Name, Email, Designation, Department and Role first.');
      return;
    }
    if (emailError) {
      setSubmitError('Please enter a valid enterprise email.');
      return;
    }
    if (memberDesignation === 'Other' && !customDesignation.trim()) {
      setSubmitError('Please specify your custom Designation.');
      return;
    }
    if (memberDepartment === 'Other' && !customDepartment.trim()) {
      setSubmitError('Please specify your custom Department.');
      return;
    }
    if (memberPhone.trim()) {
      const cleanPhone = memberPhone.replace(/\D/g, '');
      const expectedLength = phoneLimits[ccCountryIso];
      if (expectedLength) {
        if (cleanPhone.length !== expectedLength) {
          setSubmitError(`Phone number for ${ccCountryIso} must be exactly ${expectedLength} digits.`);
          return;
        }
      } else {
        if (cleanPhone.length < 7 || cleanPhone.length > 15) {
          setSubmitError('Please enter a valid phone number (7 to 15 digits).');
          return;
        }
      }
    }
    setSlide(2);
  };

  const handleNextSlide2 = () => {
    setSubmitError(null);
    if (!addressLine1.trim() || !selectedCountry || !selectedState || !selectedCity) {
      setSubmitError('Please fill in Address Line 1, Country, State, and City.');
      return;
    }
    setSlide(3);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const designationValue = memberDesignation === 'Other' ? customDesignation.trim() : memberDesignation;
    const departmentValue = memberDepartment === 'Other' ? customDepartment.trim() : memberDepartment;

    if (!memberName.trim() || !memberEmail.trim() || !designationValue || !departmentValue || !memberRole) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    if (!addressLine1.trim() || !selectedCountry || !selectedState || !selectedCity) {
      setSubmitError('Please complete all address details.');
      return;
    }

    // Generate password for new members
    let generatedPassword: string | undefined;
    if (!editingMemberId) {
      const emailUsername = memberEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const randomDigits = Math.floor(100 + Math.random() * 900);
      generatedPassword = `Sam${emailUsername}${randomDigits}@`;
    }

    setSubmitting(true);
    try {
      const endpoint = editingMemberId ? `/auth/members/${editingMemberId}` : '/auth/members';
      const method = editingMemberId ? 'PUT' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          name: memberName,
          email: memberEmail,
          password: generatedPassword,
          role: memberRole,
          dob: memberDob || undefined,
          phoneNumber: memberPhone ? `${countryCode}${memberPhone}` : undefined,
          designation: designationValue,
          department: departmentValue,
          profilePhoto: memberPhoto || undefined,
          notes: memberNotes || undefined,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          country: selectedCountry,
          state: selectedState,
          city: selectedCity,
          zipCode: zipCode || undefined
        })
      });

      fetchMembers(false);
      showToast(!editingMemberId ? `Employee "${memberName}" added to workspace!` : `Member "${memberName}" updated successfully!`, 'success');

      if (!editingMemberId && generatedPassword) {
        // Save credentials for the confirmation modal before resetting form
        setSavedCredentialName(memberName);
        setSavedCredentialEmail(memberEmail);
        setTempGeneratedPassword(generatedPassword);
        resetForm();
        setIsModalOpen(false);
        // Show the credentials modal after closing the form
        setIsConfirmModalOpen(true);
      } else {
        setSubmitSuccess('Workspace member updated successfully!');
        resetForm();
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.message || `Failed to ${editingMemberId ? 'update' : 'add'} workspace member account.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field: 'name' | 'email' | 'designation' | 'department' | 'role' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dark-border pb-6">
        <div>
          <h1 className="text-[1.5rem] font-extrabold text-white font-sans">
            Workspace Members
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Create and manage access credentials for operators and technicians within your workspace organization.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const headers = ['Name', 'Email', 'Designation', 'Department', 'Role', 'Status', 'Phone', 'DOB', 'Address Line 1', 'Address Line 2', 'Country', 'State', 'City', 'Zip Code'];
              const rows = members.map(m => [
                m.name,
                m.email,
                m.designation || '',
                m.department || '',
                m.role === 'employee' ? 'Workspace Member' : m.role,
                m.hasLoggedIn ? 'Active' : 'Pending',
                m.phoneNumber || '',
                m.dob ? new Date(m.dob).toLocaleDateString() : '',
                m.addressLine1 || '',
                m.addressLine2 || '',
                m.country || '',
                m.state || '',
                m.city || '',
                m.zipCode || ''
              ]);
              const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `workspace_members_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] border border-dark-border bg-dark-card/50 hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 cursor-pointer h-[38px] w-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/members/import')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] border border-dark-border bg-dark-card/50 hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 cursor-pointer h-[38px] w-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={() => {
              setSubmitError(null);
              setSubmitSuccess(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[4px] bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 cursor-pointer h-[38px] w-auto whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#ffffff]" />
            Add Member
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-accent-rose/20 bg-accent-rose/5 text-sm text-accent-rose font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory catalog table card */}
      <div className="bg-dark-card/60 border border-dark-border rounded-2xl overflow-hidden backdrop-blur-md">
        
        {/* Search & Filters Controls */}
        {!loading && (
          <div className="p-4 bg-dark-card/30 border-b border-dark-border flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-[4px] bg-dark-bg/60 border border-dark-border focus:border-accent-teal focus:outline-none text-xs text-white font-sans transition-all placeholder:text-dark-muted h-[36px]"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <select
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
                className="px-3 py-1.5 rounded-[4px] bg-dark-bg/60 border border-dark-border focus:border-accent-teal focus:outline-none text-xs text-white font-sans transition-all h-[36px]"
              >
                <option value="All">All Designations</option>
                <option value="Maintenance Engineer">Maintenance Engineer</option>
                <option value="Operations Manager">Operations Manager</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Plant Supervisor">Plant Supervisor</option>
                <option value="Quality Inspector">Quality Inspector</option>
                <option value="Technician">Technician</option>
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-1.5 rounded-[4px] bg-dark-bg/60 border border-dark-border focus:border-accent-teal focus:outline-none text-xs text-white font-sans transition-all h-[36px]"
              >
                <option value="All">All Departments</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Operations">Operations</option>
                <option value="Safety">Safety</option>
                <option value="Quality">Quality</option>
                <option value="Production">Production</option>
                <option value="Engineering">Engineering</option>
                <option value="IT">IT</option>
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-1.5 rounded-[4px] bg-dark-bg/60 border border-dark-border focus:border-accent-teal focus:outline-none text-xs text-white font-sans transition-all h-[36px]"
              >
                <option value="All">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="employee">Workspace Member</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-[4px] bg-dark-bg/60 border border-dark-border focus:border-accent-teal focus:outline-none text-xs text-white font-sans transition-all h-[36px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-accent-teal animate-spin" />
            <p className="text-dark-muted text-sm font-semibold">Querying directory catalog...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-dark-border/40 flex items-center justify-center mb-4 border border-dark-border">
              <Users className="w-8 h-8 text-dark-muted" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Members Registered</h3>
            <p className="text-dark-muted text-sm max-w-sm">
              There are no operator profiles registered in this workspace yet. Click the button above to add members.
            </p>
          </div>
        ) : filteredAndSortedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-dark-border/40 flex items-center justify-center mb-4 border border-dark-border">
              <Users className="w-8 h-8 text-dark-muted" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Matching Members Found</h3>
            <p className="text-dark-muted text-sm max-w-sm">
              Your search query or selected dropdown filters returned no results. Try adjusting your parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-dark-border/30 font-sans">
                  <th 
                    onClick={() => handleSort('name')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Member Name
                      {sortField === 'name' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Enterprise Email
                      {sortField === 'email' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('designation')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Designation
                      {sortField === 'designation' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('department')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Department
                      {sortField === 'department' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('role')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      System Role
                      {sortField === 'role' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')} 
                    className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortField === 'status' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th className="px-6 py-4.5 text-xs font-bold text-dark-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {paginatedMembers.map((emp) => (
                  <tr key={emp.id} className="hover:bg-dark-border/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full border border-accent-teal/30 flex items-center justify-center font-bold text-accent-teal uppercase text-sm overflow-hidden bg-accent-teal/10 shrink-0">
                          {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            emp.name.substring(0, 2)
                          )}
                        </div>
                        <span className="font-semibold text-white text-sm">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-dark-muted">{emp.email}</td>
                    <td className="px-6 py-4.5 text-sm text-white font-medium">{emp.designation || 'N/A'}</td>
                    <td className="px-6 py-4.5 text-sm text-white font-medium">{emp.department || 'N/A'}</td>
                    <td className="px-6 py-4.5 text-sm font-medium text-white capitalize">
                      {emp.role === 'employee' ? 'Workspace Member' : emp.role}
                    </td>
                    <td className="px-6 py-4.5">
                      {(() => {
                        const statusVal = emp.status || (emp.hasLoggedIn ? 'Active' : 'Pending');
                        const isAct = statusVal === 'Active';
                        const isPend = statusVal === 'Pending';
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isAct 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : isPend
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-400' : isPend ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            {statusVal}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4.5 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingMember(emp)}
                          className="p-1.5 rounded-lg text-dark-muted hover:text-accent-teal hover:bg-dark-border/40 transition-all duration-200 cursor-pointer"
                          title="View Member Profile Details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(emp)}
                          className="p-1.5 rounded-lg text-dark-muted hover:text-accent-teal hover:bg-dark-border/40 transition-all duration-200 cursor-pointer"
                          title="Edit Member Details"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(emp.id, emp.name)}
                          className="p-1.5 rounded-lg text-dark-muted hover:text-accent-rose hover:bg-dark-border/40 transition-all duration-200 cursor-pointer"
                          title="Delete Member Profile"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredAndSortedMembers.length > 0 && (
          <div className="px-6 py-4 border-t border-dark-border bg-dark-card/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-dark-muted font-medium font-sans">
              Showing <span className="text-white font-bold">{filteredAndSortedMembers.length === 0 ? 0 : startIndex + 1}</span> to <span className="text-white font-bold">{endIndex}</span> of <span className="text-white font-bold">{filteredAndSortedMembers.length}</span> members
            </div>

            <div className="flex items-center gap-1 font-sans">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-dark-muted hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-dark-muted font-semibold transition-all duration-200 cursor-pointer h-[28px] flex items-center justify-center min-w-[56px] text-[10px]"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[28px] h-[28px] rounded-[4px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center border text-[10px] ${
                      currentPage === pageNum
                        ? 'bg-[#60a5fa]/15 border-[#60a5fa]/40 text-[#60a5fa]'
                        : 'border-dark-border bg-transparent hover:bg-dark-border text-dark-muted hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-dark-muted hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-dark-muted font-semibold transition-all duration-200 cursor-pointer h-[28px] flex items-center justify-center min-w-[56px] text-[10px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal Dialog */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden relative">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-dark-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-accent-teal" />
                {editingMemberId ? 'Edit Workspace Member' : 'Add New Member'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-1.5 rounded-lg text-dark-muted hover:bg-dark-border hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {/* Slide progress indicator bar */}
              <div className="flex items-center justify-center gap-1.5 pb-1">
                <span className={`h-1.5 rounded-full transition-all duration-300 ${slide === 1 ? 'w-8 bg-accent-teal' : 'w-2 bg-dark-border'}`} />
                <span className={`h-1.5 rounded-full transition-all duration-300 ${slide === 2 ? 'w-8 bg-accent-teal' : 'w-2 bg-dark-border'}`} />
                <span className={`h-1.5 rounded-full transition-all duration-300 ${slide === 3 ? 'w-8 bg-accent-teal' : 'w-2 bg-dark-border'}`} />
              </div>

              {submitError && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-accent-rose/25 bg-accent-rose/5 text-xs text-accent-rose">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {slide === 1 && (
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {/* Basic Information Section */}
                  <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1 mb-2">
                    Basic Information
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                      <input
                        type="text"
                        required
                        placeholder="E.g. Michael Chen"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full pl-10.5 pr-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Work Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                      <input
                        type="email"
                        required
                        placeholder="E.g. operator@company.com"
                        value={memberEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`w-full pl-10.5 pr-4 py-2 rounded-lg bg-dark-border/40 border focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px] ${
                          emailError ? 'border-accent-rose focus:border-accent-rose' : 'border-dark-border focus:border-accent-teal'
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-[10px] text-accent-rose font-semibold mt-1">{emailError}</p>
                    )}
                  </div>

                  {/* DOB and Phone Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-muted">Date of Birth (Optional)</label>
                      <input
                        type="date"
                        value={memberDob}
                        onChange={(e) => setMemberDob(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-muted">Phone Number (Optional)</label>
                      <div className="flex gap-2">
                        {/* Custom CC Selector Dropdown */}
                        <div ref={ccRef} className="relative shrink-0">
                          <button
                            id="cc-btn"
                            type="button"
                            onClick={() => setIsCcOpen(!isCcOpen)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dark-border bg-dark-border/40 text-sm text-white font-semibold transition-colors outline-none cursor-pointer h-[38px]"
                          >
                            <img 
                              src={`https://flagcdn.com/w20/${ccCountryIso.toLowerCase()}.png`} 
                              alt={ccCountryIso} 
                              className="w-4.5 h-3 object-cover rounded-sm border border-dark-border"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                            />
                            <span>{countryCode}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-dark-muted" />
                          </button>

                          {isCcOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-dark-card border border-dark-border rounded-lg shadow-lg z-50 py-2">
                              <div className="px-2 pb-2 border-b border-dark-border">
                                <input
                                  ref={ccSearchRef}
                                  type="text"
                                  placeholder="Search country/code..."
                                  value={ccSearch}
                                  onChange={(e) => setCcSearch(e.target.value)}
                                  className="w-full px-2.5 py-1 text-xs border border-dark-border rounded bg-dark-border/40 text-white outline-none focus:border-accent-teal"
                                />
                              </div>
                              {filteredCcCountries.map((c) => {
                                const p = c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`;
                                return (
                                  <button
                                    key={`${c.isoCode}-${p}`}
                                    type="button"
                                    onClick={() => {
                                      setCountryCode(p);
                                      setCcCountryIso(c.isoCode);
                                      setIsCcOpen(false);
                                      setCcSearch('');
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-dark-border focus:bg-dark-border outline-none text-left text-xs font-semibold text-white transition-colors"
                                  >
                                    <img 
                                      src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`} 
                                      alt={c.name} 
                                      className="w-4.5 h-3 object-cover rounded-sm border border-dark-border shrink-0" 
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                                    />
                                    <span className="font-extrabold">{p}</span>
                                    <span className="text-dark-muted truncate text-[10px]">({c.name})</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Phone input box */}
                        <div className="relative flex-grow">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                          <input
                            type="text"
                            placeholder={ccCountryIso === 'IN' ? '98765 43210' : 'Enter number'}
                            value={memberPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              const limit = phoneLimits[ccCountryIso] || 15;
                              if (val.length <= limit) {
                                setMemberPhone(val);
                              }
                            }}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Designation and Department side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Designation */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-muted">Designation *</label>
                      <select
                        value={memberDesignation}
                        onChange={(e) => setMemberDesignation(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      >
                        <option value="Maintenance Engineer" className="text-dark-text bg-dark-card">Maintenance Engineer</option>
                        <option value="Operations Manager" className="text-dark-text bg-dark-card">Operations Manager</option>
                        <option value="Safety Officer" className="text-dark-text bg-dark-card">Safety Officer</option>
                        <option value="Plant Supervisor" className="text-dark-text bg-dark-card">Plant Supervisor</option>
                        <option value="Quality Inspector" className="text-dark-text bg-dark-card">Quality Inspector</option>
                        <option value="Technician" className="text-dark-text bg-dark-card">Technician</option>
                        <option value="Other" className="text-dark-text bg-dark-card">Other</option>
                      </select>
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-muted">Department *</label>
                      <select
                        value={memberDepartment}
                        onChange={(e) => setMemberDepartment(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                      >
                        <option value="Maintenance" className="text-dark-text bg-dark-card">Maintenance</option>
                        <option value="Operations" className="text-dark-text bg-dark-card">Operations</option>
                        <option value="Safety" className="text-dark-text bg-dark-card">Safety</option>
                        <option value="Quality" className="text-dark-text bg-dark-card">Quality</option>
                        <option value="Production" className="text-dark-text bg-dark-card">Production</option>
                        <option value="Engineering" className="text-dark-text bg-dark-card">Engineering</option>
                        <option value="IT" className="text-dark-text bg-dark-card">IT</option>
                        <option value="Other" className="text-dark-text bg-dark-card">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Designation & Department inputs (side-by-side if active) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Custom Designation */}
                    {memberDesignation === 'Other' ? (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-dark-muted">Specify Designation Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g. Operations Coordinator"
                          value={customDesignation}
                          onChange={(e) => setCustomDesignation(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                        />
                      </div>
                    ) : <div />}

                    {/* Custom Department */}
                    {memberDepartment === 'Other' ? (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-xs font-bold text-dark-muted">Specify Department Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g. Logistics & Supply"
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                        />
                      </div>
                    ) : <div />}
                  </div>

                  {/* Access Information Section */}
                  <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1 mb-2 pt-1">
                    Access Information
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Role *</label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium transition-colors h-[38px]"
                    >
                      <option value="admin" className="text-dark-text bg-dark-card">Administrator</option>
                      <option value="employee" className="text-dark-text bg-dark-card">Workspace Member</option>
                    </select>
                  </div>
                </div>
              )}

              {slide === 2 && (
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 animate-fadeIn">
                  {/* Address Details Section */}
                  <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1 mb-2">
                    Address Details
                  </div>

                  {/* Address Line 1 */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Address Line 1 *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                      <input
                        type="text"
                        required
                        placeholder="E.g. 123 Industrial Parkway"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Address Line 2 (Optional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                      <input
                        type="text"
                        placeholder="Suite 400, Building B"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Country Selector */}
                  <div ref={countryRef} className="space-y-1 relative">
                    <label className="text-xs font-bold text-dark-muted">Country *</label>
                    <button
                      id="country-btn"
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dark-border bg-dark-border/40 text-sm text-white focus:border-accent-teal outline-none text-left cursor-pointer h-[38px]"
                    >
                      <span className="truncate">
                        {selectedCountry ? (Country.getCountryByCode(selectedCountry)?.name || selectedCountry) : 'Select Country'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-dark-muted shrink-0" />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-dark-card border border-dark-border rounded-lg shadow-lg z-50 py-2">
                        <div className="px-2 pb-2 border-b border-dark-border">
                          <input
                            ref={countrySearchRef}
                            type="text"
                            placeholder="Search Country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-dark-border rounded bg-dark-border/40 text-white outline-none focus:border-accent-teal"
                          />
                        </div>
                        {filteredCountries.map((c) => (
                          <button
                            key={c.isoCode}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c.isoCode);
                              setSelectedState('');
                              setSelectedCity('');
                              setIsCountryOpen(false);
                              setCountrySearch('');
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-dark-border focus:bg-dark-border outline-none text-left text-xs font-semibold text-white transition-colors"
                          >
                            <img 
                              src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`} 
                              alt={c.name}
                              className="w-4 h-3 object-cover rounded-sm border border-dark-border"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                            />
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State and City (Side-by-side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* State Selector */}
                    <div ref={stateRef} className="space-y-1 relative">
                      <label className="text-xs font-bold text-dark-muted">State/Province *</label>
                      <button
                        id="state-btn"
                        type="button"
                        disabled={!selectedCountry}
                        onClick={() => setIsStateOpen(!isStateOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dark-border bg-dark-border/40 text-sm text-white focus:border-accent-teal outline-none text-left disabled:opacity-50 cursor-pointer h-[38px]"
                      >
                        <span className="truncate">
                          {(selectedCountry && selectedState) ? (State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name || selectedState) : 'Select State'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-dark-muted shrink-0" />
                      </button>

                      {isStateOpen && selectedCountry && (
                        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-dark-card border border-dark-border rounded-lg shadow-lg z-50 py-2">
                          <div className="px-2 pb-2 border-b border-dark-border">
                            <input
                              ref={stateSearchRef}
                              type="text"
                              placeholder="Search State..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-dark-border rounded bg-dark-border/40 text-white outline-none focus:border-accent-teal"
                            />
                          </div>
                          {filteredStates.map((s) => (
                            <button
                              key={s.isoCode}
                              type="button"
                              onClick={() => {
                                setSelectedState(s.isoCode);
                                setSelectedCity('');
                                setIsStateOpen(false);
                                setStateSearch('');
                              }}
                              className="w-full px-3 py-2 hover:bg-dark-border focus:bg-dark-border outline-none text-left text-xs font-semibold text-white block truncate transition-colors"
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* City Selector */}
                    <div ref={cityRef} className="space-y-1 relative">
                      <label className="text-xs font-bold text-dark-muted">City *</label>
                      <button
                        id="city-btn"
                        type="button"
                        disabled={!selectedState}
                        onClick={() => setIsCityOpen(!isCityOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dark-border bg-dark-border/40 text-sm text-white focus:border-accent-teal outline-none text-left disabled:opacity-50 cursor-pointer h-[38px]"
                      >
                        <span className="truncate">{selectedCity || 'Select City'}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-dark-muted shrink-0" />
                      </button>

                      {isCityOpen && selectedState && (
                        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-dark-card border border-dark-border rounded-lg shadow-lg z-50 py-2">
                          <div className="px-2 pb-2 border-b border-dark-border">
                            <input
                              ref={citySearchRef}
                              type="text"
                              placeholder="Search City..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-dark-border rounded bg-dark-border/40 text-white outline-none focus:border-accent-teal"
                            />
                          </div>
                          {filteredCities.map((city) => (
                            <button
                              key={city.name}
                              type="button"
                              onClick={() => {
                                setSelectedCity(city.name);
                                setIsCityOpen(false);
                                setCitySearch('');
                              }}
                              className="w-full px-3 py-2 hover:bg-dark-border focus:bg-dark-border outline-none text-left text-xs font-semibold text-white block truncate transition-colors"
                            >
                              {city.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zip Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Zip Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="E.g. 94016"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors h-[38px]"
                    />
                  </div>
                </div>
              )}

              {slide === 3 && (
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 animate-fadeIn">
                  {/* Optional Details Section */}
                  <div className="text-[10px] uppercase font-bold text-accent-teal tracking-wider border-b border-dark-border/40 pb-1 mb-2">
                    Optional Details
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Profile Photo</label>
                    <div className="flex items-center gap-4 p-3 border border-dashed border-dark-border rounded-xl bg-dark-border/20">
                      {memberPhoto ? (
                        <div className="relative w-14 h-14 rounded-full border border-dark-border bg-dark-card flex items-center justify-center overflow-hidden shrink-0 group">
                          <img src={memberPhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setMemberPhoto('')}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-full cursor-pointer"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full border border-dark-border bg-dark-card flex items-center justify-center shrink-0">
                          <UserIcon className="w-6 h-6 text-dark-muted" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <span className="block text-xs font-bold text-white">Upload image file</span>
                        <span className="block text-[10px] text-dark-muted mt-0.5">PNG, JPG, or WEBP up to 2MB</span>
                        <label className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-dark-border bg-dark-card hover:bg-dark-border text-[11px] font-bold text-accent-teal cursor-pointer transition-colors shadow-sm">
                          <Plus className="w-3 h-3 text-accent-teal" />
                          Select File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  setSubmitError('Profile image must be smaller than 2MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setMemberPhoto(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-muted">Notes</label>
                    <textarea
                      placeholder="Add onboarding remarks or workspace notes..."
                      value={memberNotes}
                      onChange={(e) => setMemberNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg bg-dark-border/40 border border-dark-border focus:border-accent-teal focus:outline-none text-sm text-white font-medium placeholder-dark-muted/60 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Buttons Container */}
              <div className="flex gap-3 justify-end pt-4 border-t border-dark-border mt-6">
                {slide === 1 ? (
                  <>
                    <button
                      key="cancel-btn"
                      type="button"
                      onClick={() => { setIsModalOpen(false); resetForm(); }}
                      className="px-4 py-2.5 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 h-[38px]"
                    >
                      Cancel
                    </button>
                    <button
                      key="next-btn-1"
                      type="button"
                      onClick={handleNextSlide1}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[4px] bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 h-[38px]"
                    >
                      Next
                    </button>
                  </>
                ) : slide === 2 ? (
                  <>
                    <button
                      key="back-btn-2"
                      type="button"
                      onClick={() => setSlide(1)}
                      className="px-4 py-2.5 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 h-[38px]"
                    >
                      Back
                    </button>
                    <button
                      key="next-btn-2"
                      type="button"
                      onClick={handleNextSlide2}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[4px] bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 h-[38px]"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      key="back-btn-3"
                      type="button"
                      onClick={() => setSlide(2)}
                      className="px-4 py-2.5 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 h-[38px]"
                    >
                      Back
                    </button>
                    <button
                      key="save-btn"
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[4px] bg-accent-teal hover:bg-accent-tealHover disabled:bg-accent-teal/60 text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 min-w-[120px] h-[38px]"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : editingMemberId ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#ffffff]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-[#ffffff]" />
                      )}
                      {editingMemberId ? 'Save Changes' : 'Save Member'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Credentials Confirmation Sub-Modal (shown after successful save) */}
      {isConfirmModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn animate-duration-200">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 relative">
            <div className="flex justify-between items-center pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-teal" />
                Member Created Successfully
              </h3>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1.5 rounded-lg text-dark-muted hover:bg-dark-border hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border border-[#10b981]/25 bg-[#10b981]/5 text-xs text-[#10b981] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Workspace member has been saved to the database. Share the credentials below so they can log in.</span>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-xl border border-dark-border bg-dark-bg/60 space-y-3.5">
              <div>
                <span className="text-[10px] font-bold text-dark-muted uppercase block mb-0.5">Full Name</span>
                <span className="text-sm font-semibold text-white">{savedCredentialName}</span>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-dark-muted uppercase block mb-0.5">Work Email</span>
                <span className="text-sm font-semibold text-white font-mono">{savedCredentialEmail}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-dark-muted uppercase block mb-0.5">Generated Password</span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-dark-card border border-dark-border mt-1">
                  <span className="text-sm font-bold text-accent-teal font-mono tracking-wider">{tempGeneratedPassword}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempGeneratedPassword);
                    }}
                    className="text-[10px] font-bold text-accent-teal hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-[4px] border border-dark-border bg-transparent hover:bg-dark-border text-xs text-dark-muted hover:text-white font-bold transition-all duration-200 cursor-pointer h-[38px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Name: ${savedCredentialName}\nEmail: ${savedCredentialEmail}\nPassword: ${tempGeneratedPassword}`);
                  setIsConfirmModalOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[4px] bg-accent-teal hover:bg-accent-tealHover text-[#ffffff] text-xs font-bold shadow-glow-teal transition-all duration-200 cursor-pointer h-[38px] min-w-[130px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ffffff]" />
                Copy & Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Member Profile Details Modal */}
      {viewingMember && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-2xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-dark-border bg-dark-card/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-accent-teal/40 flex items-center justify-center font-bold text-accent-teal uppercase text-lg overflow-hidden bg-accent-teal/10 shrink-0">
                  {viewingMember.profilePhoto ? (
                    <img src={viewingMember.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    viewingMember.name.substring(0, 2)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{viewingMember.name}</h3>
                  <p className="text-xs text-dark-muted font-mono mt-0.5">{viewingMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="p-1.5 rounded-lg text-dark-muted hover:bg-dark-border hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-teal/10 text-accent-teal border border-accent-teal/30">
                  {viewingMember.role === 'employee' ? 'Workspace Member' : viewingMember.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  (viewingMember.status === 'Active' || (!viewingMember.status && viewingMember.hasLoggedIn))
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  Status: {viewingMember.status || (viewingMember.hasLoggedIn ? 'Active' : 'Pending')}
                </span>
                {viewingMember.employeeId && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-dark-bg text-dark-muted border border-dark-border">
                    ID: {viewingMember.employeeId}
                  </span>
                )}
              </div>

              {/* Section 1: Position & Department */}
              <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-3">
                <h4 className="text-xs font-bold text-accent-teal uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Professional Identity
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-dark-muted font-medium block">Designation</span>
                    <span className="text-white font-bold mt-0.5 block">{viewingMember.designation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted font-medium block">Department</span>
                    <span className="text-white font-bold mt-0.5 block">{viewingMember.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted font-medium block">Employee ID</span>
                    <span className="text-white font-mono font-bold mt-0.5 block">{viewingMember.employeeId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted font-medium block">Reporting Manager</span>
                    <span className="text-white font-bold mt-0.5 block">{viewingMember.reportingManager || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Office Location */}
              <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-3">
                <h4 className="text-xs font-bold text-accent-teal uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Contact & Location
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-dark-muted font-medium block">Phone Number</span>
                    <span className="text-white font-mono font-bold mt-0.5 block">{viewingMember.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted font-medium block">Office Location</span>
                    <span className="text-white font-bold mt-0.5 block">{viewingMember.officeLocation || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-dark-muted font-medium block">Registered Address</span>
                    <span className="text-white font-bold mt-0.5 block">
                      {[viewingMember.addressLine1, viewingMember.addressLine2, viewingMember.city, viewingMember.state, viewingMember.country, viewingMember.zipCode].filter(Boolean).join(', ') || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Notes & Metadata */}
              <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-3">
                <h4 className="text-xs font-bold text-accent-teal uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Account Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-dark-muted font-medium block">Date Added</span>
                    <span className="text-white font-mono font-bold mt-0.5 block">
                      {viewingMember.createdAt ? new Date(viewingMember.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-muted font-medium block">First Time Login</span>
                    <span className="text-white font-bold mt-0.5 block">{viewingMember.hasLoggedIn ? 'Completed' : 'Pending'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-dark-muted font-medium block">Profile Notes</span>
                    <p className="text-white mt-1 leading-relaxed bg-dark-card p-3 rounded-lg border border-dark-border/60">
                      {viewingMember.notes || 'No profile notes recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-dark-border bg-dark-card/80">
              <button
                type="button"
                onClick={() => {
                  const empToEdit = viewingMember;
                  setViewingMember(null);
                  handleStartEdit(empToEdit);
                }}
                className="px-4 py-2 rounded-xl border border-accent-teal/30 bg-accent-teal/10 hover:bg-accent-teal/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="px-5 py-2 rounded-xl border border-dark-border bg-dark-card hover:bg-dark-border/40 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MembersPage;
