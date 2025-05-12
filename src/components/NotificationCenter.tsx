import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, Plane, FileText, DollarSign, UserPlus, IndianRupee, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface Notification {
  id: number;
  type: 'leave' | 'travel' | 'expense' | 'timesheet' | 'referral';
  title: string;
  message: string;
  timestamp: string;
  status: string;
  isRead: boolean;
}

export default function NotificationCenter({ isOpen, onClose, setNotificationCount }: { isOpen: boolean; onClose: () => void; setNotificationCount: (count: number) => void }) {
  const { user, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Update notification count when notifications change
  useEffect(() => {
    setNotificationCount(notifications.filter(n => !n.isRead).length);
  }, [notifications, setNotificationCount]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const endpoints = [];

      // For managers: show new requests from their team members
      if (hasPermission('approve', 'expenses')) {
        // Recent requests from team members
        endpoints.push(
          axios.get(`${API_BASE_URL}/api/leave-requests/team/${user.id}?status=PENDING`),
          axios.get(`${API_BASE_URL}/api/travel-requests/team/${user.id}?status=PENDING`),
          axios.get(`${API_BASE_URL}/api/expenses/team/${user.id}?status=PENDING`),
          axios.get(`${API_BASE_URL}/api/timesheet/team/${user.id}?status=PENDING`)
        );
      }

      // For HR and admin: show referral requests
      if (hasPermission('read', 'employees')) {
        endpoints.push(axios.get(`${API_BASE_URL}/api/referrals?status=PENDING`));
      }

      // For admin: show first level approved requests and manager leave requests
      if (hasPermission('admin', 'all')) {
        endpoints.push(
          // First level approved requests
          axios.get(`${API_BASE_URL}/api/travel-requests?status=FIRST_LEVEL_APPROVED`),
          axios.get(`${API_BASE_URL}/api/expenses?status=FIRST_LEVEL_APPROVED`),
          // Manager leave requests
          axios.get(`${API_BASE_URL}/api/leave-requests/managers?status=PENDING`)
        );
      }

      const responses = await Promise.all(
        endpoints.map(p => p.catch(error => {
          console.error('Error fetching notifications:', error);
          return { data: [] };
        }))
      );

      let allNotifications: Notification[] = [];

      if (hasPermission('approve', 'expenses')) {
        // Process team member requests for managers
        const [teamLeave, teamTravel, teamExpense, teamTimesheet, ...rest] = responses;
        
        allNotifications = [
          ...processLeaveRequests(teamLeave.data || [], true),
          ...processTravelRequests(teamTravel.data || [], true),
          ...processExpenseRequests(teamExpense.data || [], true),
          ...processTimesheets(teamTimesheet.data || [], true)
        ];

        if (hasPermission('admin', 'all')) {
          // Process admin notifications
          const [firstLevelTravel, firstLevelExpense, managerLeave] = rest;
          
          // Add first level approved requests
          allNotifications = [
            ...allNotifications,
            ...processTravelRequests(firstLevelTravel.data || [], true, 'First level approved travel request from'),
            ...processExpenseRequests(firstLevelExpense.data || [], true, 'First level approved expense from'),
            ...processLeaveRequests(managerLeave.data || [], true, 'Manager leave request from')
          ];
        }
      }

      // Process referral notifications for HR and admin
      if (hasPermission('read', 'employees')) {
        const referralResponse = responses[responses.length - 1];
        allNotifications = [
          ...allNotifications,
          ...processReferralRequests(referralResponse.data || [])
        ];
      }

      // Filter out notifications older than 7 days and sort by timestamp
      allNotifications = allNotifications
        .filter(notification => 
          dayjs(notification.timestamp).isAfter(dayjs().subtract(7, 'day'))
        )
        .sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const processLeaveRequests = (requests: any[], isPending: boolean, customMessage?: string): Notification[] => {
    if (!Array.isArray(requests)) return [];
    return requests
      .filter(req => req && typeof req === 'object')
      .map(req => ({
        id: req.id || Math.random(),
        type: 'leave',
        title: isPending ? 'Leave Request Pending Approval' : 'Leave Request',
        message: customMessage 
          ? `${customMessage} ${req.employee?.firstName || 'Employee'} ${req.employee?.lastName || ''}`
          : isPending 
            ? `${req.employee?.firstName || 'Employee'} ${req.employee?.lastName || ''} requested leave from ${dayjs(req.startDate).format('MMM D')} to ${dayjs(req.endDate).format('MMM D')}`
            : `Your leave request from ${dayjs(req.startDate).format('MMM D')} to ${dayjs(req.endDate).format('MMM D')} is ${(req.status || 'pending').toLowerCase()}`,
        timestamp: req.createdAt || new Date().toISOString(),
        status: req.status || 'PENDING',
        isRead: false
      }));
  };

  const processTravelRequests = (requests: any[], isPending: boolean, customMessage?: string): Notification[] => {
    if (!Array.isArray(requests)) return [];
    return requests
      .filter(req => req && typeof req === 'object')
      .map(req => ({
        id: req.id || Math.random(),
        type: 'travel',
        title: isPending ? 'Travel Request Pending Approval' : 'Travel Request',
        message: customMessage
          ? `${customMessage} ${req.employee?.firstName || 'Employee'} ${req.employee?.lastName || ''}`
          : isPending
            ? `${req.employee?.firstName || 'Employee'} ${req.employee?.lastName || ''} requested travel to ${req.destination || 'destination'}`
            : `Your travel request to ${req.destination || 'destination'} is ${(req.status || 'pending').toLowerCase()}`,
        timestamp: req.createdAt || new Date().toISOString(),
        status: req.status || 'PENDING',
        isRead: false
      }));
  };

  const processExpenseRequests = (requests: any[], isPending: boolean, customMessage?: string): Notification[] => {
    if (!Array.isArray(requests)) return [];
    return requests
      .filter(req => req && typeof req === 'object')
      .map(req => ({
        id: req.id || Math.random(),
        type: 'expense',
        title: isPending ? 'Expense Request Pending Approval' : 'Expense Request',
        message: customMessage
          ? `${customMessage} ${req.employee?.name || 'Employee'} (${req.employee?.department || 'Department'})`
          : isPending
            ? `${req.employee?.name || 'Employee'} (${req.employee?.department || 'Department'}) submitted an expense of ₹${req.amount || 0} for ${req.category || 'Travel'}`
            : `Your expense request of ₹${req.amount || 0} for ${req.category || 'Travel'} is ${(req.firstLevelApprovalStatus || 'pending').toLowerCase()}`,
        timestamp: req.createdAt || req.date || new Date().toISOString(),
        status: req.firstLevelApprovalStatus || 'PENDING',
        isRead: false
      }));
  };

  const processTimesheets = (timesheets: any[], isPending: boolean): Notification[] => {
    if (!Array.isArray(timesheets)) return [];
    return timesheets
      .filter(ts => ts && typeof ts === 'object')
      .map(ts => ({
        id: ts.id || Math.random(),
        type: 'timesheet',
        title: isPending ? 'Timesheet Pending Approval' : 'Timesheet',
        message: isPending
          ? `${ts.employee?.firstName || 'Employee'} ${ts.employee?.lastName || ''} submitted timesheet for ${dayjs(ts.date).format('MMM D')}`
          : `Your timesheet for ${dayjs(ts.date).format('MMM D')} is ${(ts.status || 'pending').toLowerCase()}`,
        timestamp: ts.createdAt || new Date().toISOString(),
        status: ts.status || 'PENDING',
        isRead: false
      }));
  };

  const processReferralRequests = (referrals: any[]): Notification[] => {
    if (!Array.isArray(referrals)) return [];
    return referrals
      .filter(ref => ref && typeof ref === 'object')
      .map(ref => ({
        id: ref.id || Math.random(),
        type: 'referral',
        title: 'New Referral Request',
        message: `${ref.candidateName} was referred by ${ref.referredEmployeeName} for ${ref.recruitment.jobTitle}`,
        timestamp: ref.createdAt || new Date().toISOString(),
        status: ref.status || 'PENDING',
        isRead: false
      }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return Calendar;
      case 'travel':
        return Plane;
      case 'expense':
        return IndianRupee;
      case 'timesheet':
        return FileText;
      case 'referral':
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Close the notification center
    onClose();

    // Navigate based on notification type and data
    switch (notification.type) {
      case 'travel':
        navigate(`/travel`);
        // We'll need to show the travel details modal after navigation
        localStorage.setItem('openTravelDetail', notification.id.toString());
        break;
      
      case 'expense':
        navigate(`/travel`);
        // We'll need to show the expense details modal after navigation
        localStorage.setItem('openExpenseDetail', notification.id.toString());
        break;
      
      case 'leave':
        navigate(`/leave`);
        // We'll need to show the leave details modal after navigation
        localStorage.setItem('openLeaveDetail', notification.id.toString());
        break;
      
      case 'timesheet':
        navigate(`/timesheet`);
        // We'll need to show the timesheet details after navigation
        localStorage.setItem('openTimesheetDetail', notification.id.toString());
        break;

      case 'referral':
        navigate(`/recruitment/referrals`);
        // We'll need to show the referral details after navigation
        localStorage.setItem('openReferralDetail', notification.id.toString());
        break;
    }
  };

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      // Update the notification count in parent
      setNotificationCount(updated.filter(n => !n.isRead).length);
      return updated;
    });
    // Optionally, call API to persist read status here
    // axios.post(`${API_BASE_URL}/api/notifications/${id}/read`)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-1 h-0 overflow-y-auto">
              <div className="py-6 px-4 bg-indigo-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Notifications</h2>
                  <button
                    type="button"
                    className="rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Bell className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-500">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-start justify-between ${notification.isRead ? 'opacity-60' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start flex-1">
                          <div className="flex-shrink-0 pt-0.5">
                            <Icon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-gray-400">
                                {dayjs(notification.timestamp).fromNow()}
                              </p>
                              <span className={`text-xs font-medium ${getStatusColor(notification.status)}`}>
                                {notification.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <button
                            className="ml-4 p-1 rounded-full hover:bg-green-100 text-green-600"
                            title="Mark as Read"
                            onClick={e => { e.stopPropagation(); markAsRead(notification.id); }}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}