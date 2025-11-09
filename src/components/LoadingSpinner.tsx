import logo from "@/assets/loading-logo.png";

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
      <img 
        src={logo} 
        alt="Loading..." 
        className={`${sizeClasses[size]} animate-spin opacity-80 dark:opacity-100`}
      />
    </div>
  );
}
