import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export const TrashIcon: React.FC<IconProps> = ({ title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1zm10 4H5m1 0v12a2 2 0 002 2h8a2 2 0 002-2V7" />
  </svg>
);
