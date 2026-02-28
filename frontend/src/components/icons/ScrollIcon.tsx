
import React from 'react';

const ScrollIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 21h8" />
    <path d="M8 3h8" />
    <path d="M12 3v18" />
    <path d="M19.4 3.6a2 2 0 0 1 0 2.8L17 9l2.4 2.4a2 2 0 0 1 0 2.8L17 17l2.4 2.4a2 2 0 0 1 0 2.8" />
    <path d="M4.6 3.6a2 2 0 0 0 0 2.8L7 9l-2.4 2.4a2 2 0 0 0 0 2.8L7 17l-2.4 2.4a2 2 0 0 0 0 2.8" />
  </svg>
);

export default ScrollIcon;
