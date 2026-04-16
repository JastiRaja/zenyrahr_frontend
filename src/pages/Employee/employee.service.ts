import api from './api';
import { Employee } from '../types/index';

class EmployeeService {
  async createEmployee(employeeData: Partial<Employee>) {
    try {
      const response = await api.post('auth/employees', employeeData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating employee:', error.response?.data || error.message);
      throw error;
    }
  }

  async getEmployee(id: string) {
    try {
      if (!id) {
        throw new Error('Employee ID is required');
      }

      const response = await api.get(`auth/employees/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      if (error.response?.status === 404) {
        throw new Error('Employee not found');
      }
      console.error('Error fetching employee:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateEmployee(id: string, updatedData: Partial<Employee>) {
    try {
      if (!id) {
        throw new Error('Employee ID is required');
      }

      const currentData = await this.getEmployee(id);
      
      const mergedData = {
        ...currentData,
        ...updatedData,
      };

      const response = await api.put(`auth/employees/${id}`, mergedData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      if (error.response?.status === 404) {
        throw new Error('Employee not found');
      }
      console.error('Error updating employee:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadProfilePhoto(id: string, file: File) {
    try {
      if (!id) {
        throw new Error('Employee ID is required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`auth/employees/${id}/profile-picture`, formData);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading profile photo:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteEmployee(id: string) {
    try {
      const response = await api.delete(`auth/employees/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting employee:', error.response?.data || error.message);
      throw error;
    }
  }

  async assignManager(employeeId: string, managerId: string) {
    try {
      const response = await api.post(`/auth/employees/${employeeId}/assign-manager/${managerId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error assigning manager:', error.response?.data || error.message);
      throw error;
    }
  }

  async assignProjects(employeeId: string, projectIds: number[]) {
    try {
      const response = await api.post(`/auth/employees/${employeeId}/assign-projects`, projectIds);
      return response.data;
    } catch (error: any) {
      console.error('Error assigning projects:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAssignedProjects(employeeId: string) {
    try {
      const response = await api.get(`/auth/employees/${employeeId}/projects`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assigned projects:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new EmployeeService();