import { FC } from "react";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="relative w-full h-full">
          <div className="absolute w-full h-full border-[6px] border-gray-200 rounded-full"></div>
          <div className="absolute w-full h-full border-[6px] border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 