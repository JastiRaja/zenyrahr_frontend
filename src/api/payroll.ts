import axiosInstance from './axios';
import axios from 'axios';

export interface Payslip {
  id: number;
  employeeId: number;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdAt: string;
}

export interface Attendance {
  id?: number;
  employeeId: number;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInLocationLabel?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutLocationLabel?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'CHECKED_IN' | string;
  remarks?: string;
}

export interface PunchPayload {
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
}

export interface Payscale {
  id: number;
  employeeId: number;
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Employee {
  id: number;
  code?: string;
  firstName: string;
  lastName: string;
  email: string;
  bankDetails?: any;
  username: string;
  role: string;
  department: string;
  designation?: string;
  organization?: {
    id: number;
    name: string;
    address?: string;
    logoUrl?: string;
  } | null;
  joinDate: string;
  status?: string;
}

export class PayrollError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'PayrollError';
  }
}

// Payslip APIs
export const getPayslips = async (employeeId?: number): Promise<Payslip[]> => {
  try {
    const response = await axiosInstance.get('/api/payroll/payslips', {
      params: { employeeId }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to fetch payslips',
        error.response.status
      );
    }
    throw new PayrollError('Failed to fetch payslips');
  }
};

export const downloadPayslip = async (payslipId: number): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(`/api/payroll/payslips/${payslipId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to download payslip',
        error.response.status
      );
    }
    throw new PayrollError('Failed to download payslip');
  }
};

// Attendance APIs
export const getAttendance = async (employeeId: number, month: string, year: number): Promise<Attendance[]> => {
  try {
    const response = await axiosInstance.get('/api/payroll/attendance', {
      params: { employeeId, month, year }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to fetch attendance',
        error.response.status
      );
    }
    throw new PayrollError('Failed to fetch attendance');
  }
};

export const addAttendance = async (attendance: Omit<Attendance, 'id'>): Promise<Attendance> => {
  try {
    const response = await axiosInstance.post('/api/payroll/attendance', attendance);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to add attendance',
        error.response.status
      );
    }
    throw new PayrollError('Failed to add attendance');
  }
};

export const updateAttendance = async (id: number, attendance: Partial<Attendance>): Promise<Attendance> => {
  try {
    const response = await axiosInstance.put(`/api/payroll/attendance/${id}`, attendance);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to update attendance',
        error.response.status
      );
    }
    throw new PayrollError('Failed to update attendance');
  }
};

export const getAllLeaveTypes = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/leave-types');
  return Array.isArray(response.data)
    ? response.data.map((type: any) => type.name)
    : [];
};

export const markBatchAttendance = async (attendanceList: any[]) => {
  await axiosInstance.post('/api/payroll/attendance/batch', attendanceList);
};

export const getTodayAttendance = async (
  employeeId: number
): Promise<Attendance | null> => {
  const response = await axiosInstance.get<Attendance | null>(
    '/api/payroll/attendance/today',
    { params: { employeeId } }
  );
  const data = response.data;
  if (data == null || typeof data !== 'object') {
    return null;
  }
  return data;
};

export const punchInEmployee = async (
  employeeId: number,
  payload: PunchPayload = {}
): Promise<Attendance> => {
  const response = await axiosInstance.post<Attendance>(
    '/api/payroll/attendance/punch-in',
    payload,
    { params: { employeeId } }
  );
  return response.data;
};

export const punchOutEmployee = async (
  employeeId: number,
  payload: PunchPayload = {}
): Promise<Attendance> => {
  const response = await axiosInstance.post<Attendance>(
    '/api/payroll/attendance/punch-out',
    payload,
    { params: { employeeId } }
  );
  return response.data;
};

// Payscale APIs
export const getPayscale = async (employeeId: number): Promise<Payscale> => {
  try {
    const response = await axiosInstance.get(`/api/payscale/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to fetch payscale',
        error.response.status
      );
    }
    throw new PayrollError('Failed to fetch payscale');
  }
};

export const createPayscale = async (payscale: Omit<Payscale, 'id'>): Promise<Payscale> => {
  try {
    const response = await axiosInstance.post('/api/payscale', payscale);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to create payscale',
        error.response.status
      );
    }
    throw new PayrollError('Failed to create payscale');
  }
};

export const updatePayscale = async (id: number, payscale: Omit<Payscale, 'id' | 'employeeId'>): Promise<Payscale> => {
  try {
    const response = await axiosInstance.put(`/api/payscale/${id}`, payscale);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PayrollError(
        error.response.data?.message || 'Failed to update payscale',
        error.response.status
      );
    }
    throw new PayrollError('Failed to update payscale');
  }
};

export const getAllEmployees = async (): Promise<Employee[]> => {
  const response = await axiosInstance.get('/auth/employees');
  return response.data;
}; 