import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface RequestWithUser extends Express.Request {
  user: User;
  query: {
    [key: string]: string | undefined;
    period?: string;
  };
}
