import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface PhotoUploadProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PhotoUpload({ onChange }: PhotoUploadProps) {
  const [photo, setPhoto] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
    onChange(e); // Pass the event to the parent handler
  };

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
          {photo ? (
            <img
              src={photo}
              alt="Uploaded"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Upload className="h-8 w-8 text-indigo-600" />
          )}
        </div>
        <div className="ml-6">
          <label className="btn-primary cursor-pointer">
            <span>Upload Photo</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              name="photo"
            />
          </label>
          <p className="mt-1 text-sm text-gray-500" style={{paddingTop:'15px'}}>JPG, PNG or GIF up to 2MB</p>
        </div>
      </div>
    </div>
  );
}
