import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import * as XLSX from 'xlsx';
import {
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Trash2,
  RefreshCw,
  Loader2,
  Users,
  Info,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

interface RawImportRow {
  'Member Name'?: string;
  'Enterprise Email'?: string;
  'Designation'?: string;
  'Department'?: string;
  'System Role'?: string;
  'Status'?: string;
  'Phone Number'?: string;
  'Employee ID'?: string;
  'Office Location'?: string;
  'Reporting Manager'?: string;
  'Profile Photo URL'?: string;
  'Notes'?: string;

  // Flexible key match fallbacks
  [key: string]: any;
}

interface ProcessedRow {
  rowNum: number;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: 'Admin' | 'Employee';
  status: 'Active' | 'Inactive' | 'Pending';
  phoneNumber?: string;
  employeeId?: string;
  officeLocation?: string;
  reportingManager?: string;
  profilePhoto?: string;
  notes?: string;

  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

const ImportMembersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 1: Prepare/Upload, 2: Validate, 3: Summary, 4: Success
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Upload & File states
  const [fileName, setFileName] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());

  // Parsed & Validated Data
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Results
  const [resultSummary, setResultSummary] = useState<{
    importedCount: number;
    duplicateCount: number;
    ignoredCount: number;
  }>({ importedCount: 0, duplicateCount: 0, ignoredCount: 0 });

  // Fetch existing members on mount to check workspace duplicates
  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const data = await apiFetch('/auth/members');
        if (data.members) {
          const emails = new Set<string>(
            data.members.map((m: any) => m.email.toLowerCase().trim())
          );
          setExistingEmails(emails);
        }
      } catch (err) {
        console.error('Failed to fetch existing members:', err);
      }
    };
    fetchExistingMembers();
  }, []);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Member Name': 'John Doe',
        'Enterprise Email': 'john.doe@company.com',
        'Designation': 'Maintenance Engineer',
        'Department': 'Operations',
        'System Role': 'Employee',
        'Status': 'Active',
        'Phone Number': '+1 555-0192',
        'Employee ID': 'EMP-1001',
        'Office Location': 'Building A - Plant 1',
        'Reporting Manager': 'Jane Smith',
        'Profile Photo URL': '',
        'Notes': 'Specialist in centrifugal pumps'
      },
      {
        'Member Name': 'Sarah Connor',
        'Enterprise Email': 'sarah.connor@company.com',
        'Designation': 'Safety Inspector',
        'Department': 'Safety',
        'System Role': 'Admin',
        'Status': 'Active',
        'Phone Number': '+1 555-0198',
        'Employee ID': 'EMP-1002',
        'Office Location': 'Main HQ',
        'Reporting Manager': 'Director Ops',
        'Profile Photo URL': '',
        'Notes': 'Lead OSHA Compliance Auditor'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto width for columns
    worksheet['!cols'] = [
      { wch: 20 }, // Member Name
      { wch: 28 }, // Enterprise Email
      { wch: 22 }, // Designation
      { wch: 18 }, // Department
      { wch: 15 }, // System Role
      { wch: 12 }, // Status
      { wch: 16 }, // Phone Number
      { wch: 14 }, // Employee ID
      { wch: 22 }, // Office Location
      { wch: 20 }, // Reporting Manager
      { wch: 25 }, // Profile Photo URL
      { wch: 30 }  // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members Import Template');
    XLSX.writeFile(workbook, 'SamiQ_Workspace_Members_Import_Template.xlsx');
  };

  // Helper to extract field case-insensitively
  const getFieldValue = (row: RawImportRow, keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
    }
    // Search by partial match if needed
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const targetLower = key.toLowerCase().replace(/[^a-z]/g, '');
      const matchKey = rowKeys.find(
        k => k.toLowerCase().replace(/[^a-z]/g, '') === targetLower
      );
      if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
        return String(row[matchKey]).trim();
      }
    }
    return '';
  };

  // Validate and parse raw spreadsheet rows
  const processSpreadsheet = (rawRows: RawImportRow[]) => {
    const fileEmailsSeen = new Set<string>();
    const processed: ProcessedRow[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Row index (1 is header)

      const name = getFieldValue(row, ['Member Name', 'Name', 'Full Name']);
      const email = getFieldValue(row, ['Enterprise Email', 'Email', 'Email Address']).toLowerCase();
      const designation = getFieldValue(row, ['Designation', 'Title', 'Role Title']) || 'Maintenance Engineer';
      const department = getFieldValue(row, ['Department', 'Dept']) || 'Operations';
      const rawRole = getFieldValue(row, ['System Role', 'Role']) || 'Employee';
      const rawStatus = getFieldValue(row, ['Status', 'Account Status']) || 'Active';

      const phoneNumber = getFieldValue(row, ['Phone Number', 'Phone', 'Mobile']);
      const employeeId = getFieldValue(row, ['Employee ID', 'Emp ID', 'ID']);
      const officeLocation = getFieldValue(row, ['Office Location', 'Location']);
      const reportingManager = getFieldValue(row, ['Reporting Manager', 'Manager']);
      const profilePhoto = getFieldValue(row, ['Profile Photo URL', 'Photo URL', 'Avatar']);
      const notes = getFieldValue(row, ['Notes', 'Comments']);

      const errors: string[] = [];

      // Validate required fields
      if (!name) errors.push('Missing required field: Member Name');
      if (!email) {
        errors.push('Missing required field: Enterprise Email');
      } else {
        // Validate email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push('Invalid email format');
        }
      }

      // System Role validation
      let normalizedRole: 'Admin' | 'Employee' = 'Employee';
      if (rawRole.toLowerCase().includes('admin')) {
        normalizedRole = 'Admin';
      } else if (rawRole.toLowerCase().includes('employee') || rawRole.toLowerCase().includes('member') || rawRole.toLowerCase().includes('user')) {
        normalizedRole = 'Employee';
      } else if (rawRole) {
        errors.push(`Invalid role "${rawRole}". Must be Admin or Employee.`);
      }

      // Status validation
      let normalizedStatus: 'Active' | 'Inactive' | 'Pending' = 'Active';
      const statusLower = rawStatus.toLowerCase();
      if (statusLower.includes('active')) {
        normalizedStatus = 'Active';
      } else if (statusLower.includes('inactive') || statusLower.includes('disabled')) {
        normalizedStatus = 'Inactive';
      } else if (statusLower.includes('pending')) {
        normalizedStatus = 'Pending';
      } else if (rawStatus) {
        errors.push(`Invalid status "${rawStatus}". Must be Active, Inactive, or Pending.`);
      }

      // Check duplicates within file
      let isDuplicate = false;
      if (email) {
        if (fileEmailsSeen.has(email)) {
          isDuplicate = true;
          errors.push('Duplicate email entry found within this file.');
        } else {
          fileEmailsSeen.add(email);
        }

        // Check duplicates with existing workspace members
        if (existingEmails.has(email)) {
          isDuplicate = true;
          errors.push('Member email already exists in this workspace.');
        }
      }

      const isValid = errors.length === 0;

      processed.push({
        rowNum,
        name,
        email,
        designation,
        department,
        role: normalizedRole,
        status: normalizedStatus,
        phoneNumber,
        employeeId,
        officeLocation,
        reportingManager,
        profilePhoto,
        notes,
        isValid,
        isDuplicate,
        errors
      });
    });

    setRows(processed);
    setCurrentStep(2); // Move to validation step
  };

  // Read uploaded file (xlsx, xls, csv)
  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: RawImportRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processSpreadsheet(jsonRows);
      } catch (err) {
        alert('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
        console.error(err);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = () => {
    setIsDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Remove individual row from validation table
  const handleRemoveRow = (rowNum: number) => {
    setRows(prev => prev.filter(r => r.rowNum !== rowNum));
  };

  // Quick action: Remove all invalid/duplicate rows
  const handleRemoveInvalidRows = () => {
    setRows(prev => prev.filter(r => r.isValid && !r.isDuplicate));
  };

  // Submit valid records to backend
  const handleExecuteImport = async () => {
    const validRows = rows.filter(r => r.isValid && !r.isDuplicate);
    if (validRows.length === 0) {
      alert('No valid records available to import.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payloadMembers = validRows.map(r => ({
      name: r.name,
      email: r.email,
      designation: r.designation,
      department: r.department,
      role: r.role.toLowerCase(),
      status: r.status,
      phoneNumber: r.phoneNumber,
      employeeId: r.employeeId,
      officeLocation: r.officeLocation,
      reportingManager: r.reportingManager,
      profilePhoto: r.profilePhoto,
      notes: r.notes
    }));

    try {
      const res = await apiFetch('/auth/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ members: payloadMembers })
      });

      const invalidCount = rows.filter(r => !r.isValid && !r.isDuplicate).length;
      const totalDuplicateCount = rows.filter(r => r.isDuplicate).length + (res.duplicateCount || 0);

      setResultSummary({
        importedCount: res.importedCount || validRows.length,
        duplicateCount: totalDuplicateCount,
        ignoredCount: invalidCount
      });

      setCurrentStep(4); // Move to Success screen
    } catch (err: any) {
      setSubmitError(err.message || 'Bulk import request failed.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics summary calculation
  const totalRecords = rows.length;
  const validRecords = rows.filter(r => r.isValid && !r.isDuplicate).length;
  const duplicateRecords = rows.filter(r => r.isDuplicate).length;
  const invalidRecords = rows.filter(r => !r.isValid && !r.isDuplicate).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Left Navigation Link */}
      <div>
        <button
          onClick={() => navigate('/dashboard/members')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-dark-muted hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Members</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-dark-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Import Workspace Members</h1>
          <p className="text-xs text-dark-muted mt-1 max-w-2xl leading-relaxed">
            Import multiple workspace members at once using our Excel template. Download the template, fill in the required information, and upload it to quickly onboard your team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl border border-accent-teal/30 bg-accent-teal/10 hover:bg-accent-teal/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-glow-teal"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="glassmorphism p-4 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${currentStep === 1 ? 'bg-accent-teal text-[#ffffff] shadow-glow-teal' : 'text-dark-muted'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 1 ? 'bg-black/20 text-[#ffffff]' : 'bg-dark-border/40 text-dark-muted'}`}>1</span>
          <span className={currentStep === 1 ? 'text-[#ffffff]' : ''}>Download & Upload</span>
        </div>
        <div className="w-8 h-0.5 bg-dark-border shrink-0"></div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${currentStep === 2 ? 'bg-accent-teal text-[#ffffff] shadow-glow-teal' : 'text-dark-muted'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 2 ? 'bg-black/20 text-[#ffffff]' : 'bg-dark-border/40 text-dark-muted'}`}>2</span>
          <span className={currentStep === 2 ? 'text-[#ffffff]' : ''}>Validate Data</span>
        </div>
        <div className="w-8 h-0.5 bg-dark-border shrink-0"></div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${currentStep === 3 ? 'bg-accent-teal text-[#ffffff] shadow-glow-teal' : 'text-dark-muted'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 3 ? 'bg-black/20 text-[#ffffff]' : 'bg-dark-border/40 text-dark-muted'}`}>3</span>
          <span className={currentStep === 3 ? 'text-[#ffffff]' : ''}>Import Summary</span>
        </div>
        <div className="w-8 h-0.5 bg-dark-border shrink-0"></div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${currentStep === 4 ? 'bg-emerald-500 text-[#ffffff] shadow-lg' : 'text-dark-muted'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 4 ? 'bg-black/20 text-[#ffffff]' : 'bg-dark-border/40 text-dark-muted'}`}>4</span>
          <span className={currentStep === 4 ? 'text-[#ffffff]' : ''}>Success</span>
        </div>
      </div>

      {/* STEP 1: Download & Upload */}
      {currentStep === 1 && (
        <div className="grid md:grid-cols-12 gap-8">
          {/* Step 1 Instructions */}
          <div className="md:col-span-5 glassmorphism p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-dark-border pb-4">
              <FileSpreadsheet className="w-5 h-5 text-accent-teal" />
              <h2 className="text-base font-extrabold text-white">Step 1 — Download Template</h2>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-dark-muted leading-relaxed">
                Download our standardized spreadsheet template. It contains pre-configured columns and formatting sample rows to ensure seamless data mapping.
              </p>

              <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider text-[10px]">Required Columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Member Name', 'Enterprise Email', 'Designation', 'Department', 'System Role', 'Status'].map(col => (
                    <span key={col} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-teal/10 border border-accent-teal/30 text-accent-teal">
                      {col} *
                    </span>
                  ))}
                </div>

                <p className="text-xs font-bold text-white uppercase tracking-wider text-[10px] pt-2">Optional Profile Columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Phone Number', 'Employee ID', 'Office Location', 'Reporting Manager', 'Profile Photo URL', 'Notes'].map(col => (
                    <span key={col} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-dark-card border border-dark-border text-dark-muted">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accent-teal/5 border border-accent-teal/20 text-accent-teal">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Only the required columns are mandatory. Optional fields will be stored in the member profile if provided.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-[#ffffff] text-xs font-bold shadow-glow-teal flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-[#ffffff]" />
                <span className="text-[#ffffff]">Download Sample Template (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Step 2 Upload File */}
          <div className="md:col-span-7 glassmorphism p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-dark-border pb-4">
              <UploadCloud className="w-5 h-5 text-accent-teal" />
              <h2 className="text-base font-extrabold text-white">Step 2 — Upload File</h2>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] ${
                isDragActive
                  ? 'border-accent-teal bg-accent-teal/10 shadow-glow-teal'
                  : 'border-dark-border bg-dark-bg/60 hover:border-accent-teal/50 hover:bg-dark-card/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-accent-teal animate-spin" />
                  <p className="text-xs font-bold text-white">Parsing and validating spreadsheet data...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-accent-teal mb-4">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    Drag & Drop your spreadsheet here, or <span className="text-accent-teal underline">Browse File</span>
                  </p>
                  <p className="text-xs text-dark-muted mt-2">
                    Supported formats: <span className="text-white font-semibold">.xlsx, .xls, .csv</span> (Max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Validate Data Table */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Controls for Step 2 */}
          <div className="glassmorphism p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-accent-teal" />
                <h2 className="text-lg font-extrabold text-white">Step 3 — Validate Data</h2>
              </div>
              <p className="text-xs text-dark-muted mt-1">
                Review parsed spreadsheet records. Fix or remove invalid entries before completing the workspace import.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {invalidRecords > 0 || duplicateRecords > 0 ? (
                <button
                  onClick={handleRemoveInvalidRows}
                  className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Invalid & Duplicate Rows ({invalidRecords + duplicateRecords})</span>
                </button>
              ) : null}

              <button
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-2 rounded-xl border border-dark-border bg-dark-bg text-dark-muted hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                Re-upload File
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                disabled={validRecords === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue disabled:opacity-50 text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glassmorphism p-4 rounded-xl border-l-4 border-l-sky-500">
              <p className="text-[10px] font-bold text-dark-muted uppercase">Total Records</p>
              <p className="text-2xl font-extrabold text-white mt-1">{totalRecords}</p>
            </div>
            <div className="glassmorphism p-4 rounded-xl border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">Valid Records</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{validRecords}</p>
            </div>
            <div className="glassmorphism p-4 rounded-xl border-l-4 border-l-amber-500">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Duplicate Records</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{duplicateRecords}</p>
            </div>
            <div className="glassmorphism p-4 rounded-xl border-l-4 border-l-rose-500">
              <p className="text-[10px] font-bold text-rose-400 uppercase">Invalid Records</p>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{invalidRecords}</p>
            </div>
          </div>

          {/* Detailed Validation Table */}
          <div className="glassmorphism rounded-2xl overflow-hidden shadow-xl border border-dark-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-card/60 text-dark-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-6">Row #</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Enterprise Email</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Validation Status</th>
                    <th className="py-3.5 px-4">Validation Notes</th>
                    <th className="py-3.5 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 font-sans">
                  {rows.map((r) => (
                    <tr
                      key={r.rowNum}
                      className={`transition-all ${
                        !r.isValid
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : r.isDuplicate
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : 'hover:bg-dark-border/20'
                      }`}
                    >
                      <td className="py-3.5 pl-6 font-mono text-dark-muted font-bold">#{r.rowNum}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{r.name || <span className="text-rose-400 italic">Missing</span>}</td>
                      <td className="py-3.5 px-4 font-mono text-dark-muted">{r.email || <span className="text-rose-400 italic">Missing</span>}</td>
                      <td className="py-3.5 px-4 text-dark-muted">{r.designation}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-dark-bg border border-dark-border text-teal-300">
                          {r.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.isValid && !r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-dark-muted">
                        {r.errors.length > 0 ? (
                          <div className="space-y-0.5">
                            {r.errors.map((err, idx) => (
                              <p key={idx} className="text-[11px] text-rose-400 font-medium">{err}</p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400">Ready to import</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <button
                          onClick={() => handleRemoveRow(r.rowNum)}
                          className="p-1.5 rounded-lg border border-dark-border hover:border-rose-500/50 hover:bg-rose-500/10 text-dark-muted hover:text-rose-400 transition-all cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Import Summary & Confirmation */}
      {currentStep === 3 && (
        <div className="max-w-3xl mx-auto glassmorphism p-8 rounded-2xl space-y-8 animate-fade-in">
          <div className="border-b border-dark-border pb-4">
            <h2 className="text-xl font-extrabold text-white">Step 4 — Import Summary</h2>
            <p className="text-xs text-dark-muted mt-1">
              Review your import configuration before executing workspace member onboarding.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border text-center">
              <p className="text-[10px] font-bold text-dark-muted uppercase">Total Uploaded</p>
              <p className="text-2xl font-extrabold text-white mt-1">{totalRecords}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">Valid to Import</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{validRecords}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Duplicates (Skip)</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{duplicateRecords}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase">Invalid (Ignore)</p>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{invalidRecords}</p>
            </div>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-dark-border">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-dark-border bg-dark-card hover:bg-dark-border/40 text-dark-muted hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              Cancel / Back to Validation
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={submitting || validRecords === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-white text-xs font-bold shadow-glow-teal flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Members...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {validRecords} Members</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {currentStep === 4 && (
        <div className="max-w-2xl mx-auto glassmorphism p-10 rounded-2xl text-center space-y-6 animate-scale-up border border-emerald-500/30">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Members Imported Successfully</h2>
            <p className="text-xs text-dark-muted mt-2">
              Your workspace directory has been updated with the new team member profiles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-dark-bg/80 border border-dark-border max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Imported Successfully:</span>
              <span>{resultSummary.importedCount} members</span>
            </div>
            {resultSummary.duplicateCount > 0 && (
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>Duplicate Records Skipped:</span>
                <span>{resultSummary.duplicateCount} records</span>
              </div>
            )}
            {resultSummary.ignoredCount > 0 && (
              <div className="flex items-center justify-between text-rose-400 font-bold">
                <span>Invalid Records Ignored:</span>
                <span>{resultSummary.ignoredCount} records</span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate('/dashboard/members')}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-white text-xs font-bold shadow-glow-teal cursor-pointer transition-all"
            >
              Return to Workspace Members
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportMembersPage;
