import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Photo {
  id: string;
  site_name: string;
  photo_url: string;
  uploaded_by_name: string;
  created_at: string;
}

interface GroupPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
}

const GroupPhotosModal: React.FC<GroupPhotosModalProps> = ({ isOpen, onClose, siteId }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen, siteId]);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = siteId ? `/labour/group-photos/?site=${siteId}` : '/labour/group-photos/';
      const res = await api.get(url);
      setPhotos(res.data.results || res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-title-lg font-bold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">photo_library</span>
            Labour Group Photos
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest/50">
          {error && <div className="mb-4 p-4 bg-error-container text-error rounded-xl font-medium">{error}</div>}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4">progress_activity</span>
              <p className="font-medium">Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-border-subtle border-dashed">
              <span className="material-symbols-outlined text-[48px] text-text-muted mb-4">no_photography</span>
              <p className="text-body-lg text-text-muted font-medium">No group photos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map(photo => (
                <div key={photo.id} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="aspect-video w-full bg-surface-container relative overflow-hidden">
                    <img 
                      src={photo.photo_url} 
                      alt="Group Photo" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-text-main text-body-lg truncate">{photo.site_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-sm text-text-muted flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        Uploaded by: {photo.uploaded_by_name}
                      </p>
                      <p className="text-label-sm text-text-muted flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {new Date(photo.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupPhotosModal;
