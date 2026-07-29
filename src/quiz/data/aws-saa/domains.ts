import type { RawDomain } from '@/quiz/quiz.types';

/**
 * Official domains from the AWS Certified Solutions Architect - Associate
 * exam guide (SAA-C03), in exam order with their official weight.
 */
export const DOMAINS: RawDomain[] = [
  { id: 'SEC', order: 1, name: 'Design Secure Architectures', weight: 30 },
  { id: 'RES', order: 2, name: 'Design Resilient Architectures', weight: 26 },
  { id: 'PERF', order: 3, name: 'Design High-Performing Architectures', weight: 24 },
  { id: 'COST', order: 4, name: 'Design Cost-Optimized Architectures', weight: 20 },
];
