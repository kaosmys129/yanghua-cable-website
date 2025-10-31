export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: env('CLIENT_URL'),
      async handler(uid, { documentId, locale, status }) {
        const document = await strapi.documents(uid).findOne({ 
          documentId,
          fields: ['slug']
        });
        const { slug } = document;
        
        const urlSearchParams = new URLSearchParams({
          secret: env('PREVIEW_SECRET'),
          slug,
          uid,
          status,
        });
        
        return `${env('CLIENT_URL')}/api/preview?${urlSearchParams}`;
      },
    },
  },
});
