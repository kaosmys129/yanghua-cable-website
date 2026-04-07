import { defineConfig, LocalAuthProvider } from 'tinacms';
import {
  ARTICLE_LOCALE_OPTIONS,
  getRequiredArticleFieldErrors,
  normalizeArticleEditorValues,
} from '../src/lib/content/articles-workflow';

export default defineConfig({
  branch: process.env.GIT_BRANCH || process.env.HEAD || 'main',
  clientId: '',
  token: '',
  contentApiUrlOverride: '/api/tina/gql',
  authProvider: new LocalAuthProvider(),
  build: {
    outputFolder: 'cms',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: '',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'articles',
        label: 'Articles',
        path: 'content/articles',
        format: 'mdx',
        ui: {
          allowedActions: {
            create: true,
            delete: true,
            createFolder: false,
            createNestedFolder: false,
          },
          beforeSubmit: async (values) => {
            const normalized = normalizeArticleEditorValues(values as any);
            const requiredErrors = getRequiredArticleFieldErrors(normalized);

            if (requiredErrors.length > 0) {
              throw new Error(requiredErrors.join('；'));
            }

            return normalized as any;
          },
          filename: {
            description: '使用 locale/slug 结构，例如 en/my-article 或 es/mi-articulo。',
            slugify: (values) => {
              const normalized = normalizeArticleEditorValues(values as any);
              return `${normalized.locale}/${normalized.slug || 'untitled-article'}`;
            },
          },
        },
        fields: [
          { name: 'sourceId', label: 'Source ID', type: 'number', required: true },
          {
            name: 'translationKey',
            label: 'Translation Key',
            type: 'string',
            required: true,
            description: '英西双语文章的配对主键。英文可新建，西语必须关联既有英文 translationKey。',
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'translationKey 为必填项' : undefined),
            },
          },
          {
            name: 'locale',
            label: 'Locale',
            type: 'string',
            options: ARTICLE_LOCALE_OPTIONS as any,
            required: true,
            description: '英文文章请选择 en，西语文章请选择 es。西语文章保存前会校验英文配对是否存在。',
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'locale 为必填项' : undefined),
            },
          },
          {
            name: 'slug',
            label: 'Slug',
            type: 'string',
            required: true,
            description: '用于前台 URL。保存前会自动标准化，且同 locale 下必须唯一。',
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'slug 为必填项' : undefined),
            },
          },
          {
            name: 'title',
            label: 'Title',
            type: 'string',
            required: true,
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'title 为必填项' : undefined),
            },
          },
          {
            name: 'description',
            label: 'Description',
            type: 'string',
            required: true,
            description: '前台列表、SEO 描述和后台运营检查都会依赖这个摘要。',
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'description 为必填项' : undefined),
            },
          },
          { name: 'createdAt', label: 'Created At', type: 'datetime', required: true },
          { name: 'updatedAt', label: 'Updated At', type: 'datetime', required: true },
          {
            name: 'publishedAt',
            label: 'Published At',
            type: 'datetime',
            required: true,
            ui: {
              validate: (value) => (!String(value || '').trim() ? 'publishedAt 为必填项' : undefined),
            },
          },
          { name: 'sourceUrl', label: 'Source URL', type: 'string' },
          {
            name: 'cover',
            label: 'Cover',
            type: 'object',
            fields: [
              { name: 'src', label: 'Source', type: 'string' },
              { name: 'alt', label: 'Alt', type: 'string' },
            ],
          },
          {
            name: 'category',
            label: 'Category',
            type: 'object',
            fields: [
              { name: 'name', label: 'Name', type: 'string' },
              { name: 'slug', label: 'Slug', type: 'string' },
            ],
          },
          {
            name: 'author',
            label: 'Author',
            type: 'object',
            fields: [
              { name: 'name', label: 'Name', type: 'string' },
              { name: 'email', label: 'Email', type: 'string' },
              {
                name: 'avatar',
                label: 'Avatar',
                type: 'object',
                fields: [
                  { name: 'src', label: 'Source', type: 'string' },
                  { name: 'alt', label: 'Alt', type: 'string' },
                  { name: 'width', label: 'Width', type: 'number' },
                  { name: 'height', label: 'Height', type: 'number' },
                ],
              },
            ],
          },
          {
            name: 'relatedSlugs',
            label: 'Related Slugs',
            type: 'string',
            list: true,
            description: '可选。仅填写同 locale 下存在的 slug。',
          },
          { name: 'fallbackLocale', label: 'Fallback Locale', type: 'string' },
          { name: 'bodySource', label: 'Body Source', type: 'string' },
          {
            name: 'body',
            label: 'Body',
            type: 'string',
            isBody: true,
            description: '当前以稳定写盘为优先，正文采用原始 Markdown/MDX 文本编辑。',
          },
        ],
      },
    ],
  },
});
