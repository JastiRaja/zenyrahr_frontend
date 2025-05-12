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

// const TABS = [
//   { id: 'personal', name: 'Personal Info', icon: User },
//   { id: 'education', name: 'EducationForm', icon: GraduationCap },
//   { id: 'experience', name: 'Experience', icon: Briefcase },
//   { id: 'skills', name: 'Skills & Interests', icon: Star },
//   { id: 'family', name: 'Family Details', icon: Users },
//   { id: 'medical', name: 'Medical Records', icon: Heart },
// ] as const;

// type TabId = typeof TABS[number]['id'];

// interface FormState {
//   personal: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     address: string;
//   };
//   photo: File | null;
//   education: Array<{
//     id: number;
//     degree: string;
//     institution: string;
//     year: string;
//     field: string;
//   }>;
//   experience: Array<{
//     id: number;
//     company: string;
//     position: string;
//     startDate: string;
//     endDate: string;
//     description: string;
//   }>;
//   skills: string[];
//   interests: string[];
//   familyDetails: Array<{
//     id: number;
//     name: string;
//     relationship: string;
//     contact: string;
//   }>;
//   medicalRecords: Array<{
//     id: number;
//     condition: string;
//     date: string;
//     details: string;
//   }>;
// }

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

// export default function UpdateEmployee() {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<TabId>('personal');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [formData, setFormData] = useState<FormState>(initialFormState);

//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   const userId = user?.id;
//   // console.log(userId);
  

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

//     try {
//       const employeeData = {
//         ...formData.personal,
//         photo: formData.photo,
//         education: formData.education,
//         experience: formData.experience,
//         skills: formData.skills,
//         interests: formData.interests,
//         familyDetails: formData.familyDetails,
//         medicalRecords: formData.medicalRecords,
//       };

//       if (userId) {
//         await employeeService.updateEmployee(userId, employeeData);

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
//     setFormData(prev => ({
//       ...prev,
//       [section]: data,
//     }));
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <>
//             <div className='mb-4'>
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
//   education={formData.education} // Correct binding
//   onChange={(id, field, value) => {
//     const updatedEducation = formData.education.map((edu) =>
//       edu.id === id ? { ...edu, [field]: value } : edu
//     );
//     // console.log('Updated Education:', updatedEducation); // Debugging
//     updateFormData('education', updatedEducation);
//   }}
//   onAdd={() => {
//     // const newId =
//     //   formData.education.length > 0
//     //     ? Math.max(...formData.education.map((edu) => edu.id)) + 1
//     //     : 1;
//     const newId =
//       formData.education.length > 0
//         ? Math.max(...formData.education.map((edu) => edu.id)) + 1
//         : 1;
//     const newEducation = {
//       id: newId,
//       degree: '',
//       institution: '',
//       year: '',
//       field: '',
//     };
//     // console.log('Adding:', newEducation); // Debugging
//     updateFormData('education', [...formData.education, newEducation]);
//   }}
//   onRemove={(id) => {
//     const updatedEducation = formData.education.filter((edu) => edu.id !== id);
//     // console.log('Removing:', id); // Debugging
//     updateFormData('education', updatedEducation);
//   }}
// />


//         );
//       case 'experience':
//         return (
// <ExperienceForm
//   experience={formData.experience} // Correct binding
//   onChange={(id, field, value) => {
//     const updatedExperience = formData.experience.map((exp) =>
//       exp.id === id ? { ...exp, [field]: value } : exp
//     );
//     // console.log('Updated Experience:', updatedExperience); // Debugging
//     updateFormData('experience', updatedExperience);
//   }}
//   onAdd={() => {
//     // const any =
//     //   formData.experience.length > 0
//     //     ? Math.max(...formData.experience.map((exp) => exp.id)) + 1
//     //     : 1;
//     const newExperience = {
      
//       company: '',
//       position: '',
//       startDate: '',
//       endDate: '',
//       description: ''
//     };
//     // console.log('Adding:', newExperience); // Debugging
//     updateFormData('experience', [...formData.experience, newExperience]);
//   }}
//   onRemove={(id) => {
//     const updatedExperience = formData.experience.filter((exp) => exp.id !== id);
//     // console.log('Removing:', id); // Debugging
//     updateFormData('experience', updatedExperience);
//   }}
// />

//         );
//       case 'skills':
//         return (
//           <SkillsInterestsForm
//             skills={formData.skills}
//             interests={formData.interests}
//             onAddSkill={(skill) => {
//               updateFormData('skills', [...formData.skills, skill]);
//             }}
//             onRemoveSkill={(index) => {
//               updateFormData('skills', formData.skills.filter((_, i) => i !== index));
//             }}
//             onAddInterest={(interest) => {
//               updateFormData('interests', [...formData.interests, interest]);
//             }}
//             onRemoveInterest={(index) => {
//               updateFormData('interests', formData.interests.filter((_, i) => i !== index));
//             }}
//           />
//         );
//       case 'family':
//         return (
//           <FamilyDetailsForm
//           familyDetails={formData.familyDetails} // Correct binding
//           onChange={(id, field, value) => {
//             const updatedFamilyDetails = formData.familyDetails.map((member) =>
//               member.id === id ? { ...member, [field]: value } : member
//             );
//             // console.log('Updated Family Details:', updatedFamilyDetails); // Debugging
//             updateFormData('familyDetails', updatedFamilyDetails);
//           }}
//           onAdd={() => {
//             // const newId =
//             //   formData.familyDetails.length > 0
//             //     ? Math.max(...formData.familyDetails.map((member) => member.id)) + 1
//             //     : 1;
//             const newFamilyMember = {
//               // id: newId,
//               name: '',
//               relationship: '',
//               contact: ''
//             };
//             // console.log('Adding Family Member:', newFamilyMember); // Debugging
//             updateFormData('familyDetails', [...formData.familyDetails, newFamilyMember]);
//           }}
//           onRemove={(id) => {
//             const updatedFamilyDetails = formData.familyDetails.filter((member) => member.id !== id);
//             // console.log('Removing Family Member:', id); // Debugging
//             updateFormData('familyDetails', updatedFamilyDetails);
//           }}
//         />
        
//         );
//       case 'medical':
//         return (
//           <MedicalRecordsForm
//   medicalRecords={formData.medicalRecords} // Correct binding
//   onChange={(id, field, value) => {
//     const updatedMedicalRecords = formData.medicalRecords.map((record) =>
//       record.id === id ? { ...record, [field]: value } : record
//     );
//     // console.log('Updated Medical Records:', updatedMedicalRecords); // Debugging
//     updateFormData('medicalRecords', updatedMedicalRecords);
//   }}
//   onAdd={() => {
//     // const newId =
//     //   formData.medicalRecords.length > 0
//     //     ? Math.max(...formData.medicalRecords.map((record) => record.id)) + 1
//     //     : 1;
//     const newMedicalRecord = {
//       // id: newId,
//       condition: '',
//       date: '',
//       details: '',
//     };
//     // console.log('Adding Medical Record:', newMedicalRecord); // Debugging
//     updateFormData('medicalRecords', [...formData.medicalRecords, newMedicalRecord]);
//   }}
//   onRemove={(id) => {
//     const updatedMedicalRecords = formData.medicalRecords.filter((record) => record.id !== id);
//     // console.log('Removing Medical Record:', id); // Debugging
//     updateFormData('medicalRecords', updatedMedicalRecords);
//   }}
// />

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
// }






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
import employeeService from './employee.service';

type TabId = 'personal' | 'education' | 'experience' | 'skills' | 'family' | 'medical';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
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
  },
  photo: null,
  education: [{ id: 1, degree: '', institution: '', year: '', field: '' }],
  experience: [{ id: 1, company: '', position: '', startDate: '', endDate: '', description: '' }],
  skills: [],
  interests: [],
  familyDetails: [{ id: 1, name: '', relationship: '', contact: '' }],
  medicalRecords: [{ id: 1, condition: '', date: '', details: '' }],
};

const UpdateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(initialFormState);

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
            },
          });
        } catch (err) {
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
      const employeeData = {
        ...formData.personal,
        photo: formData.photo,
        education: formData.education,
        experience: formData.experience,
        skills: formData.skills,
        interests: formData.interests,
        familyDetails: formData.familyDetails,
        medicalRecords: formData.medicalRecords,
      };

      if (userId) {
        await employeeService.updateEmployee(userId, employeeData);
        setSuccessMessage('Employee information updated successfully!');
      } else {
        setError('User ID not found');
      }
    } catch (err) {
      setError('Failed to update employee information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = <K extends keyof FormState>(
    section: K,
    data: FormState[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <>
            <div className="mb-4">
              <PhotoUpload
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    updateFormData('photo', e.target.files[0]);
                  }
                }}
              />
            </div>
            <PersonalInfoForm
              formData={formData.personal}
              onChange={(e) => {
                const { name, value } = e.target;
                updateFormData('personal', {
                  ...formData.personal,
                  [name]: value,
                });
              }}
            />
          </>
        );
      case 'education':
        return (
          <EducationForm
            education={formData.education}
            onChange={(id, field, value) => {
              const updatedEducation = formData.education.map((edu) =>
                edu.id === id ? { ...edu, [field]: value } : edu
              );
              updateFormData('education', updatedEducation);
            }}
            onAdd={() => {
              const newId =
                formData.education.length > 0
                  ? Math.max(...formData.education.map((edu) => edu.id)) + 1
                  : 1;
              updateFormData('education', [
                ...formData.education,
                { id: newId, degree: '', institution: '', year: '', field: '' },
              ]);
            }}
            onRemove={(id) => {
              const updatedEducation = formData.education.filter((edu) => edu.id !== id);
              updateFormData('education', updatedEducation);
            }}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            experience={formData.experience}
            onChange={(id, field, value) => {
              const updatedExperience = formData.experience.map((exp) =>
                exp.id === id ? { ...exp, [field]: value } : exp
              );
              updateFormData('experience', updatedExperience);
            }}
            onAdd={() => {
              const newId =
                formData.experience.length > 0
                  ? Math.max(...formData.experience.map((exp) => exp.id)) + 1
                  : 1;
              updateFormData('experience', [
                ...formData.experience,
                { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' },
              ]);
            }}
            onRemove={(id) => {
              const updatedExperience = formData.experience.filter((exp) => exp.id !== id);
              updateFormData('experience', updatedExperience);
            }}
          />
        );
      case 'skills':
        return (
          <SkillsInterestsForm
            skills={formData.skills}
            interests={formData.interests}
            onAddSkill={(skill) => updateFormData('skills', [...formData.skills, skill])}
            onRemoveSkill={(index) =>
              updateFormData('skills', formData.skills.filter((_, i) => i !== index))
            }
            onAddInterest={(interest) =>
              updateFormData('interests', [...formData.interests, interest])
            }
            onRemoveInterest={(index) =>
              updateFormData('interests', formData.interests.filter((_, i) => i !== index))
            }
          />
        );
      case 'family':
        return (
          <FamilyDetailsForm
            familyDetails={formData.familyDetails}
            onChange={(id, field, value) => {
              const updatedFamilyDetails = formData.familyDetails.map((member) =>
                member.id === id ? { ...member, [field]: value } : member
              );
              updateFormData('familyDetails', updatedFamilyDetails);
            }}
            onAdd={() => {
              const newId =
                formData.familyDetails.length > 0
                  ? Math.max(...formData.familyDetails.map((member) => member.id)) + 1
                  : 1;
              updateFormData('familyDetails', [
                ...formData.familyDetails,
                { id: newId, name: '', relationship: '', contact: '' },
              ]);
            }}
            onRemove={(id) => {
              const updatedFamilyDetails = formData.familyDetails.filter(
                (member) => member.id !== id
              );
              updateFormData('familyDetails', updatedFamilyDetails);
            }}
          />
        );
      case 'medical':
        return (
          <MedicalRecordsForm
            medicalRecords={formData.medicalRecords}
            onChange={(id, field, value) => {
              const updatedMedicalRecords = formData.medicalRecords.map((record) =>
                record.id === id ? { ...record, [field]: value } : record
              );
              updateFormData('medicalRecords', updatedMedicalRecords);
            }}
            onAdd={() => {
              const newId =
                formData.medicalRecords.length > 0
                  ? Math.max(...formData.medicalRecords.map((record) => record.id)) + 1
                  : 1;
              updateFormData('medicalRecords', [
                ...formData.medicalRecords,
                { id: newId, condition: '', date: '', details: '' },
              ]);
            }}
            onRemove={(id) => {
              const updatedMedicalRecords = formData.medicalRecords.filter(
                (record) => record.id !== id
              );
              updateFormData('medicalRecords', updatedMedicalRecords);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Update Personal Info</h1>
        <p className="mt-2 text-lg text-gray-600">Enter Your Details Below</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">{renderTabContent()}</div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Updating Employee info...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateEmployee;
