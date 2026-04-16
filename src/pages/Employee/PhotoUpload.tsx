import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PhotoUpload({ currentPhotoUrl, onChange }: PhotoUploadProps) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (currentPhotoUrl) {
      setPhoto(currentPhotoUrl);
    } else {
      setPhoto(null);
    }
  }, [currentPhotoUrl]);

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
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-50">
          {photo ? (
            <img
              src={photo}
              alt="Uploaded"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Upload className="h-8 w-8 text-sky-700" />
          )}
        </div>
        <div className="ml-6">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
            <span>Upload Photo</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              name="photo"
            />
          </label>
          <p className="mt-3 text-sm text-slate-500">JPG, PNG or GIF up to 2MB</p>
        </div>
      </div>
    </div>
  );
}
