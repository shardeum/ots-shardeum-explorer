import { FC, PropsWithChildren } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingStateProps {
  isLoading: boolean;
  isEmpty?: boolean;
  emptyMessage?: string | React.ReactNode;
  fullScreen?: boolean;
}

const LoadingState: FC<PropsWithChildren<LoadingStateProps>> = ({ 
  isLoading, 
  isEmpty = false,
  emptyMessage = "No data available",
  fullScreen = false,
  children 
}) => {
  const containerClasses = `w-full flex items-center justify-center bg-[aliceblue] ${
    fullScreen ? 'h-screen' : 'min-h-[300px]'
  }`;

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={containerClasses}>
        <div className="text-gray-500">{emptyMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;