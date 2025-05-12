export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export interface Performance {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  rating: number;
  feedback: string;
  goals: string[];
}

export interface Training {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  participants: string[];
}