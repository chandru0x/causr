export const BFF_API_BASE =
  import.meta.env.VITE_BFF_API_BASE?.replace(/\/$/, '') || 'http://localhost:8090';

export const PROCESSOR_API_BASE =
  import.meta.env.VITE_PROCESSOR_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080';
