// src/features/patents/hooks/useComments.js
// This file can be simplified as the hook is now defined within CommentsContext.jsx
// You can either keep this file and re-export, or remove it and import directly from context.

// Option 1: Re-export (Simpler imports elsewhere)
export { useComments } from '../context/CommentsContext';

// Option 2: Remove this file and change imports in other files to:
// import { useComments } from '@/features/patents/context/CommentsContext';