export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: env('CLIENT_URL') || env('FRONTEND_URL'),
      async handler(uid, { documentId, locale, status }) {
        const document = await strapi.documents(uid).findOne({ 
          documentId,
          fields: ['slug']
        });
        const { slug } = document;
        
        const urlSearchParams = new URLSearchParams({
          secret: env('PREVIEW_SECRET'),
          slug,
          locale: locale ?? 'en',
          uid,
          status,
        });
        
         const baseUrl = env('CLIENT_URL') || env('FRONTEND_URL');
         return `${baseUrl}/api/preview?${urlSearchParams}`;
      },
    },
  },
});
