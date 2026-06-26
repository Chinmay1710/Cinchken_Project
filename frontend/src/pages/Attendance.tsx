import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useSite } from '../context/SiteContext';
import type { Site } from './SiteManagement';

interface AttendanceRecord {
  id: string;
  work_date: string;
  check_in_time: string;
  status: string;
  site_name: string;
}

const Attendance = () => {
  const { refreshActiveSite } = useSite();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Webcam state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  // GPS state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'Pending' | 'Fetching...' | 'Captured' | 'Failed'>('Pending');
  
  // Sites & History
  const [sites, setSites] = useState<Site[]>([]);
  const [assignedSite, setAssignedSite] = useState<Site | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Fetch assigned site and history
    const fetchData = async () => {
      try {
        const siteRes = await api.get('/sites/');
        const sitesData = Array.isArray(siteRes.data.results) ? siteRes.data.results : (Array.isArray(siteRes.data) ? siteRes.data : []);
        setSites(sitesData);
        if (sitesData.length > 0) {
          setAssignedSite(sitesData[0]);
        }

        const histRes = await api.get('/attendance/check-in/');
        const histData = Array.isArray(histRes.data.results) ? histRes.data.results : (Array.isArray(histRes.data) ? histRes.data : []);
        setHistory(histData.slice(0, 5)); // Show only last 5 records
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, [successMsg]); // Re-fetch history when successMsg changes (after check-in)

  // Handle GPS when component mounts or step changes to 3
  const captureLocation = () => {
    setLocationStatus('Fetching...');
    setCameraError('');
    
    const fallbackToIp = async (reason: string) => {
      try {
        console.warn(`Native geolocation failed (${reason}), falling back to IP-based location...`);
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          setLocation({
            lat: data.latitude,
            lng: data.longitude
          });
          setLocationStatus('Captured');
        } else {
          throw new Error("Invalid IP location data");
        }
      } catch (ipErr) {
        console.error("IP Geolocation Error:", ipErr);
        setLocationStatus('Failed');
        setCameraError(`Location unavailable (${reason}). IP fallback also failed.`);
      }
    };

    if ('geolocation' in navigator) {
      const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('Captured');
        },
        (error) => {
          console.error("Geolocation Error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setCameraError("Location access denied. Please click the site settings icon (lock/tune) in your URL bar, allow Location, and retry.");
            setLocationStatus('Failed');
          } else {
            // For POSITION_UNAVAILABLE or TIMEOUT, fallback to IP
            fallbackToIp(error.code === error.TIMEOUT ? "Timeout" : "Position Unavailable");
          }
        },
        options
      );
    } else {
      fallbackToIp("Browser Not Supported");
    }
  };

  useEffect(() => {
    if (currentStep === 3 && !location && locationStatus !== 'Failed') {
      captureLocation();
    }
  }, [currentStep, location, locationStatus]);

  // Handle Camera
  useEffect(() => {
    let isCancelled = false;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isCancelled) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Camera access denied or not available. Please check permissions.");
      }
    };

    if (currentStep === 2 && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [currentStep, capturedImage]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const mediaStream = videoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  const handleSubmit = async () => {
    if (!capturedImage) {
      alert("Please capture a selfie first.");
      return;
    }
    if (!location) {
      alert("Location not captured yet.");
      return;
    }
    if (!assignedSite) {
      alert("You are not assigned to any site.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('site', assignedSite.id);
      formData.append('sync_id', crypto.randomUUID());
      
      const imageBlob = dataURLtoBlob(capturedImage);
      formData.append('selfie_image', imageBlob, 'selfie.jpg');

      await api.post('/attendance/check-in/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg("Attendance Marked Successfully! Processing validation in background.");
      // Update preferred active site to the one they just checked into
      localStorage.setItem('preferredActiveSite', assignedSite.id);
      
      // Refresh the active site in global context immediately!
      await refreshActiveSite();
      
      setTimeout(() => {
        setSuccessMsg('');
        setCurrentStep(1);
        setCapturedImage(null);
        setLocation(null);
        setLocationStatus('Pending');
      }, 4000);

    } catch (err: any) {
      console.error(err);
      let errorMsg = "Failed to submit attendance.";
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          errorMsg = `${firstKey}: ${err.response.data[firstKey][0] || err.response.data[firstKey]}`;
        }
      }
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-container-padding bg-surface-bright h-full custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-primary">Smart Attendance Marking</h2>
            <p className="text-body-lg text-text-muted mt-2">Complete the multi-step verification to mark your daily attendance.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-status-active/10 text-status-active border border-status-active/20 rounded-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Workflow Stepper */}
        <div className="flex items-center justify-between mb-10 px-8 relative">
          <div className="absolute h-px bg-border-subtle left-16 right-16 top-1/2 -translate-y-1/2 z-0"></div>
          
          <div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className={`w-12 h-12 rounded-full border-2 bg-surface flex items-center justify-center transition-all duration-300 shadow-sm ${currentStep >= 1 ? 'border-primary text-primary' : 'border-border-subtle text-text-muted'}`}>
              <span className="material-symbols-outlined text-[24px]">location_city</span>
            </div>
            <span className="text-label-md font-label-md">Select Site</span>
          </div>

          <div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(2)}>
            <div className={`w-12 h-12 rounded-full border-2 bg-surface flex items-center justify-center transition-all duration-300 shadow-sm ${currentStep >= 2 ? 'border-primary text-primary' : 'border-border-subtle text-text-muted'}`}>
              <span className="material-symbols-outlined text-[24px]">camera_alt</span>
            </div>
            <span className="text-label-md font-label-md">Capture Selfie</span>
          </div>
          
          <div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(3)}>
            <div className={`w-12 h-12 rounded-full border-2 bg-surface flex items-center justify-center transition-all duration-300 shadow-sm ${currentStep >= 3 ? 'border-primary text-primary' : 'border-border-subtle text-text-muted'}`}>
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>
            <span className="text-label-md font-label-md">GPS Verification</span>
          </div>
          
          <div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(4)}>
            <div className={`w-12 h-12 rounded-full border-2 bg-surface flex items-center justify-center transition-all duration-300 shadow-sm ${currentStep >= 4 ? 'border-primary text-primary' : 'border-border-subtle text-text-muted'}`}>
              <span className="material-symbols-outlined text-[24px]">rule</span>
            </div>
            <span className="text-label-md font-label-md">History & Rules</span>
          </div>
        </div>

        {/* Step Panels Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Main Action Canvas */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Site Selection Canvas */}
            {currentStep === 1 && (
              <div className="glass-panel rounded-xl overflow-hidden shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                  <h3 className="text-title-lg font-title-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">location_city</span>
                    Site Selection
                  </h3>
                  <span className={`px-3 py-1 rounded-full flex items-center gap-1 text-label-sm ${assignedSite ? 'bg-status-active/10 text-status-active' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${assignedSite ? 'bg-status-active' : 'bg-amber-500 animate-pulse'}`}></span>
                    {assignedSite ? 'Site Assigned' : 'Select a Site'}
                  </span>
                </div>
                
                <div className="p-10 flex flex-col items-center justify-center bg-surface-container-high min-h-[300px]">
                  <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-[32px]">domain</span>
                  </div>
                  <h4 className="text-title-md font-bold mb-2">Where are you working today?</h4>
                  <p className="text-body-md text-text-muted mb-8 text-center max-w-sm">Please select the active construction site where you will be marking attendance.</p>
                  
                  {sites.length > 0 ? (
                    <div className="w-full max-w-md relative">
                      <select 
                        className="w-full pl-4 pr-10 py-4 bg-surface border-2 border-border-subtle rounded-xl text-body-lg font-medium focus:ring-4 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer shadow-sm"
                        value={assignedSite?.id || ''}
                        onChange={(e) => {
                          const s = sites.find(site => site.id === e.target.value);
                          if (s) setAssignedSite(s);
                        }}
                      >
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                    </div>
                  ) : (
                    <div className="w-full max-w-md p-4 bg-error-container text-error rounded-xl border border-error/20 flex items-center gap-3">
                      <span className="material-symbols-outlined">error</span>
                      <p>You have no active sites available. Please contact your manager.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Camera Canvas */}
            {currentStep === 2 && (
              <div className="glass-panel rounded-xl overflow-hidden shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                  <h3 className="text-title-lg font-title-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">photo_camera</span>
                    Identity Verification
                  </h3>
                  <span className={`px-3 py-1 rounded-full flex items-center gap-1 text-label-sm ${capturedImage ? 'bg-status-active/10 text-status-active' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${capturedImage ? 'bg-status-active' : 'bg-amber-500 animate-pulse'}`}></span>
                    {capturedImage ? 'Image Captured' : 'Camera Ready'}
                  </span>
                </div>
                
                <div className="aspect-video bg-neutral-900 relative group flex items-center justify-center">
                  {cameraError ? (
                    <p className="text-error bg-white/10 px-4 py-2 rounded">{cameraError}</p>
                  ) : capturedImage ? (
                    <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-dashed border-white/40 rounded-[50%] flex items-center justify-center">
                          <p className="text-white/60 text-label-md uppercase tracking-widest mt-64">Align Face</p>
                        </div>
                      </div>
                      <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-primary p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform pointer-events-auto">
                        <span className="material-symbols-outlined text-[32px]">photo_camera</span>
                      </button>
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>

                <div className="p-6 bg-surface-container-low/50 flex justify-between items-center">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-text-muted mt-1">info</span>
                    <p className="text-body-md text-text-muted italic">Face biometric verification ensures compliance with industrial safety protocols.</p>
                  </div>
                  {capturedImage && (
                    <button onClick={retakePhoto} className="px-4 py-2 bg-surface-container border border-border-subtle rounded-lg font-bold text-text-main hover:bg-surface-dim transition-colors">Retake</button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Map Canvas */}
            {currentStep === 3 && (
              <div className="glass-panel rounded-xl overflow-hidden shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                  <h3 className="text-title-lg font-title-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">explore</span>
                    Geofence Verification
                  </h3>
                  <span className={`px-3 py-1 rounded-full flex items-center gap-1 text-label-sm ${locationStatus === 'Captured' ? 'bg-status-completed/10 text-status-completed' : locationStatus === 'Failed' ? 'bg-error-container text-error' : 'bg-surface-container-high text-text-muted'}`}>
                    <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                    {locationStatus}
                  </span>
                </div>
                
                <div className="aspect-video relative bg-surface-container-high flex items-center justify-center">
                  {locationStatus === 'Failed' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-surface/50 backdrop-blur-sm">
                      <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-error text-[32px]">location_disabled</span>
                      </div>
                      <h3 className="text-title-lg font-bold text-on-surface mb-2">Location Required</h3>
                      <p className="text-body-md text-text-muted mb-6">{cameraError}</p>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={captureLocation}
                          className="px-6 py-2.5 bg-primary text-white rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">refresh</span>
                          Retry Location
                        </button>
                        {import.meta.env.DEV && assignedSite && (
                          <button 
                            onClick={() => {
                              setLocation({ lat: assignedSite.latitude || 19.0760, lng: assignedSite.longitude || 72.8777 });
                              setLocationStatus('Captured');
                              setCameraError('');
                            }}
                            className="px-6 py-2.5 bg-secondary text-white rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            title="Bypass GPS checks for local development"
                          >
                            <span className="material-symbols-outlined text-[18px]">bug_report</span>
                            Mock Location
                          </button>
                        )}
                      </div>
                    </div>
                  ) : location ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#E5E3DF]">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      <div className="w-32 h-32 rounded-full border-4 border-status-active/40 bg-status-active/10 relative mb-6">
                        <div className="absolute inset-0 rounded-full animate-ping border border-status-active/20"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <span className="material-symbols-outlined text-status-active text-[32px]" style={{fontVariationSettings: "'FILL' 1"}}>person_pin_circle</span>
                        </div>
                      </div>
                      
                      {import.meta.env.DEV && assignedSite && (
                        <button 
                          onClick={() => {
                            setLocation({ lat: assignedSite.latitude || 19.0760, lng: assignedSite.longitude || 72.8777 });
                          }}
                          className="px-4 py-2 bg-secondary text-white rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10"
                          title="Bypass GPS checks for local development"
                        >
                          <span className="material-symbols-outlined text-[16px]">bug_report</span>
                          Force Mock Location
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-text-muted flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin">refresh</span> Fetching Coordinates...
                    </p>
                  )}
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-border-subtle">
                    <p className="text-label-sm text-text-muted mb-1">CURRENT COORDINATES</p>
                    <p className="text-body-md font-bold">{location ? `${location.lat.toFixed(6)}° N, ${location.lng.toFixed(6)}° W` : '--'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-status-active/10 border border-status-active/20">
                    <p className="text-label-sm text-status-active mb-1">STATUS</p>
                    <p className="text-body-md font-bold text-status-active">
                      {location ? "Coordinates Captured" : "Awaiting..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: History & Rules Canvas */}
            {currentStep === 4 && (
              <div className="space-y-6 transition-all duration-500 animate-in fade-in zoom-in-95">
                {/* Rules Section */}
                <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border-subtle">
                    <h3 className="text-title-lg font-title-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">gavel</span>
                      Site Attendance Rules
                    </h3>
                  </div>
                  <div className="p-6 bg-surface-container-low">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-status-completed text-[20px]">location_on</span>
                        <p className="text-body-md text-text-main">You must be within <strong>{assignedSite?.geofence_radius_meters || 50} meters</strong> of the site center to mark valid attendance.</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-status-on-hold text-[20px]">schedule</span>
                        <p className="text-body-md text-text-main">Check-ins recorded after <strong>{assignedSite?.attendance_cutoff_time || '09:30 AM'}</strong> will be marked as Half Day or Late.</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px]">photo_camera</span>
                        <p className="text-body-md text-text-main">Ensure your face is clearly visible in the selfie for automated validation.</p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* History Section */}
                <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-surface-container-low rounded-xl border border-border-subtle p-6 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-title-lg font-bold text-on-surface">Your Recent Check-ins</h3>
                      {history.length > 0 && history[0].status === 'Rejected' && (
                        <button 
                          onClick={() => {
                            setCurrentStep(1);
                            setCapturedImage(null);
                            setLocation(null);
                            setSuccessMsg('');
                          }}
                          className="px-4 py-2 bg-error text-white rounded-lg font-bold hover:opacity-90 flex items-center gap-2 text-label-md"
                        >
                          <span className="material-symbols-outlined text-[18px]">replay</span>
                          Retake Attendance
                        </button>
                      )}
                    </div>
                    
                    {history.length > 0 && history[0].status === 'Rejected' && (
                      <div className="mb-4 p-3 bg-error-container text-on-error-container border border-error/20 rounded-lg text-body-sm flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <p>Your last attendance was rejected by the automated verification system. Please ensure you are physically present at the site and your selfie is clear, then click Retake Attendance.</p>
                      </div>
                    )}

                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left">
                      <thead className="bg-surface-container-low border-b border-border-subtle">
                        <tr>
                          <th className="py-3 px-6 text-label-md font-bold text-text-muted">Date</th>
                          <th className="py-3 px-6 text-label-md font-bold text-text-muted">Time</th>
                          <th className="py-3 px-6 text-label-md font-bold text-text-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {history.length === 0 ? (
                          <tr><td colSpan={3} className="py-6 px-6 text-center text-text-muted">No recent records.</td></tr>
                        ) : history.map(record => (
                          <tr key={record.id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="py-3 px-6 text-body-md font-medium text-text-main">{new Date(record.work_date).toLocaleDateString()}</td>
                            <td className="py-3 px-6 text-body-md text-text-muted">
                              {new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="py-3 px-6">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${record.status === 'Present' ? 'bg-status-active/10 text-status-active' : record.status === 'Pending' ? 'bg-status-on-hold/10 text-status-on-hold' : 'bg-error/10 text-error'}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Workflow Controls */}
            <div className="flex items-center justify-between mt-8">
              <button 
                className={`px-8 py-4 rounded-xl border-2 font-bold transition-all flex items-center gap-2 ${currentStep === 1 ? 'border-border-subtle text-text-muted opacity-50 cursor-not-allowed' : 'border-border-subtle text-text-main hover:bg-surface-container-low'}`}
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              >
                Previous Step
              </button>
              
              {currentStep < 4 ? (
                <button 
                  className="px-10 py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 shadow-xl shadow-primary/20 transition-all flex items-center gap-3 disabled:opacity-50"
                  onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                  disabled={(currentStep === 1 && !assignedSite) || (currentStep === 2 && !capturedImage) || (currentStep === 3 && !location)}
                >
                  Next Step
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <button 
                  className="px-10 py-4 rounded-xl bg-secondary text-on-primary font-bold hover:opacity-90 shadow-xl shadow-secondary/20 transition-all flex items-center gap-3 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !assignedSite || !location || !capturedImage}
                >
                  {isSubmitting ? 'Submitting...' : 'Mark Attendance'}
                  {!isSubmitting && <span className="material-symbols-outlined">check_circle</span>}
                </button>
              )}
            </div>
            
          </div>

          {/* Right: Summary & Info */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-xl shadow-sm space-y-6">
              <h3 className="text-title-lg font-title-lg">Session Summary</h3>
              <div className="space-y-4">
                
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${capturedImage ? 'bg-status-active/20 text-status-active' : 'bg-surface-container-high text-text-muted'}`}>
                    <span className="material-symbols-outlined">{capturedImage ? 'check_circle' : 'pending'}</span>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Identity Status</p>
                    <p className="text-body-md font-bold">{capturedImage ? 'Captured' : 'Awaiting Capture'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${location ? 'bg-status-active/20 text-status-active' : 'bg-surface-container-high text-text-muted'}`}>
                    <span className="material-symbols-outlined">{location ? 'check_circle' : 'schedule'}</span>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Location Status</p>
                    <p className="text-body-md font-bold">{location ? 'Coordinates Locked' : 'Pending'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assignedSite ? 'bg-status-active/20 text-status-active' : 'bg-surface-container-high text-text-muted'}`}>
                    <span className="material-symbols-outlined">{assignedSite ? 'check_circle' : 'schedule'}</span>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Assigned Site</p>
                    <p className="text-body-md font-bold">{assignedSite ? assignedSite.name : 'Loading...'}</p>
                  </div>
                </div>

              </div>
              
              <div className="pt-6 border-t border-border-subtle">
                <div className="bg-primary-container/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span className="text-label-sm">SECURITY ENFORCED</span>
                  </div>
                  <p className="text-label-sm text-text-muted leading-relaxed">
                    Encryption: AES-256 Bit<br/>
                    Geofence distance check happens securely on the server via Celery background tasks.
                  </p>
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
};

export default Attendance;
