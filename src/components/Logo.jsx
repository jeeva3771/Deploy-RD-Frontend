import React from 'react';
const logo = "/logord.png";
import { colors } from '@mui/material';

/**
 * Logo Component - RD Custom Awards
 * Professional logo with trophy icon and gradient background
 * 
 * Props:
 * - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * - variant: 'gradient' | 'solid' | 'outline' (default: 'gradient')
 * - showIcon: boolean (default: true)
 * - className: additional classes
 */

const Logo = ({
  size = 'md',
  variant = 'gradient',
  showIcon = true,
  className = '',
  companyName = 'RD Custom Awards Pvt. Ltd.',
  tagline = ''
}) => {
  // Size configurations
  const sizes = {
    sm: {
      container: 'px-3 py-2',
      icon: 'text-lg',
      title: 'text-sm',
      tagline: 'text-xs',
      iconBox: 'w-8 h-8',
    },
    md: {
      container: 'px-4 py-3',
      icon: 'text-xl',
      title: 'text-base',
      tagline: 'text-sm',
      iconBox: 'w-10 h-10',
    },
    lg: {
      container: 'px-5 py-4',
      icon: 'text-2xl',
      title: 'text-lg',
      tagline: 'text-base',
      iconBox: 'w-12 h-12',
    },
    xl: {
      container: 'px-6 py-5',
      icon: 'text-3xl',
      title: 'text-xl',
      tagline: 'text-lg',
      iconBox: 'w-16 h-16',
    },
  };

  // Variant styles
  const variants = {
    gradient: 'bg-gradient-to-r from-indigo-600',
    solid: 'bg-indigo-600',
    outline: 'bg-white border-2 border-indigo-600',
  };

  const textColor = variant === 'outline' ? 'text-white' : 'text-white';
  const sizeConfig = sizes[size];

  return (
    <div
      className={`${variants[variant]} ${sizeConfig.container} rounded-xl flex items-center gap-3 ${className}`}
    >
      {showIcon && (
        <img
          src={logo}
          alt="EnquiryPro"
          className="sidebar-logo "
        />
      )}
      <div className="flex flex-col leading-tight">
        <span className={`${sizeConfig.title} font-bold ${textColor}`}>
          {companyName}
        </span>
        <span className={`${sizeConfig.tagline} font-semibold ${textColor} ${variant !== 'outline' && 'opacity-90'}`}>
          {tagline}
        </span>
      </div>
    </div>
  );
};

// Example usage variants
export const LogoExamples = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Size Variants</h3>
        <div className="space-y-3">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
          <Logo size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Style Variants</h3>
        <div className="space-y-3">
          <Logo variant="gradient" />
          <Logo variant="solid" />
          <Logo variant="outline" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Without Icon</h3>
        <Logo showIcon={false} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Custom Text</h3>
        <Logo companyName="Your Company" tagline="Your Tagline" />
      </div>
    </div>
  );
};

export default Logo;