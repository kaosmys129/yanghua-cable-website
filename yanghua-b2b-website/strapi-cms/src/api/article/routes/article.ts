import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
  },
});