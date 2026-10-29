import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  photoUrl?: string;
  id?: number | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-indigo-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-rose-500 to-red-600',
  'from-orange-500 to-amber-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-teal-500 to-emerald-600',
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const clean = name.trim().replace(/^@/, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const second = parts[1][0] || '';
    return (first + second).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getAvatarGradient(idOrName?: number | string): string {
  if (typeof idOrName === 'number') {
    return AVATAR_GRADIENTS[Math.abs(idOrName) % AVATAR_GRADIENTS.length];
  }
  let hash = 0;
  const str = String(idOrName || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  photoUrl,
  id,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-14 h-14 text-base',
  }[size];

  const initials = getInitials(name);
  const gradient = getAvatarGradient(id || name);

  if (photoUrl && !imageError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr ${gradient} text-white font-black flex items-center justify-center shrink-0 tracking-wider shadow-inner select-none ${className}`}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
};
