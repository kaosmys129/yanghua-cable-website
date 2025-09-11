import Strapi, { StrapiLocale } from "strapi-sdk-js";
import { getStrapiURL } from "./utils";
import { Article } from "./types";

const STRAPI_BASE_URL = getStrapiURL();
const strapi = new Strapi({ url: STRAPI_BASE_URL });

export async function getAllArticles(): Promise<{ data: Article[] }> {
  try {
    const articles = await strapi.find("articles", {
      populate: {
        cover: { populate: "*" },
        author: {
          populate: {
            avatar: { populate: "*" },
          },
        },
        blocks: {
          populate: "*",
        },
      },
    });
    return articles as { data: Article[] };
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
}

export async function getArticleBySlug(slug: string, locale?: StrapiLocale): Promise<Article | null> {
  try {
    console.log(slug, "slug");
    const articles = await strapi.find("articles", {
      filters: { slug: { $eq: slug } },
      populate: {
        cover: { populate: "*" },
        author: {
          populate: {
            avatar: { populate: "*" },
          },
        },
        blocks: {
          populate: "*",
        },
      },
      locale: locale
    });
    return (articles?.data?.[0] as Article) || null;
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    throw error;
  }
}