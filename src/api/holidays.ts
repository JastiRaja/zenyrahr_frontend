import api from "./axios";

export type HolidayType = "GENERAL" | "OPTIONAL";

export interface HolidayPayload {
  date: string;
  name: string;
  type: HolidayType;
  year: number;
}

export interface Holiday extends HolidayPayload {
  id: number;
}

export const getHolidays = async (year: number, organizationId?: number): Promise<Holiday[]> => {
  const response = await api.get("/api/admin/holidays", { params: { year, organizationId } });
  return response.data ?? [];
};

export const getPublicHolidays = async (year: number, organizationId?: number): Promise<Holiday[]> => {
  const response = await api.get("/api/holidays", { params: { year, organizationId } });
  return response.data ?? [];
};

export const addHolidays = async (holidays: HolidayPayload[], organizationId?: number): Promise<Holiday[]> => {
  const response = await api.post("/api/admin/holidays/bulk", holidays, { params: { organizationId } });
  return response.data ?? [];
};

export const deleteHoliday = async (id: number, organizationId?: number): Promise<void> => {
  await api.delete(`/api/admin/holidays/${id}`, { params: { organizationId } });
};