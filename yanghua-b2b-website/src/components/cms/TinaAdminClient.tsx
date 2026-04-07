'use client';

import { useEffect } from 'react';
import TinaCMS, { TinaAdmin, LocalAuthProvider, useCMS } from 'tinacms';
import config from '../../../tina/config';

const localConfig = {
  ...config,
  contentApiUrlOverride: '/api/tina/gql',
  authProvider: new LocalAuthProvider(),
};

const schema = {
  ...config.schema,
  config: localConfig,
} as any;

const TinaCMSProvider = TinaCMS as any;

function SetCmsFlags() {
  const cms = useCMS() as any;

  useEffect(() => {
    cms.flags.set('tina-basepath', 'cms');
    cms.flags.set('tina-preview', 'cms');
  }, [cms]);

  return null;
}

export function TinaAdminClient() {
  useEffect(() => {
    window.localStorage.setItem('tina.local.isLogedIn', 'true');
  }, []);

  return (
    <TinaCMSProvider
      {...localConfig}
      schema={schema}
      client={{ apiUrl: '/api/tina/gql' }}
      tinaGraphQLVersion=""
    >
      <SetCmsFlags />
      <TinaAdmin config={localConfig} />
    </TinaCMSProvider>
  );
}
