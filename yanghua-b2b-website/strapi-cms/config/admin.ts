export default ({ env, strapi }: { env: any, strapi: any }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },

  preview: {
  enabled: true,
  config: {
    
    allowedOrigins: env("CLIENT_URL"),  // Usually your frontend application URL
    // …
   async handler(uid: any, { documentId, locale, status }: any) {
       const document = await strapi.documents(uid).findOne({
           documentId,
           fields: ["slug"],
         });
        const { slug } = document;

        const urlSearchParams = new URLSearchParams({
          secret: env("PREVIEW_SECRET"),
          ...(slug && { slug }),
          uid,
          status,
        });

        const previewURL = `${env("CLIENT_URL")}/api/preview?${urlSearchParams}`;
        return previewURL;
    },
  
  
  }


}

});
