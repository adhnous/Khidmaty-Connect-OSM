// Canonical list of service categories
export const categories = [
  'Plumbing',
  'Home Services',
  'Automotive',
  'Education',
  'Electrical',
  'Carpentry',
  'Gardening',
] as const;

export type Category = typeof categories[number];
