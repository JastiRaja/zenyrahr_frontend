import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";

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
          api.get(`/api/leave-types`),
          api.get(`/api/leave-balances/employee/${user.id}`),
        ]);

        const leaveTypesData = leaveTypesResponse.data;
        const leaveBalancesData = leaveBalancesResponse.data;

        setLeaveTypes(leaveTypesData);

        const userBalances = Array.isArray(leaveBalancesData) ? leaveBalancesData : [];

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {error && (
        <p className="text-red-600 bg-red-100 p-4 rounded-md">{error}</p>
      )}
      {Array.isArray(leaveTypes) && leaveTypes.map((type) => {
        // If balance record is missing, treat it as full default balance.
        const currentBalance = leaveBalances[type.name] ?? type.defaultBalance;
        const usedBalance = Math.max(0, type.defaultBalance - currentBalance); // Ensure used balance is not negative

        return (
          <div
            key={type.id}
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center">
              <div className="rounded-md bg-sky-100 p-2.5 text-sky-700">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {type.name} Balance
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  {currentBalance} days
                </p>
              </div>
            </div>
            {!hideSecondRow && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">
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
