interface MedLineLogoProps {
  size?: number;
  className?: string;
}

export function MedLineLogo({ size = 40, className = "" }: MedLineLogoProps) {
  return (
    <div 
      className={`flex items-center justify-center rounded-2xl dark:bg-white/20 bg-blue-600/20 backdrop-blur-sm border dark:border-white/30 border-blue-600/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        className="text-blue-600 dark:text-white"
      >
        {/* Medical Cross with Heart Shape */}
        <path
          d="M12 2C13.1 2 14 2.9 14 4V8H18C19.1 8 20 8.9 20 10V14C20 15.1 19.1 16 18 16H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V16H6C4.9 16 4 15.1 4 14V10C4 8.9 4.9 8 6 8H10V4C10 2.9 10.9 2 12 2Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        
        {/* Heart accent in center */}
        <path
          d="M12 15.5C12 15.5 8.5 12.5 8.5 10.5C8.5 9.1 9.6 8 11 8C11.5 8 12 8.2 12 8.5C12 8.2 12.5 8 13 8C14.4 8 15.5 9.1 15.5 10.5C15.5 12.5 12 15.5 12 15.5Z"
          fill="rgba(0,0,0,0.2)"
          className="dark:fill-[rgba(255,255,255,0.4)]"
        />
        
        {/* Medical pulse line */}
        <path
          d="M2 12H4L5 10L7 14L9 8L11 16L13 6L15 18L17 4L19 12H22"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-[rgba(255,255,255,0.6)]"
        />
      </svg>
    </div>
  );
}