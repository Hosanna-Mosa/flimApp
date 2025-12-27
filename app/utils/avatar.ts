/**
 * Generate a consistent color for a user based on their ID or name
 * This ensures the same user always gets the same avatar color
 */
export function getAvatarColor(userId: string | undefined, name?: string): string {
  const seed = userId || name || 'default';
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and map to color range
  const colorIndex = Math.abs(hash) % 20;
  
  // Predefined color palette (20 colors for variety)
  const colors = [
    'FF6B6B', // Red
    '4ECDC4', // Teal
    '45B7D1', // Blue
    'FFA07A', // Light Salmon
    '98D8C8', // Mint
    'F7DC6F', // Yellow
    'BB8FCE', // Purple
    '85C1E2', // Sky Blue
    'F8B739', // Orange
    '52BE80', // Green
    'E74C3C', // Red
    '3498DB', // Blue
    '9B59B6', // Purple
    '1ABC9C', // Turquoise
    'F39C12', // Orange
    'E67E22', // Dark Orange
    '16A085', // Dark Turquoise
    '27AE60', // Green
    '2980B9', // Blue
    '8E44AD', // Purple
  ];
  
  return colors[colorIndex];
}

/**
 * Generate avatar URL with consistent color
 */
export function getAvatarUrl(
  avatar: string | undefined | null,
  userId: string | undefined,
  name: string,
  size: number = 56
): string {
  if (avatar && avatar.trim() !== '') {
    return avatar;
  }
  
  const color = getAvatarColor(userId, name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${color}&color=fff&bold=true`;
}

