import React from 'react';
import EmptyState from '@/components/ui/EmptyState';

/** Full-screen placeholder when the requested post no longer exists. */
export default function PostNotFound() {
  return <EmptyState title="Post not found" variant="fullscreen" />;
}
