import React from 'react';

// Common icon properties for easier customization
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const StethoscopeIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M11 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"></path>
    <path d="M12 2L9 5"></path>
    <path d="M12 2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"></path>
    <path d="M12 22s8-4 8-10V8s-4-6-8-6-8 6-8 6v4s8 10 8 10"></path>
  </svg>
);

export const UploadCloudIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <polyline points="16 16 12 12 8 16"></polyline>
    <line x1="12" y1="12" x2="12" y2="21"></line>
    <path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"></path>
    <polyline points="16 16 12 12 8 16"></polyline>
  </svg>
);

export const HelpCircleIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export const CameraIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

export const WaveformIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M2 10v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm4 0v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm4 0v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1zm4 0v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1zm4 0v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1z"></path>
  </svg>
);

export const ThermometerIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
  </svg>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const HandIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M18 11V5a2 2 0 0 0-2-2L9.74 3h-.42a2 2 0 0 0-1.92 2.3L8.6 15.6l1.45 2.42a2 2 0 0 0 1.63 1H17a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-3v-3a1 1 0 0 0-1-1z"></path>
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const BotIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M12 8V4H8"></path>
    <path d="M22 2H2v20h20V2zM12 16h-2m4 0h-2m-2-4h4"></path>
    <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
    <line x1="8" y1="16" x2="16" y2="16"></line>
  </svg>
);

export const SendIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export const Volume2Icon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M12 19.5l-7-7c-4-4-4-10 0-14s10-4 14 0 4 10 0 14l-7 7z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

export const CarIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M17.5 17.5a2.5 2.5 0 0 1-5 0"></path>
    <path d="M6.5 17.5a2.5 2.5 0 0 1-5 0"></path>
    <path d="M2 17h20v-4H2v4z"></path>
    <path d="M7 13V7h10v6"></path>
    <path d="M12 7V3"></path>
    <path d="M12 3h-2"></path>
    <path d="M12 3h2"></path>
    <path d="M17 17h-2"></path>
    <path d="M7 17h-2"></path>
  </svg>
);

export const VideoIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M23 7l-7 5 7 5V7z"></path>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

export const PillIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M12 12L3 21M16.5 8.5L8.5 16.5M16.5 8.5a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0z"></path>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M12 8v4l3 3"></path>
    <path d="M21.05 12.05A9 9 0 1 1 10.9 5.08"></path>
    <path d="M18.8 2.2L22 5.4 18.8 8.6"></path>
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export const PharmacyIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
    <path d="M9 16h6"></path>
    <path d="M12 13v6"></path>
  </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M21 2v6h-6"></path>
    <path d="M3 12a9 9 0 0 1 15.46-5.46L21 2"></path>
    <path d="M3 22v-6h6"></path>
    <path d="M21 12a9 9 0 0 1-15.46 5.46L3 22"></path>
  </svg>
);
