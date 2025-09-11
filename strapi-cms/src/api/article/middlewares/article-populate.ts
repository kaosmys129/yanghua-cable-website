/**
 * `article-populate` middleware
 */

import type { Core } from "@strapi/strapi";

const populateQuery = {
  cover: {
    fields: ["name", "alternativeText", "url"],
  },
  category: {
    fields: ["name", "slug"],
  },
  author: {
    populate: {
      avatar: {
        fields: ["url", "alternativeText", "width", "height"],
      },
    },
  },
  blocks: {
    on: {
      "shared.rich-text": true,
      "shared.quote": true,
      "shared.slider": {
        populate: {
          files: {
            fields: ["name", "url", "alternativeText"],
          },
        },
      },
      "shared.media": {
        populate: {
          file: {
            fields: ["url", "alternativeText", "width", "height"],
          },
        },
      },
    },
  },
};

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  // Add your own logic here.
  console.log("--------------------------------");
  console.log("In article-populate middleware.");
  console.log("--------------------------------");

  return async (ctx, next) => {
    strapi.log.info("In article-populate middleware.");

    ctx.query = {
      ...ctx.query,
      populate: populateQuery,
    };

    await next();
  };
};
