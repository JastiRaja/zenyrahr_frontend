import api from './api';
import { Employee } from '../types';

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
      // Ensure id is valid
      if (!id) {
        throw new Error('Employee ID is required');
      }

      const response = await api.get(`auth/employees/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching employee:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Unauthorized access. Please log in again.');
      }
      if (error.response?.status === 404) {
        throw new Error('Employee not found');
      }
      throw error;
    }
  }

  async updateEmployee(id: string, updatedData: Partial<Employee>) {
    try {
      // Ensure id is valid
      if (!id) {
        throw new Error('Employee ID is required');
      }

      // First get the current employee data
      const currentData = await this.getEmployee(id);
      
      // Merge the current data with the updates
      const mergedData = {
        ...currentData,
        ...updatedData,
      };

      const response = await api.put(`auth/employees/${id}`, mergedData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating employee:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Unauthorized access. Please log in again.');
      }
      if (error.response?.status === 404) {
        throw new Error('Employee not found');
      }
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