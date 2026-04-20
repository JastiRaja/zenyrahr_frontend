import React from "react";
import { User, Mail, Phone, MapPin } from "lucide-react";

interface PersonalInfoFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    allowEmergencyContactVisibilityToHr: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PersonalInfoForm({
  formData,
  onChange,
}: PersonalInfoFormProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Personal Information
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            First Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              className="block w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="First Name"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Last Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              className="block w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Last Name"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              className="block w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Email"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Phone
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              className="block w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="+91 ----------"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <MapPin className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={onChange}
              className="block w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Full Address"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="allowEmergencyContactVisibilityToHr"
              checked={Boolean(formData.allowEmergencyContactVisibilityToHr)}
              onChange={onChange}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700">
              Allow HR/Org Admin to view my emergency and family contact details for urgent situations.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
