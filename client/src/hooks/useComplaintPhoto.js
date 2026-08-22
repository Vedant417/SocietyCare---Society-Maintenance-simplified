import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * useComplaintPhoto
 * 
 * Fetches a complaint photo from the backend using authenticated fetch.
 * If the complaint has a photoFileId, it fetches from the protected GridFS endpoint.
 * If the complaint has only a legacy photoUrl (Cloudinary), it returns that directly.
 * Cleans up the object URL on unmount to prevent memory leaks.
 * 
 * @param {object} complaint - The complaint object from the API
 * @returns {{ photoSrc: string|null, photoLoading: boolean }}
 */
export function useComplaintPhoto(complaint) {
  const [photoSrc, setPhotoSrc] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function fetchPhoto() {
      if (!complaint) return;

      // Case 1: Has a GridFS photoFileId → fetch with auth and create blob URL
      if (complaint.photoFileId) {
        setPhotoLoading(true);
        try {
          const token = localStorage.getItem('societycare_token');
          const response = await fetch(`${API_BASE}/complaints/${complaint.id}/photo`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.warn('Failed to fetch complaint photo:', response.status);
            if (!cancelled) setPhotoSrc(null);
            return;
          }

          const blob = await response.blob();
          if (!cancelled) {
            objectUrl = URL.createObjectURL(blob);
            setPhotoSrc(objectUrl);
          }
        } catch (err) {
          console.error('Error loading complaint photo:', err);
          if (!cancelled) setPhotoSrc(null);
        } finally {
          if (!cancelled) setPhotoLoading(false);
        }
        return;
      }

      // Case 2: Legacy photoUrl (old Cloudinary URL or external)
      if (complaint.photoUrl && complaint.photoUrl.startsWith('http')) {
        setPhotoSrc(complaint.photoUrl);
        return;
      }

      // Case 3: No photo
      setPhotoSrc(null);
    }

    fetchPhoto();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [complaint?.id, complaint?.photoFileId, complaint?.photoUrl]);

  return { photoSrc, photoLoading };
}
