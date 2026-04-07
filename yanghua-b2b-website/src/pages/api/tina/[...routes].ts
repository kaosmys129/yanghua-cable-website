import type { NextApiRequest, NextApiResponse } from 'next';
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer';
import databaseClient from '../../../../tina/localDatabaseClient';

const handler = TinaNodeBackend({
  authProvider: LocalBackendAuthProvider(),
  databaseClient,
});

export default function tinaGraphqlHandler(req: NextApiRequest, res: NextApiResponse) {
  return handler(req, res);
}
