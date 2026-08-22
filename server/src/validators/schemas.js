const { z } = require('zod');

// Authentication schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must not exceed 15 digits'),
  apartmentNumber: z.string().min(1, 'Apartment/Flat number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Complaints schemas
const categoriesList = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift / Elevator',
  'Parking',
  'Water',
  'Maintenance',
  'Other',
];

const createComplaintSchema = z.object({
  category: z.enum(categoriesList, {
    errorMap: () => ({ message: 'Please select a valid complaint category' }),
  }),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
  note: z.string().optional().or(z.literal('')),
});

const updatePrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Invalid priority value' }),
  }),
});

// Notices schemas
const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isImportant: z.boolean().default(false),
});

// Settings schemas
const updateSettingsSchema = z.object({
  complaint_overdue_days: z.preprocess((val) => Number(val), z.number().int().positive('Overdue days must be a positive integer')),
});

module.exports = {
  registerSchema,
  loginSchema,
  createComplaintSchema,
  updateStatusSchema,
  updatePrioritySchema,
  createNoticeSchema,
  updateSettingsSchema,
};
