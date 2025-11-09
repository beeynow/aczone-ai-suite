interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} animate-spin`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer diamond shape */}
        <path
          d="M50 10 L70 30 L90 50 L70 70 L50 90 L30 70 L10 50 L30 30 Z"
          className="stroke-primary fill-none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Inner woven pattern */}
        <path
          d="M50 25 L65 40 L50 55 L35 40 Z"
          className="stroke-primary fill-primary/20"
          strokeWidth="2"
        />
        
        <path
          d="M65 40 L75 50 L65 60 L55 50 Z"
          className="stroke-primary fill-primary/30"
          strokeWidth="2"
        />
        
        <path
          d="M35 40 L45 50 L35 60 L25 50 Z"
          className="stroke-primary fill-primary/30"
          strokeWidth="2"
        />
        
        <path
          d="M50 55 L65 70 L50 85 L35 70 Z"
          className="stroke-primary fill-primary/40"
          strokeWidth="2"
        />
        
        {/* Center accent */}
        <circle
          cx="50"
          cy="50"
          r="6"
          className="fill-primary"
        />
      </svg>
    </div>
  );
}
