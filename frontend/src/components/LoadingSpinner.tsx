import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = ''
}) => {

  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{ 
        width: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
        height: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
        borderColor: `transparent ${color} transparent transparent`
      }}
      aria-label="読み込み中"
    />
  );
};

export default LoadingSpinner;