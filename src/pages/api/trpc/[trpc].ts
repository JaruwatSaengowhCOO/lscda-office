import { appRouter } from '../../../../server/routers';
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { createContext } from '../../../lib/trpc-context';

export default createNextApiHandler({
  router: appRouter,
  createContext,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
