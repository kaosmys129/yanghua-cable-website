// tina/config.ts
import { defineConfig, LocalAuthProvider } from "tinacms";
var localeOptions = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" }
];
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
function sanitizeSlugSegment(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
var config_default = defineConfig({
  branch: process.env.GIT_BRANCH || process.env.HEAD || "main",
  clientId: "",
  token: "",
  contentApiUrlOverride: "/api/tina/gql",
  authProvider: isLocal ? new LocalAuthProvider() : void 0,
  build: {
    outputFolder: "cms",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "articles",
        label: "Articles",
        path: "content/articles",
        format: "mdx",
        ui: {
          allowedActions: {
            create: true,
            delete: true,
            createFolder: false,
            createNestedFolder: false
          },
          filename: {
            description: "\u4F7F\u7528 locale/slug \u7ED3\u6784\uFF0C\u4F8B\u5982 en/my-article \u6216 es/mi-articulo\u3002",
            slugify: (values) => {
              const locale = values?.locale === "es" ? "es" : "en";
              const base = values?.slug || values?.title || "untitled-article";
              const slug = sanitizeSlugSegment(String(base));
              return `${locale}/${slug || "untitled-article"}`;
            }
          }
        },
        fields: [
          { name: "sourceId", label: "Source ID", type: "number", required: true },
          { name: "translationKey", label: "Translation Key", type: "string", required: true },
          { name: "locale", label: "Locale", type: "string", options: localeOptions, required: true },
          { name: "slug", label: "Slug", type: "string", required: true },
          { name: "title", label: "Title", type: "string", required: true },
          { name: "description", label: "Description", type: "string", required: true },
          { name: "createdAt", label: "Created At", type: "datetime", required: true },
          { name: "updatedAt", label: "Updated At", type: "datetime", required: true },
          { name: "publishedAt", label: "Published At", type: "datetime", required: true },
          { name: "sourceUrl", label: "Source URL", type: "string" },
          {
            name: "cover",
            label: "Cover",
            type: "object",
            fields: [
              { name: "src", label: "Source", type: "string" },
              { name: "alt", label: "Alt", type: "string" }
            ]
          },
          {
            name: "category",
            label: "Category",
            type: "object",
            fields: [
              { name: "name", label: "Name", type: "string" },
              { name: "slug", label: "Slug", type: "string" }
            ]
          },
          {
            name: "author",
            label: "Author",
            type: "object",
            fields: [
              { name: "name", label: "Name", type: "string" },
              { name: "email", label: "Email", type: "string" },
              {
                name: "avatar",
                label: "Avatar",
                type: "object",
                fields: [
                  { name: "src", label: "Source", type: "string" },
                  { name: "alt", label: "Alt", type: "string" },
                  { name: "width", label: "Width", type: "number" },
                  { name: "height", label: "Height", type: "number" }
                ]
              }
            ]
          },
          {
            name: "relatedSlugs",
            label: "Related Slugs",
            type: "string",
            list: true
          },
          { name: "fallbackLocale", label: "Fallback Locale", type: "string" },
          { name: "bodySource", label: "Body Source", type: "string" },
          { name: "body", label: "Body", type: "string", isBody: true }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
