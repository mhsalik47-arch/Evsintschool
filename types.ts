
export type PaymentMode = 'Cash' | 'Bank' | 'UPI' | 'Check';
export type IncomeSource = 'Investment' | 'Loan' | 'Donation' | 'Other';
export type ExpenseCategory = 'Masonry' | 'Plumbing' | 'Paint' | 'Furniture' | 'Electric' | 'Material' | 'Transport' | 'Food' | 'Other';
export type ExpenseSubCategory = 'Karigar' | 'Majdoor' | 'Material' | 'Vendor' | 'Other';
export type Partner = 'Master Muzahir' | 'Dr. Salik' | 'Other';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half-Day';

export interface Income {
  id: string;
  date: string;
  amount: number;
  source: IncomeSource;
  paidBy: Partner;
  mode: PaymentMode;
  remarks: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  subCategory: ExpenseSubCategory;
  itemDetail?: string; // For specific items like Cement, Bricks etc.
  paidTo: string;
  mode: PaymentMode;
  notes: string;
}

export interface Labour {
  id: string;
  name: string;
  mobile: string;
  type: string; // Dynamically populated based on category
  category: ExpenseCategory; 
  dailyWage: number;
}

export interface Attendance {
  id: string;
  labourId: string;
  date: string;
  status: AttendanceStatus;
  overtimeHours: number;
}

export interface LabourPayment {
  id: string;
  labourId: string;
  date: string;
  amount: number;
  type: 'Advance' | 'Full Payment';
  mode: PaymentMode;
}

export interface Settings {
  schoolName: string;
  location: string;
  logo?: string; // Base64 string for the logo
  estimatedBudget: number;
  categoryBudgets: Record<string, number>;
  language: 'en' | 'hi';
}
