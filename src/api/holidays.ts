// import api from './axios';

// export const getHolidays = async (year: number) => {
//   try {
//     const response = await api.get(`/api/admin/holidays`, { params: { year } });
//     return response.data;
//   } catch (error) {
//     throw new Error('Failed to fetch holidays. Please try again later.');
//   }
// };

// export const addHolidays = async (holidays: any[]) => {
//   try {
//     const response = await api.post(`/api/admin/holidays/bulk`, holidays);
//     return response.data;
//   } catch (error) {
//     throw new Error('Failed to add holidays. Please try again later.');
//   }
// };

// export const deleteHoliday = async (id: number) => {
//   try {
//     await api.delete(`/api/admin/holidays/${id}`);
//   } catch (error) {
//     throw new Error('Failed to delete holiday. Please try again later.');
//   }
// }; 