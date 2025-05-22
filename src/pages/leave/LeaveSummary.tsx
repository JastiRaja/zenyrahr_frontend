import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  balance: number;
}

interface LeaveType {
  id: number;
  name: string;
  defaultBalance: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL; // ✅ Fallback

interface LeaveSummaryProps {
  hideSecondRow?: boolean;
}

export default function LeaveSummary({ hideSecondRow }: LeaveSummaryProps) {
  const { user } = useAuth();

  const [leaveBalances, setLeaveBalances] = useState<{ [key: string]: number }>(
    {}
  );
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveData = async () => {
      if (!user?.id) return;

      try {
        const [leaveTypesResponse, leaveBalancesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/leave-types`),
          axios.get(`${API_BASE_URL}/api/leave-balances`),
        ]);

        const leaveTypesData = leaveTypesResponse.data;
        const leaveBalancesData = leaveBalancesResponse.data;

        setLeaveTypes(leaveTypesData);

        const userBalances = Array.isArray(leaveBalancesData) ? leaveBalancesData.filter(
          (balance: LeaveBalance) => balance.employeeId === Number(user.id)
        ) : [];

        const balances: { [key: string]: number } = {};

        userBalances.forEach((balance: LeaveBalance) => {
          const typeName: string | undefined = leaveTypesData.find(
            (type: LeaveType) => type.id === balance.leaveTypeId
          )?.name;
          if (typeName) {
            balances[typeName] = balance.balance;
          }
        });

        // console.log("✅ Final Processed Leave Balances:", balances);
        setLeaveBalances(balances);
      } catch (err) {
        console.error("❌ Error fetching leave data:", err);
        setError("Failed to fetch leave data.");
      }
    };

    fetchLeaveData();
  }, [user?.id]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {error && (
        <p className="text-red-600 bg-red-100 p-4 rounded-md">{error}</p>
      )}
      {Array.isArray(leaveTypes) && leaveTypes.map((type) => {
        const currentBalance = leaveBalances[type.name] || 0;
        const usedBalance = Math.max(0, type.defaultBalance - currentBalance); // Ensure used balance is not negative

        return (
          <div
            key={type.id}
            className="stat-card p-6 bg-white shadow-md rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {type.name} Balance
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentBalance} days
                </p>
              </div>
            </div>
            {!hideSecondRow && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Used: {usedBalance} days
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
