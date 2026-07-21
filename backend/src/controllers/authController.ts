import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { userRepository, activityLogRepository, organizationRepository } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { uploadFileToSupabase, PROFILES_BUCKET } from '../services/supabaseService';

const JWT_SECRET = process.env.JWT_SECRET || 'samiq-jwt-secret-key-12345';
const JWT_EXPIRES_IN = '24h';

// Helper to process profile photo input (upload base64 images to Supabase Storage)
const processProfilePhoto = async (photoInput?: string, userIdHint?: string): Promise<string | undefined> => {
  if (!photoInput) return undefined;
  if (typeof photoInput === 'string' && photoInput.startsWith('data:image/')) {
    const match = photoInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.split('/')[1] || 'png';
      return await uploadFileToSupabase({
        buffer,
        fileName: `avatar_${userIdHint || Date.now()}_${Date.now()}.${ext}`,
        mimeType,
        bucket: PROFILES_BUCKET
      });
    }
  }
  return photoInput;
};

// Login Validation Schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

export const login = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validate Input
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    // 2. Find User using repository
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        orgId: user.orgId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5. Log User Activity (in the background) using repository
    await activityLogRepository.create({
      userId: user.id,
      action: 'LOGIN',
      metadata: { email: user.email, role: user.role },
      orgId: user.orgId
    }).catch(err => console.error('Failed to write login activity log:', err));

    // 5.5 Update hasLoggedIn flag to true if not already set
    if (!user.hasLoggedIn) {
      await userRepository.update(user.id, { hasLoggedIn: true });
    }

    // 6. Return response
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const fullUser = await userRepository.findById(req.user.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({ user: fullUser });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const signup = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      industryType,
      companySize,
      adminName,
      email,
      password,
      addressLine1,
      addressLine2,
      zipCode,
      country,
      state,
      city,
      logo
    } = req.body;

    if (!companyName || !adminName || !email || !password || !addressLine1 || !country || !state || !city) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // 1. Create Organization
    const org = await organizationRepository.create({
      name: companyName,
      industryType,
      companySize,
      addressLine1,
      addressLine2,
      zipCode,
      country,
      state,
      city,
      logo
    });

    // 2. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userRepository.create({
      name: adminName,
      email,
      password: hashedPassword,
      role: 'admin',
      orgId: org.id
    });

    return res.status(201).json({
      message: 'Workspace registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        orgId: newUser.orgId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      dob, 
      phoneNumber, 
      designation, 
      department, 
      profilePhoto, 
      notes,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      zipCode
    } = req.body;
    if (!name || !email || !password || !role || !designation || !department) {
      return res.status(400).json({ error: 'Please provide all required fields: name, email, password, role, designation, and department.' });
    }

    if (!addressLine1 || !country || !state || !city) {
      return res.status(400).json({ error: 'Please provide all required address details: Address Line 1, Country, State, and City.' });
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uploadedPhotoUrl = await processProfilePhoto(profilePhoto);

    const newMember = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'employee',
      orgId: admin.orgId,
      dob: (dob && dob.trim()) ? dob : undefined,
      phoneNumber: phoneNumber || undefined,
      designation,
      department,
      profilePhoto: uploadedPhotoUrl || undefined,
      notes: notes || undefined,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      country,
      state,
      city,
      zipCode: zipCode || undefined
    });

    // Log Activity
    await activityLogRepository.create({
      userId: admin.id,
      action: 'ADD_MEMBER',
      targetId: newMember.id,
      metadata: { email: newMember.email },
      orgId: admin.orgId
    }).catch(err => console.error('Failed to log member creation:', err));

    return res.status(201).json({
      message: 'Workspace member added successfully',
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        createdAt: newMember.createdAt,
        designation: newMember.designation,
        department: newMember.department
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const members = await userRepository.findByOrgId(admin.orgId || '');
    const filtered = members.map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      createdAt: e.createdAt,
      dob: e.dob,
      phoneNumber: e.phoneNumber,
      designation: e.designation,
      department: e.department,
      profilePhoto: e.profilePhoto,
      notes: e.notes,
      addressLine1: e.addressLine1,
      addressLine2: e.addressLine2,
      country: e.country,
      state: e.state,
      city: e.city,
      zipCode: e.zipCode,
      hasLoggedIn: e.hasLoggedIn,
      status: e.status || 'Active',
      employeeId: e.employeeId,
      officeLocation: e.officeLocation,
      reportingManager: e.reportingManager
    }));

    return res.status(200).json({ members: filtered });
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const userToEdit = await userRepository.findById(id);
    if (!userToEdit || userToEdit.orgId !== admin.orgId) {
      return res.status(404).json({ error: 'Member not found in your organization.' });
    }

    const { 
      name, 
      email, 
      role, 
      dob, 
      phoneNumber, 
      designation, 
      department, 
      profilePhoto, 
      notes,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      zipCode
    } = req.body;

    const uploadedPhotoUrl = await processProfilePhoto(profilePhoto, id);

    const updated = await userRepository.update(id, {
      name,
      email,
      role,
      dob,
      phoneNumber,
      designation,
      department,
      profilePhoto: uploadedPhotoUrl !== undefined ? uploadedPhotoUrl : userToEdit.profilePhoto,
      notes,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      zipCode
    });

    return res.status(200).json({ message: 'Workspace member updated successfully', member: updated });
  } catch (error) {
    console.error('Update member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const userToDelete = await userRepository.findById(id);
    if (!userToDelete || userToDelete.orgId !== admin.orgId) {
      return res.status(404).json({ error: 'Member not found in your organization.' });
    }

    if (userToDelete.id === admin.id) {
      return res.status(400).json({ error: 'You cannot delete yourself.' });
    }

    await userRepository.delete(id);
    return res.status(200).json({ message: 'Workspace member deleted successfully.' });
  } catch (error) {
    console.error('Delete member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const org = await organizationRepository.findById(admin.orgId || '');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    return res.status(200).json({ organization: org });
  } catch (error) {
    console.error('Get organization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updateFields = req.body;
    if (updateFields.name && !updateFields.name.trim()) {
      return res.status(400).json({ error: 'Organization name cannot be empty.' });
    }

    const updated = await organizationRepository.update(admin.orgId || '', updateFields);
    if (!updated) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Log Activity
    await activityLogRepository.create({
      userId: admin.id,
      action: 'UPDATE_ORGANIZATION',
      targetId: updated.id,
      metadata: { name: updated.name },
      orgId: admin.orgId
    }).catch(err => console.error('Failed to log organization update:', err));

    return res.status(200).json({
      message: 'Organization updated successfully',
      organization: updated
    });
  } catch (error) {
    console.error('Update organization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let photoUrl: string | undefined;

    if (req.file) {
      photoUrl = await uploadFileToSupabase({
        filePath: req.file.path,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        bucket: PROFILES_BUCKET
      });
    } else if (req.body.profilePhoto) {
      const inputPhoto = req.body.profilePhoto;
      if (typeof inputPhoto === 'string' && inputPhoto.startsWith('data:image/')) {
        const match = inputPhoto.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = mimeType.split('/')[1] || 'png';
          photoUrl = await uploadFileToSupabase({
            buffer,
            fileName: `avatar_${currentUser.id}_${Date.now()}.${ext}`,
            mimeType,
            bucket: PROFILES_BUCKET
          });
        } else {
          photoUrl = inputPhoto;
        }
      } else {
        photoUrl = inputPhoto;
      }
    }

    if (!photoUrl) {
      return res.status(400).json({ error: 'Profile photo file or photo URL is required.' });
    }

    const updated = await userRepository.update(currentUser.id, { profilePhoto: photoUrl });
    return res.status(200).json({ message: 'Profile photo updated successfully', user: updated });
  } catch (error) {
    console.error('Update profile photo error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkAddMembers = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'No members data provided for bulk import.' });
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let ignoredCount = 0;
    const createdMembers = [];

    const defaultHashedPassword = await bcrypt.hash('Welcome@SamiQ123', 10);

    for (const item of members) {
      if (!item.email || !item.name) {
        ignoredCount++;
        continue;
      }

      const existingUser = await userRepository.findByEmail(item.email.trim());
      if (existingUser) {
        duplicateCount++;
        continue;
      }

      const role = (item.role && item.role.toLowerCase() === 'admin') ? 'admin' : 'employee';
      const status = (item.status && ['Active', 'Inactive', 'Pending'].includes(item.status)) ? item.status : 'Active';

      const newMember = await userRepository.create({
        name: item.name.trim(),
        email: item.email.trim().toLowerCase(),
        password: defaultHashedPassword,
        role,
        orgId: admin.orgId,
        designation: item.designation || 'Maintenance Engineer',
        department: item.department || 'Operations',
        status,
        phoneNumber: item.phoneNumber || undefined,
        employeeId: item.employeeId || undefined,
        officeLocation: item.officeLocation || undefined,
        reportingManager: item.reportingManager || undefined,
        profilePhoto: item.profilePhoto || undefined,
        notes: item.notes || undefined
      });

      createdMembers.push(newMember);
      importedCount++;
    }

    // Log Activity
    await activityLogRepository.create({
      userId: admin.id,
      action: 'BULK_IMPORT_MEMBERS',
      metadata: { importedCount, duplicateCount, ignoredCount },
      orgId: admin.orgId
    }).catch(err => console.error('Failed to log bulk member creation:', err));

    return res.status(201).json({
      message: `${importedCount} members imported successfully.`,
      importedCount,
      duplicateCount,
      ignoredCount,
      members: createdMembers
    });
  } catch (error) {
    console.error('Bulk add members error:', error);
    return res.status(500).json({ error: 'Internal server error during bulk import' });
  }
};


