
const { createStrapi } = require('@strapi/strapi');

async function generateToken() {
  const strapi = await createStrapi().load();
  
  try {
    const tokenService = strapi.service('admin::api-token');
    
    if (!tokenService) {
        console.error('Token service not found');
        return;
    }

    // Create a full access token
    const token = await tokenService.create({
      name: 'Migration Token ' + Date.now(),
      type: 'full-access',
      lifespan: 7 * 24 * 60 * 60 * 1000, // 7 days
      description: 'Temporary token for migration',
    });

    console.log('TOKEN_GENERATED:', token.accessKey);
  } catch (e) {
    console.error(e);
  } finally {
    await strapi.destroy();
  }
}

generateToken();
