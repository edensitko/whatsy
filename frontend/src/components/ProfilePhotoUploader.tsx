// import React, { useState, useRef } from 'react';
// import { Button } from '@/components/ui/button';
// import { fileToBase64 } from '@/services/storageService';
// import { User, Upload, X } from 'lucide-react';

// interface ProfilePhotoUploaderProps {
//   currentPhotoURL?: string;
//   onPhotoUpdated: (photoURL: string) => void;
// }

// const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({ 
//   currentPhotoURL, 
//   onPhotoUpdated 
// }) => {
//   const [isUploading, setIsUploading] = useState(false);
//   const [previewURL, setPreviewURL] = useState<string | null>(currentPhotoURL || null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       setIsUploading(true);
      
//       // Convert file to base64
//       const base64String = await fileToBase64(file);
      
//       // Update the user's profile photo
//       // const updatedUser = await updateProfilePhoto(base64String);
      
//       // if (updatedUser && updatedUser.photoURL) {
//       //   setPreviewURL(updatedUser.photoURL);
//       //   onPhotoUpdated(updatedUser.photoURL);
//       // }
//   //   } catch (error) {
//   //     console.error('Error uploading profile photo:', error);
//   //     alert('שגיאה בהעלאת תמונת הפרופיל. אנא נסה שנית.');
//   //   } finally {
//   //     setIsUploading(false);
//   //   }
//   // };

//   const handleRemovePhoto = async () => {
//     try {
//       setIsUploading(true);
      
//       // Update with empty string to remove photo
//       const updatedUser = await updateProfilePhoto('');
      
//       setPreviewURL(null);
//       onPhotoUpdated('');
      
//       // Clear the file input
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     } catch (error) {
//       console.error('Error removing profile photo:', error);
//       alert('שגיאה בהסרת תמונת הפרופיל. אנא נסה שנית.');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center gap-4">
//       {previewURL ? (
//         <div className="relative">
//           <img 
//             src={previewURL} 
//             alt="תמונת פרופיל" 
//             className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
//           />
//           <Button
//             type="button"
//             variant="destructive"
//             size="sm"
//             className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
//             onClick={handleRemovePhoto}
//             disabled={isUploading}
//           >
//             <X className="h-3 w-3" />
//           </Button>
//         </div>
//       ) : (
//         <div 
//           className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
//           onClick={() => fileInputRef.current?.click()}
//         >
//           <User className="h-10 w-10 text-gray-400" />
//         </div>
//       )}
      
//       <div>
//         <input
//           ref={fileInputRef}
//           type="file"
//           id="profile_photo"
//           className="hidden"
//           accept="image/*"
//           onChange={handleFileChange}
//           disabled={isUploading}
//         />
        
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           className="rtl"
//           onClick={() => fileInputRef.current?.click()}
//           disabled={isUploading}
//         >
//           <Upload className="ml-2 h-4 w-4" />
//           {previewURL ? 'החלף תמונה' : 'העלה תמונה'}
//         </Button>
//       </div>
      
//       {isUploading && (
//         <div className="text-sm text-blue-600 animate-pulse">מעלה תמונה...</div>
//       )}
//     </div>
//   );
// };

// export default ProfilePhotoUploader;
