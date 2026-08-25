import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export type ContextualRequest = Request & {
  correlationId?: string;
  principal?: AuthenticatedPrincipal;
};
