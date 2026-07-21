import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { apiFetch } from '../utils/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  Loader2, 
  User, 
  Building, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  ChevronDown,
  Briefcase,
  Users,
  Upload,
  X
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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  // Form Fields State
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [ccCountryIso, setCcCountryIso] = useState('US');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Optional Company Logo Upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo image must be smaller than 2MB.');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Dropdowns States
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Dropdown Open States
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  // Search filter query states
  const [ccSearch, setCcSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Real-Time Inline Errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Password Strength States
  const [pwdScore, setPwdScore] = useState(0);
  const [pwdStrengthText, setPwdStrengthText] = useState('');
  const [pwdStrengthColor, setPwdStrengthColor] = useState('bg-slate-200');

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

  // Get lists from country-state-city library
  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState) : [];

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
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length > limit) {
      setPhoneNumber(cleanPhone.slice(0, limit));
    }
  }, [ccCountryIso]);

  // Autofocus search inputs when dropdown opens
  useEffect(() => {
    if (isCcOpen) setTimeout(() => ccSearchRef.current?.focus(), 50);
  }, [isCcOpen]);

  // Autofocus search inputs when dropdown opens for locations
  useEffect(() => {
    if (isCountryOpen) setTimeout(() => countrySearchRef.current?.focus(), 50);
  }, [isCountryOpen]);

  useEffect(() => {
    if (isStateOpen) setTimeout(() => stateSearchRef.current?.focus(), 50);
  }, [isStateOpen]);

  useEffect(() => {
    if (isCityOpen) setTimeout(() => citySearchRef.current?.focus(), 50);
  }, [isCityOpen]);

  // Arrow Key Navigation between fields
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeId = document.activeElement?.id;
      if (!activeId) return;

      const navigationGrid = [
        ['company', 'industryType', 'companySize'],
        ['admin', 'email', 'email'],
        ['cc-btn', 'phone', 'designation'],
        ['password', 'confirmPassword', 'confirmPassword'],
        ['addressLine1', 'addressLine1', 'zip'],
        ['addressLine2', 'addressLine2', 'addressLine2'],
        ['country-btn', 'state-btn', 'city-btn'],
      ];

      let r = -1;
      let c = -1;
      for (let i = 0; i < navigationGrid.length; i++) {
        const colIndex = navigationGrid[i].indexOf(activeId);
        if (colIndex !== -1) {
          r = i;
          c = colIndex;
          break;
        }
      }

      if (r === -1) return;

      const activeEl = document.activeElement as HTMLInputElement | HTMLSelectElement | HTMLButtonElement;
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' && (activeEl.type === 'text' || activeEl.type === 'email' || activeEl.type === 'password' || activeEl.type === 'tel'));

      if (e.key === 'ArrowRight') {
        if (isTextInput) {
          const len = activeEl.value?.length || 0;
          if (activeEl.selectionStart !== len || activeEl.selectionEnd !== len) {
            return; // Allow cursor movement within text
          }
        }
        for (let i = c + 1; i < navigationGrid[r].length; i++) {
          const nextId = navigationGrid[r][i];
          if (nextId !== activeId) {
            const nextEl = document.getElementById(nextId);
            if (nextEl) {
              nextEl.focus();
              e.preventDefault();
              break;
            }
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (isTextInput) {
          if (activeEl.selectionStart !== 0 || activeEl.selectionEnd !== 0) {
            return; // Allow cursor movement within text
          }
        }
        for (let i = c - 1; i >= 0; i--) {
          const prevId = navigationGrid[r][i];
          if (prevId !== activeId) {
            const prevEl = document.getElementById(prevId);
            if (prevEl) {
              prevEl.focus();
              e.preventDefault();
              break;
            }
          }
        }
      } else if (e.key === 'ArrowDown') {
        if (r < navigationGrid.length - 1) {
          const nextRow = navigationGrid[r + 1];
          const targetId = nextRow[Math.min(c, nextRow.length - 1)];
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.focus();
            e.preventDefault();
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (r > 0) {
          const prevRow = navigationGrid[r - 1];
          const targetId = prevRow[Math.min(c, prevRow.length - 1)];
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dropdown keyboard navigation handler
  useEffect(() => {
    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      // Find which dropdown is currently active
      let activeRef: React.RefObject<HTMLDivElement> | null = null;
      let activeSearchRef: React.RefObject<HTMLInputElement> | null = null;
      let triggerBtnId = '';
      let closeDropdown = () => {};

      if (isCcOpen) {
        activeRef = ccRef;
        activeSearchRef = ccSearchRef;
        triggerBtnId = 'cc-btn';
        closeDropdown = () => setIsCcOpen(false);
      } else if (isCountryOpen) {
        activeRef = countryRef;
        activeSearchRef = countrySearchRef;
        triggerBtnId = 'country-btn';
        closeDropdown = () => setIsCountryOpen(false);
      } else if (isStateOpen) {
        activeRef = stateRef;
        activeSearchRef = stateSearchRef;
        triggerBtnId = 'state-btn';
        closeDropdown = () => setIsStateOpen(false);
      } else if (isCityOpen) {
        activeRef = cityRef;
        activeSearchRef = citySearchRef;
        triggerBtnId = 'city-btn';
        closeDropdown = () => setIsCityOpen(false);
      }

      if (!activeRef || !activeRef.current) return;

      const activeEl = document.activeElement;
      // Check if focus is inside the active dropdown container
      if (!activeRef.current.contains(activeEl)) return;

      // Find all focusable options in the list (excluding the search input itself)
      const options = Array.from(
        activeRef.current.querySelectorAll('button:not([id])')
      ) as HTMLButtonElement[];

      if (options.length === 0) return;

      const currentIndex = options.indexOf(activeEl as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl === activeSearchRef?.current) {
          // Focus the first option
          options[0]?.focus();
        } else if (currentIndex !== -1) {
          // Focus the next option
          const nextIndex = (currentIndex + 1) % options.length;
          options[nextIndex]?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex === 0 && activeSearchRef?.current) {
          // Focus back to the search input
          activeSearchRef.current.focus();
        } else if (currentIndex > 0) {
          // Focus the previous option
          options[currentIndex - 1]?.focus();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeDropdown();
        // Return focus to the trigger button
        document.getElementById(triggerBtnId)?.focus();
      } else if (e.key === 'Enter') {
        if (currentIndex !== -1) {
          e.preventDefault();
          e.stopPropagation();
          options[currentIndex].click();
          // Return focus to the trigger button
          document.getElementById(triggerBtnId)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleDropdownKeyDown, true);
    return () => document.removeEventListener('keydown', handleDropdownKeyDown, true);
  }, [isCcOpen, isCountryOpen, isStateOpen, isCityOpen]);

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

  // Real-Time Email Validation
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setEmailError('Please enter a valid enterprise email.');
      } else {
        setEmailError(null);
      }
    }
  };

  // Real-Time Password Strength Meter Calculation
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    
    // Check match for confirm password immediately
    if (confirmPassword && val !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError(null);
    }

    if (!val) {
      setPwdScore(0);
      setPwdStrengthText('');
      setPwdStrengthColor('bg-slate-200');
      return;
    }

    let score = 0;
    if (val.length >= 6) score += 1;
    if (val.length >= 8) score += 1;
    
    const hasNumbers = /\d/.test(val);
    const hasSymbols = /[^A-Za-z0-9]/.test(val);
    const hasUppercase = /[A-Z]/.test(val);

    if (hasNumbers || hasSymbols) score += 1;
    if (hasNumbers && hasSymbols && hasUppercase) score += 1;

    setPwdScore(score);

    switch (score) {
      case 1:
        setPwdStrengthText('Weak (Too Short)');
        setPwdStrengthColor('bg-red-500');
        break;
      case 2:
        setPwdStrengthText('Weak');
        setPwdStrengthColor('bg-orange-500');
        break;
      case 3:
        setPwdStrengthText('Medium');
        setPwdStrengthColor('bg-yellow-500');
        break;
      case 4:
        setPwdStrengthText('Strong');
        setPwdStrengthColor('bg-emerald-500');
        break;
      default:
        setPwdStrengthText('Weak');
        setPwdStrengthColor('bg-red-500');
    }
  };

  // Real-Time Confirm Password Match validation
  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (!val) {
      setConfirmPasswordError(null);
    } else if (val !== password) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Required Inputs
    if (
      !companyName.trim() || 
      !industryType ||
      !adminName.trim() || 
      !email.trim() || 
      !phoneNumber.trim() || 
      !addressLine1.trim() ||
      !password || 
      !confirmPassword || 
      !selectedCountry || 
      !selectedState || 
      !selectedCity
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (emailError) {
      setError('Please correct your email format.');
      return;
    }

    if (confirmPasswordError) {
      setError('Passwords must match.');
      return;
    }

    if (companyName.trim().length < 3) {
      setError('Company Name must be at least 3 characters.');
      return;
    }

    if (adminName.trim().length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }



    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const expectedLength = phoneLimits[ccCountryIso];
    if (expectedLength) {
      if (cleanPhone.length !== expectedLength) {
        setError(`Phone number for ${ccCountryIso} must be exactly ${expectedLength} digits.`);
        return;
      }
    } else {
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        setError('Please enter a valid phone number (7 to 15 digits).');
        return;
      }
    }

    setLoading(true);

    apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        companyName,
        industryType,
        companySize,
        adminName,
        email,
        password,
        addressLine1,
        addressLine2,
        zipCode,
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        logo: logoPreview || undefined
      })
    })
      .then(() => {
        setLoading(false);
        setRegistered(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      })
      .catch((err: any) => {
        setLoading(false);
        setError(err.message || 'An error occurred during signup.');
      });
  };

  // Helper names lookup
  const currentCountryName = selectedCountry ? (Country.getCountryByCode(selectedCountry)?.name || selectedCountry) : '';
  const currentStateName = (selectedCountry && selectedState) ? (State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name || selectedState) : '';

  // Filter lists based on search states
  const filteredCountries = countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredStates = states.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
  const filteredCities = cities.filter(ci => ci.name.toLowerCase().includes(citySearch.toLowerCase()));

  const filteredCcCountries = countries.filter(c => {
    const raw = c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`;
    return c.name.toLowerCase().includes(ccSearch.toLowerCase()) || raw.includes(ccSearch);
  });

  // Typography Constants
  const headingStyle = { fontFamily: "'Outfit', sans-serif" };
  const bodyStyle = { fontFamily: "'Inter', sans-serif" };

  return (
    <div 
      className="min-h-screen bg-[#1e4e7c]/3 text-slate-900 flex flex-col justify-center items-center py-16 px-6 relative"
      style={bodyStyle}
    >
      
      {/* Absolute Back to Home Button (Top Left) */}
      <div className="absolute top-8 left-8">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xs font-bold text-[#1e4e7c] hover:text-[#153a5c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Expanded card width: w-full max-w-4xl */}
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-2">
            <img src="/logo.webp" alt="SamiQ Logo" className="w-8.5 h-8.5 object-contain rounded-lg shadow-glow-teal" />
            <span className="font-extrabold text-xl tracking-tight text-[#1e4e7c]" style={headingStyle}>
              SamiQ
            </span>
          </Link>
        </div>

        {/* Card Body - Static */}
        <div className="bg-[#ffffff] border border-[#1e4e7c]/10 p-8 md:p-12 rounded-3xl shadow-xl w-full">
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e4e7c] mb-8 text-center" style={headingStyle}>
            Create Industrial Workspace
          </h2>

          {registered ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-sm text-emerald-800 flex flex-col items-center gap-3">
              <ShieldCheck className="w-12 h-12 text-emerald-600 animate-bounce" />
              <span className="font-bold text-lg">Registration Successful!</span>
              <span>Your secure workspace database is currently seeding. Redirecting to access login...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section: Company Information */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block border-b border-slate-100 pb-1.5">
                  Company Information
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Company Name */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label htmlFor="company" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Building className="w-4 h-4" />
                      </span>
                      <input
                        id="company"
                        type="text"
                        placeholder="Acme Heavy Industries"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Industry Type */}
                  <div className="space-y-1.5">
                    <label htmlFor="industryType" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Industry Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <select
                        id="industryType"
                        value={industryType}
                        onChange={(e) => setIndustryType(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 focus:border-[#1e4e7c] outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Industry</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Oil & Gas">Oil & Gas</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Pharmaceutical">Pharmaceutical</option>
                        <option value="Power & Energy">Power & Energy</option>
                        <option value="Mining">Mining</option>
                        <option value="Chemical">Chemical</option>
                        <option value="Construction">Construction</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4 animate-pulse" />
                      </span>
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1.5">
                    <label htmlFor="companySize" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Company Size
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <select
                        id="companySize"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 focus:border-[#1e4e7c] outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Company Size</option>
                        <option value="1–50">1–50</option>
                        <option value="51–200">51–200</option>
                        <option value="201–500">201–500</option>
                        <option value="500+">500+</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4 animate-pulse" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Admin Information */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block border-b border-slate-100 pb-1.5">
                  Admin Information
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="admin" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="admin"
                        type="text"
                        placeholder="John Doe"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Enterprise Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Enterprise Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        placeholder="john.doe@acme.com"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        disabled={loading}
                        required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors ${
                          emailError 
                            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                            : 'border-[#1e4e7c]/15 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c]'
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-[10px] text-red-600 font-semibold mt-1">{emailError}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {/* Custom CC Selector Dropdown (Downside guaranteed) */}
                      <div ref={ccRef} className="relative max-w-[140px] shrink-0">
                        <button
                          id="cc-btn"
                          type="button"
                          onClick={() => !loading && setIsCcOpen(!isCcOpen)}
                          className="w-full flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 focus:border-[#1e4e7c] outline-none text-left min-w-[110px]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <img 
                              src={`https://flagcdn.com/w20/${ccCountryIso.toLowerCase()}.png`} 
                              alt={ccCountryIso}
                              className="w-4.5 h-3 object-cover rounded-sm shrink-0 border border-slate-200"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                            />
                            <span>{countryCode}</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>

                        {isCcOpen && (
                          <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-[#ffffff] border border-[#1e4e7c]/15 rounded-lg shadow-lg z-50 py-2">
                            <div className="px-2 pb-2 border-b border-slate-100">
                              <input
                                ref={ccSearchRef}
                                type="text"
                                placeholder="Search country/code..."
                                value={ccSearch}
                                onChange={(e) => setCcSearch(e.target.value)}
                                className="w-full px-2.5 py-1 text-xs border border-[#1e4e7c]/10 rounded bg-slate-50 outline-none focus:border-[#1e4e7c]"
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
                                  className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 focus:bg-slate-100 outline-none text-left text-xs font-semibold text-slate-800"
                                >
                                  <img 
                                    src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`} 
                                    alt={c.name} 
                                    className="w-4.5 h-3 object-cover rounded-sm shrink-0 border border-slate-200" 
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                                  />
                                  <span className="font-extrabold">{p}</span>
                                  <span className="text-slate-400 truncate text-[10px]">({c.name})</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          placeholder={ccCountryIso === 'IN' ? '98765 43210' : 'Enter number'}
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const limit = phoneLimits[ccCountryIso] || 15;
                            if (val.length <= limit) {
                              setPhoneNumber(val);
                            }
                          }}
                          maxLength={phoneLimits[ccCountryIso] || 15}
                          disabled={loading}
                          required
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Designation (Optional) */}
                  <div className="space-y-1.5">
                    <label htmlFor="designation" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Designation (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <select
                        id="designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 focus:border-[#1e4e7c] outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Designation</option>
                        <option value="Plant Manager">Plant Manager</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Maintenance Engineer">Maintenance Engineer</option>
                        <option value="Safety Officer">Safety Officer</option>
                        <option value="IT Administrator">IT Administrator</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4 animate-pulse" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Security */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block border-b border-slate-100 pb-1.5">
                  Security
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Password Strength Meter */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Workspace Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#1e4e7c] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator Visual Bar */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Strength:</span>
                          <span className="font-extrabold">{pwdStrengthText}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1">
                          <div className={`h-full rounded-full transition-all duration-300 ${pwdScore >= 1 ? pwdStrengthColor : 'bg-slate-200'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${pwdScore >= 2 ? pwdStrengthColor : 'bg-slate-200'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${pwdScore >= 3 ? pwdStrengthColor : 'bg-slate-200'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${pwdScore >= 4 ? pwdStrengthColor : 'bg-slate-200'}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password (disabled if no password exists) */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        disabled={loading || !password}
                        required
                        className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors ${
                          confirmPasswordError 
                            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                            : 'border-[#1e4e7c]/15 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#1e4e7c] transition-colors"
                        disabled={!password}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-[10px] text-red-600 font-semibold mt-1">{confirmPasswordError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Location */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block border-b border-slate-100 pb-1.5">
                  Operating Location Information
                </span>
                
                {/* Country, State, City, Address, Zip Cascading Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                  
                  {/* Address Line 1 */}
                  <div className="space-y-1.5 md:col-span-4">
                    <label htmlFor="addressLine1" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input
                        id="addressLine1"
                        type="text"
                        placeholder="123 Industrial Parkway"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Zip/Postal Code (Optional) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="zip" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Zip/Postal Code (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input
                        id="zip"
                        type="text"
                        placeholder="90001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-1.5 md:col-span-6">
                    <label htmlFor="addressLine2" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Address Line 2 (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input
                        id="addressLine2"
                        type="text"
                        placeholder="Suite 400, Building B"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Custom Country Selector */}
                  <div ref={countryRef} className="space-y-1.5 relative md:col-span-2">
                    <label htmlFor="country" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="country-btn"
                      type="button"
                      onClick={() => !loading && setIsCountryOpen(!isCountryOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-955 focus:border-[#1e4e7c] outline-none text-left"
                    >
                      <span className="truncate">{currentCountryName || 'Select Country'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-[#ffffff] border border-[#1e4e7c]/15 rounded-lg shadow-lg z-50 py-2">
                        <div className="px-2 pb-2 border-b border-slate-100">
                          <input
                            ref={countrySearchRef}
                            type="text"
                            placeholder="Search Country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-[#1e4e7c]/10 rounded bg-slate-50 outline-none focus:border-[#1e4e7c]"
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
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 focus:bg-slate-100 outline-none text-left text-xs font-semibold text-slate-800"
                          >
                            <img 
                              src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`} 
                              alt={c.name}
                              className="w-4 h-3 object-cover rounded-sm border border-slate-200"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                            />
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom State/Province Selector */}
                  <div ref={stateRef} className="space-y-1.5 relative md:col-span-2">
                    <label htmlFor="state" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="state-btn"
                      type="button"
                      disabled={loading || !selectedCountry}
                      onClick={() => setIsStateOpen(!isStateOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-955 focus:border-[#1e4e7c] outline-none text-left disabled:opacity-50"
                    >
                      <span className="truncate">{currentStateName || 'Select State'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isStateOpen && selectedCountry && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-[#ffffff] border border-[#1e4e7c]/15 rounded-lg shadow-lg z-50 py-2">
                        <div className="px-2 pb-2 border-b border-slate-100">
                          <input
                            ref={stateSearchRef}
                            type="text"
                            placeholder="Search State..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-[#1e4e7c]/10 rounded bg-slate-50 outline-none focus:border-[#1e4e7c]"
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
                            className="w-full px-3 py-2 hover:bg-slate-50 focus:bg-slate-100 outline-none text-left text-xs font-semibold text-slate-800 block truncate"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom City Selector */}
                  <div ref={cityRef} className="space-y-1.5 relative md:col-span-2">
                    <label htmlFor="city" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      City <span className="text-red-500">*</span>
                    </label>
                    <button
                      id="city-btn"
                      type="button"
                      disabled={loading || !selectedState}
                      onClick={() => setIsCityOpen(!isCityOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-955 focus:border-[#1e4e7c] outline-none text-left disabled:opacity-50"
                    >
                      <span className="truncate">{selectedCity || 'Select City'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isCityOpen && selectedState && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-[#ffffff] border border-[#1e4e7c]/15 rounded-lg shadow-lg z-50 py-2">
                        <div className="px-2 pb-2 border-b border-slate-100">
                          <input
                            ref={citySearchRef}
                            type="text"
                            placeholder="Search City..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-[#1e4e7c]/10 rounded bg-slate-50 outline-none focus:border-[#1e4e7c]"
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
                            className="w-full px-3 py-2 hover:bg-slate-50 focus:bg-slate-100 outline-none text-left text-xs font-semibold text-slate-800 block truncate"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>

              {/* Section: Optional - Company Logo */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block border-b border-slate-100 pb-1.5">
                  Optional Details
                </span>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Company Logo
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-[#1e4e7c]/20 rounded-xl bg-slate-50/50">
                    {logoPreview ? (
                      <div className="relative w-16 h-16 rounded-lg border border-slate-200 bg-[#ffffff] flex items-center justify-center overflow-hidden shrink-0 group">
                        <img src={logoPreview} alt="Company Logo Preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#ffffff] rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="flex-grow text-center sm:text-left">
                      <span className="block text-xs font-bold text-slate-700">Upload Company Logo</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WEBP up to 2MB (Recommended square dimension)</span>
                      
                      <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e4e7c]/20 bg-[#ffffff] hover:bg-slate-50 text-xs font-semibold text-[#1e4e7c] cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        Select File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={loading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !!emailError || !!confirmPasswordError}
                className="w-full py-3.5 rounded-lg bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] font-extrabold shadow-md shadow-[#1e4e7c]/10 hover:shadow-[#1e4e7c]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Direct to Log In */}
          <div className="mt-6 text-center text-xs text-slate-500 font-semibold">
            Already registered?{' '}
            <Link to="/login" className="text-[#1e4e7c] hover:underline font-bold">
              Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
