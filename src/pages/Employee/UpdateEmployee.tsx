// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { User, GraduationCap, Briefcase, Star, Users, Heart } from 'lucide-react';
// import PhotoUpload from '../Employee/PhotoUpload';
// import PersonalInfoForm from '../Employee/PersonalInfoForm';
// import EducationForm from '../Employee/EducationForm';
// import ExperienceForm from '../Employee/ExperienceForm';
// import SkillsInterestsForm from '../Employee/SkillsInterestsForm';
// import FamilyDetailsForm from '../Employee/FamilyDetailsForm';
// import MedicalRecordsForm from '../Employee/MedicalRecordsForm';
// import employeeService from './employee.service';

// type TabId = 'personal' | 'education' | 'experience' | 'skills' | 'family' | 'medical';

// interface PersonalInfo {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   address: string;
// }

// interface Education {
//   id: number;
//   degree: string;
//   institution: string;
//   year: string;
//   field: string;
// }

// interface Experience {
//   id: number;
//   company: string;
//   position: string;
//   startDate: string;
//   endDate: string;
//   description: string;
// }

// interface FamilyDetail {
//   id: number;
//   name: string;
//   relationship: string;
//   contact: string;
// }

// interface MedicalRecord {
//   id: number;
//   condition: string;
//   date: string;
//   details: string;
// }

// interface FormState {
//   personal: PersonalInfo;
//   photo: File | null;
//   education: Education[];
//   experience: Experience[];
//   skills: string[];
//   interests: string[];
//   familyDetails: FamilyDetail[];
//   medicalRecords: MedicalRecord[];
// }

// const TABS = [
//   { id: 'personal', name: 'Personal Info', icon: User },
//   { id: 'education', name: 'Education', icon: GraduationCap },
//   { id: 'experience', name: 'Experience', icon: Briefcase },
//   { id: 'skills', name: 'Skills & Interests', icon: Star },
//   { id: 'family', name: 'Family Details', icon: Users },
//   { id: 'medical', name: 'Medical Records', icon: Heart },
// ] as const;

// const initialFormState: FormState = {
//   personal: {
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     address: '',
//   },
//   photo: null,
//   education: [{ id: 1, degree: '', institution: '', year: '', field: '' }],
//   experience: [{ id: 1, company: '', position: '', startDate: '', endDate: '', description: '' }],
//   skills: [],
//   interests: [],
//   familyDetails: [{ id: 1, name: '', relationship: '', contact: '' }],
//   medicalRecords: [{ id: 1, condition: '', date: '', details: '' }],
// };

// // Utility function to strip id from new items
// function stripIdFromNewItems<T extends { id?: any }>(array: T[]): Omit<T, 'id'>[] | T[] {
//   return array.map(item => {
//     if (!item.id) {
//       // Remove id property for new items
//       const { id, ...rest } = item;
//       return rest as Omit<T, 'id'>;
//     }
//     return item;
//   });
// }

// const UpdateEmployee: React.FC = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<TabId>('personal');
//   const [loading, setLoading] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [error, setError] = useState('');
//   const [formData, setFormData] = useState<FormState>(initialFormState);

//   const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string };
//   const userId = user?.id;

//   useEffect(() => {
//     const fetchEmployeeData = async () => {
//       if (userId) {
//         try {
//           const data = await employeeService.getEmployee(userId);
//           setFormData({
//             ...initialFormState,
//             ...data,
//             personal: {
//               firstName: data.firstName || '',
//               lastName: data.lastName || '',
//               email: data.email || '',
//               phone: data.phone || '',
//               address: data.address || '',
//             },
//           });
//         } catch (err) {
//           setError('Failed to fetch employee data');
//         }
//       }
//     };

//     fetchEmployeeData();
//   }, [userId]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccessMessage('');

//     try {
//       // Prepare data, stripping id from new items
//       const education = stripIdFromNewItems(formData.education);
//       const experience = stripIdFromNewItems(formData.experience);
//       const familyDetails = stripIdFromNewItems(formData.familyDetails);
//       const medicalRecords = stripIdFromNewItems(formData.medicalRecords);

//       let employeeData: FormData | Record<string, any>;
//       if (formData.photo) {
//         employeeData = new FormData();
//         Object.entries(formData.personal).forEach(([key, value]) => {
//           employeeData.append(key, value);
//         });
//         employeeData.append('photo', formData.photo);
//         employeeData.append('education', JSON.stringify(education));
//         employeeData.append('experience', JSON.stringify(experience));
//         employeeData.append('skills', JSON.stringify(formData.skills));
//         employeeData.append('interests', JSON.stringify(formData.interests));
//         employeeData.append('familyDetails', JSON.stringify(familyDetails));
//         employeeData.append('medicalRecords', JSON.stringify(medicalRecords));
//       } else {
//         employeeData = {
//           ...formData.personal,
//           education,
//           experience,
//           skills: formData.skills,
//           interests: formData.interests,
//           familyDetails,
//           medicalRecords,
//         };
//       }

//       if (userId) {
//         await employeeService.updateEmployee(userId, employeeData);
//         setSuccessMessage('Employee information updated successfully!');
//       } else {
//         setError('User ID not found');
//       }
//     } catch (err) {
//       setError('Failed to update employee information. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateFormData = <K extends keyof FormState>(
//     section: K,
//     data: FormState[K]
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [section]: data,
//     }));
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <>
//             <div className="mb-4">
//               <PhotoUpload
//                 onChange={(e) => {
//                   if (e.target.files?.[0]) {
//                     updateFormData('photo', e.target.files[0]);
//                   }
//                 }}
//               />
//             </div>
//             <PersonalInfoForm
//               formData={formData.personal}
//               onChange={(e) => {
//                 const { name, value } = e.target;
//                 updateFormData('personal', {
//                   ...formData.personal,
//                   [name]: value,
//                 });
//               }}
//             />
//           </>
//         );
//       case 'education':
//         return (
//           <EducationForm
//             education={formData.education}
//             onChange={(id, field, value) => {
//               const updatedEducation = formData.education.map((edu) =>
//                 edu.id === id ? { ...edu, [field]: value } : edu
//               );
//               updateFormData('education', updatedEducation);
//             }}
//             onAdd={() => {
//               const newId =
//                 formData.education.length > 0
//                   ? Math.max(...formData.education.map((edu) => edu.id)) + 1
//                   : 1;
//               updateFormData('education', [
//                 ...formData.education,
//                 { id: newId, degree: '', institution: '', year: '', field: '' },
//               ]);
//             }}
//             onRemove={(id) => {
//               const updatedEducation = formData.education.filter((edu) => edu.id !== id);
//               updateFormData('education', updatedEducation);
//             }}
//           />
//         );
//       case 'experience':
//         return (
//           <ExperienceForm
//             experience={formData.experience}
//             onChange={(id, field, value) => {
//               const updatedExperience = formData.experience.map((exp) =>
//                 exp.id === id ? { ...exp, [field]: value } : exp
//               );
//               updateFormData('experience', updatedExperience);
//             }}
//             onAdd={() => {
//               const newId =
//                 formData.experience.length > 0
//                   ? Math.max(...formData.experience.map((exp) => exp.id)) + 1
//                   : 1;
//               updateFormData('experience', [
//                 ...formData.experience,
//                 { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' },
//               ]);
//             }}
//             onRemove={(id) => {
//               const updatedExperience = formData.experience.filter((exp) => exp.id !== id);
//               updateFormData('experience', updatedExperience);
//             }}
//           />
//         );
//       case 'skills':
//         return (
//           <SkillsInterestsForm
//             skills={formData.skills}
//             interests={formData.interests}
//             onAddSkill={(skill) => updateFormData('skills', [...formData.skills, skill])}
//             onRemoveSkill={(index) =>
//               updateFormData('skills', formData.skills.filter((_, i) => i !== index))
//             }
//             onAddInterest={(interest) =>
//               updateFormData('interests', [...formData.interests, interest])
//             }
//             onRemoveInterest={(index) =>
//               updateFormData('interests', formData.interests.filter((_, i) => i !== index))
//             }
//           />
//         );
//       case 'family':
//         return (
//           <FamilyDetailsForm
//             familyDetails={formData.familyDetails}
//             onChange={(id, field, value) => {
//               const updatedFamilyDetails = formData.familyDetails.map((member) =>
//                 member.id === id ? { ...member, [field]: value } : member
//               );
//               updateFormData('familyDetails', updatedFamilyDetails);
//             }}
//             onAdd={() => {
//               const newId =
//                 formData.familyDetails.length > 0
//                   ? Math.max(...formData.familyDetails.map((member) => member.id)) + 1
//                   : 1;
//               updateFormData('familyDetails', [
//                 ...formData.familyDetails,
//                 { id: newId, name: '', relationship: '', contact: '' },
//               ]);
//             }}
//             onRemove={(id) => {
//               const updatedFamilyDetails = formData.familyDetails.filter(
//                 (member) => member.id !== id
//               );
//               updateFormData('familyDetails', updatedFamilyDetails);
//             }}
//           />
//         );
//       case 'medical':
//         return (
//           <MedicalRecordsForm
//             medicalRecords={formData.medicalRecords}
//             onChange={(id, field, value) => {
//               const updatedMedicalRecords = formData.medicalRecords.map((record) =>
//                 record.id === id ? { ...record, [field]: value } : record
//               );
//               updateFormData('medicalRecords', updatedMedicalRecords);
//             }}
//             onAdd={() => {
//               const newId =
//                 formData.medicalRecords.length > 0
//                   ? Math.max(...formData.medicalRecords.map((record) => record.id)) + 1
//                   : 1;
//               updateFormData('medicalRecords', [
//                 ...formData.medicalRecords,
//                 { id: newId, condition: '', date: '', details: '' },
//               ]);
//             }}
//             onRemove={(id) => {
//               const updatedMedicalRecords = formData.medicalRecords.filter(
//                 (record) => record.id !== id
//               );
//               updateFormData('medicalRecords', updatedMedicalRecords);
//             }}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900">Update Personal Info</h1>
//         <p className="mt-2 text-lg text-gray-600">Enter Your Details Below</p>
//       </div>

//       {error && (
//         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
//           <p className="text-sm text-red-600">{error}</p>
//         </div>
//       )}

//       {successMessage && (
//         <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
//           <p className="text-sm text-green-600">{successMessage}</p>
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8" aria-label="Tabs">
//             {TABS.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
//                     activeTab === tab.id
//                       ? 'border-indigo-500 text-indigo-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   <Icon className="h-5 w-5" />
//                   <span>{tab.name}</span>
//                 </button>
//               );
//             })}
//           </nav>
//         </div>

//         <div className="mt-6">{renderTabContent()}</div>

//         <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//           <button
//             type="button"
//             onClick={() => navigate('/employees')}
//             className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//           >
//             {loading ? 'Updating Employee info...' : 'Update'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default UpdateEmployee;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Briefcase, Star, Users, Heart } from 'lucide-react';
import PhotoUpload from '../Employee/PhotoUpload';
import PersonalInfoForm from '../Employee/PersonalInfoForm';
import EducationForm from '../Employee/EducationForm';
import ExperienceForm from '../Employee/ExperienceForm';
import SkillsInterestsForm from '../Employee/SkillsInterestsForm';
import FamilyDetailsForm from '../Employee/FamilyDetailsForm';
import MedicalRecordsForm from '../Employee/MedicalRecordsForm';
import LoadingButton from '../../components/LoadingButton';
import employeeService from './employee.service';

type TabId = 'personal' | 'education' | 'experience' | 'skills' | 'family' | 'medical';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  allowEmergencyContactVisibilityToHr: boolean;
}

interface Education {
  id: number;
  degree: string;
  institution: string;
  year: string;
  field: string;
}

interface Experience {
  id: number;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface FamilyDetail {
  id: number;
  name: string;
  relationship: string;
  contact: string;
}

interface MedicalRecord {
  id: number;
  condition: string;
  date: string;
  details: string;
}

interface FormState {
  personal: PersonalInfo;
  photo: File | null;
  education: Education[];
  experience: Experience[];
  skills: string[];
  interests: string[];
  familyDetails: FamilyDetail[];
  medicalRecords: MedicalRecord[];
}

const TABS = [
  { id: 'personal', name: 'Personal Info', icon: User },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'experience', name: 'Experience', icon: Briefcase },
  { id: 'skills', name: 'Skills & Interests', icon: Star },
  { id: 'family', name: 'Family Details', icon: Users },
  { id: 'medical', name: 'Medical Records', icon: Heart },
] as const;

const initialFormState: FormState = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    allowEmergencyContactVisibilityToHr: false,
  },
  photo: null,
  education: [{ id: 1, degree: '', institution: '', year: '', field: '' }],
  experience: [{ id: 1, company: '', position: '', startDate: '', endDate: '', description: '' }],
  skills: [],
  interests: [],
  familyDetails: [{ id: 1, name: '', relationship: '', contact: '' }],
  medicalRecords: [{ id: 1, condition: '', date: '', details: '' }],
};

const toAbsoluteMediaUrl = (rawUrl?: string) => {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL_LOCAL || '').replace(/\/+$/, '');
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

// Utility: always drop any `id` key
function stripIds<T extends { id?: any }>(array: T[]): Omit<T, 'id'>[] {
  return array.map(({ id, ...rest }) => rest);
}

const UpdateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string };
  const userId = user?.id;

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (userId) {
        try {
          const data = await employeeService.getEmployee(userId);
          setFormData({
            ...initialFormState,
            ...data,
            personal: {
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              allowEmergencyContactVisibilityToHr: Boolean(data.allowEmergencyContactVisibilityToHr),
            },
          });
          setProfilePhotoUrl(toAbsoluteMediaUrl(data?.documents?.profileImageUrl));
        } catch {
          setError('Failed to fetch employee data');
        }
      }
    };
    fetchEmployeeData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Strip any local `id` keys before sending
      const education = stripIds(formData.education).map(e => ({
        ...e,
        year: Number(e.year),   // ensure numeric type
      }));
      const experience = stripIds(formData.experience);
      const familyDetails = stripIds(formData.familyDetails);
      const medicalRecords = stripIds(formData.medicalRecords);

      const employeeData = {
        ...formData.personal,
        education,
        experience,
        skills: formData.skills,
        interests: formData.interests,
        familyDetails,
        medicalRecords,
      };

      if (userId) {
        if (formData.photo) {
          const uploadResponse = await employeeService.uploadProfilePhoto(userId, formData.photo);
          setProfilePhotoUrl(toAbsoluteMediaUrl(uploadResponse?.fileUrl));
        }
        await employeeService.updateEmployee(userId, employeeData);
        setSuccessMessage('Employee information updated successfully!');
      } else {
        setError('User ID not found');
      }
    } catch {
      setError('Failed to update employee information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = <K extends keyof FormState>(section: K, data: FormState[K]) => {
    setFormData(prev => ({ ...prev, [section]: data }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4">
            <PhotoUpload
              currentPhotoUrl={profilePhotoUrl}
              onChange={e => {
                if (e.target.files?.[0]) {
                  updateFormData('photo', e.target.files[0]);
                }
              }}
            />
            <PersonalInfoForm
              formData={formData.personal}
              onChange={e => {
                const { name, value, type, checked } = e.target;
                updateFormData('personal', {
                  ...formData.personal,
                  [name]: type === 'checkbox' ? checked : value,
                });
              }}
            />
          </div>
        );
      case 'education':
        return (
          <EducationForm
            education={formData.education}
            onChange={(id, field, value) => {
              const updated = formData.education.map(edu =>
                edu.id === id ? { ...edu, [field]: value } : edu
              );
              updateFormData('education', updated);
            }}
            onAdd={() => {
              const newId =
                formData.education.length > 0
                  ? Math.max(...formData.education.map(e => e.id)) + 1
                  : 1;
              updateFormData('education', [
                ...formData.education,
                { id: newId, degree: '', institution: '', year: '', field: '' },
              ]);
            }}
            onRemove={id =>
              updateFormData(
                'education',
                formData.education.filter(e => e.id !== id)
              )
            }
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            experience={formData.experience}
            onChange={(id, field, value) => {
              const updated = formData.experience.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
              );
              updateFormData('experience', updated);
            }}
            onAdd={() => {
              const newId =
                formData.experience.length > 0
                  ? Math.max(...formData.experience.map(e => e.id)) + 1
                  : 1;
              updateFormData('experience', [
                ...formData.experience,
                { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' },
              ]);
            }}
            onRemove={id =>
              updateFormData(
                'experience',
                formData.experience.filter(e => e.id !== id)
              )
            }
          />
        );
      case 'skills':
        return (
          <SkillsInterestsForm
            skills={formData.skills}
            interests={formData.interests}
            onAddSkill={skill => updateFormData('skills', [...formData.skills, skill])}
            onRemoveSkill={i =>
              updateFormData('skills', formData.skills.filter((_, idx) => idx !== i))
            }
            onAddInterest={interest =>
              updateFormData('interests', [...formData.interests, interest])
            }
            onRemoveInterest={i =>
              updateFormData('interests', formData.interests.filter((_, idx) => idx !== i))
            }
          />
        );
      case 'family':
        return (
          <FamilyDetailsForm
            familyDetails={formData.familyDetails}
            onChange={(id, field, value) => {
              const updated = formData.familyDetails.map(mem =>
                mem.id === id ? { ...mem, [field]: value } : mem
              );
              updateFormData('familyDetails', updated);
            }}
            onAdd={() => {
              const newId =
                formData.familyDetails.length > 0
                  ? Math.max(...formData.familyDetails.map(m => m.id)) + 1
                  : 1;
              updateFormData('familyDetails', [
                ...formData.familyDetails,
                { id: newId, name: '', relationship: '', contact: '' },
              ]);
            }}
            onRemove={id =>
              updateFormData(
                'familyDetails',
                formData.familyDetails.filter(m => m.id !== id)
              )
            }
          />
        );
      case 'medical':
        return (
          <MedicalRecordsForm
            medicalRecords={formData.medicalRecords}
            onChange={(id, field, value) => {
              const updated = formData.medicalRecords.map(rec =>
                rec.id === id ? { ...rec, [field]: value } : rec
              );
              updateFormData('medicalRecords', updated);
            }}
            onAdd={() => {
              const newId =
                formData.medicalRecords.length > 0
                  ? Math.max(...formData.medicalRecords.map(r => r.id)) + 1
                  : 1;
              updateFormData('medicalRecords', [
                ...formData.medicalRecords,
                { id: newId, condition: '', date: '', details: '' },
              ]);
            }}
            onRemove={id =>
              updateFormData(
                'medicalRecords',
                formData.medicalRecords.filter(r => r.id !== id)
              )
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Update Personal Info</h1>
          <p className="mt-1 text-sm text-sky-50">
            Keep your profile, records, and employment details up to date.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Active Section</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {TABS.find((tab) => tab.id === activeTab)?.name}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Education Records</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formData.education.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Experience Records</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formData.experience.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Family Records</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formData.familyDetails.length}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-4">{renderTabContent()}</div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Updating Employee info..."
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            Update
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

export default UpdateEmployee;
