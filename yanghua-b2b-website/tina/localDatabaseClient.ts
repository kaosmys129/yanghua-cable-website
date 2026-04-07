import { resolve } from '@tinacms/datalayer';

import { getDatabase } from './database';
import { validateArticleDraft } from '../src/lib/content/articles-validation';

type RequestArgs = {
  query: string;
  variables?: Record<string, unknown>;
  user?: { sub: string };
};

type ArticleMutationPayload = {
  kind: 'create' | 'update';
  relativePath?: string;
  values: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractArticleMutationPayload(query: string, variables: Record<string, unknown>): ArticleMutationPayload | null {
  const isCreate = query.includes('createDocument') || query.includes('createArticles');
  const isUpdate = query.includes('updateDocument') || query.includes('updateArticles');

  if (!isCreate && !isUpdate) {
    return null;
  }

  const collection = typeof variables.collection === 'string' ? variables.collection : 'articles';
  if (query.includes('Document') && collection !== 'articles') {
    return null;
  }

  const params = isRecord(variables.params) ? variables.params : {};
  const values = isRecord(params.articles) ? params.articles : params;

  if (!isRecord(values)) {
    return null;
  }

  const relativePath = typeof variables.relativePath === 'string' ? variables.relativePath : undefined;

  return {
    kind: isCreate ? 'create' : 'update',
    relativePath,
    values,
  };
}

function mergeNormalizedPayload(variables: Record<string, unknown>, normalizedValues: Record<string, unknown>) {
  const nextVariables = structuredClone(variables);
  const params = isRecord(nextVariables.params) ? nextVariables.params : {};

  if (isRecord(params.articles)) {
    params.articles = {
      ...params.articles,
      ...normalizedValues,
    };
  } else {
    Object.assign(params, normalizedValues);
  }

  nextVariables.params = params;
  return nextVariables;
}

export async function databaseRequest({ query, variables = {}, user }: RequestArgs) {
  const mutationPayload = extractArticleMutationPayload(query, variables);
  let nextVariables = variables;

  if (mutationPayload) {
    const validation = validateArticleDraft(mutationPayload.values as any, {
      relativePath: mutationPayload.relativePath,
    });

    if (validation.errors.length > 0) {
      throw new Error(validation.errors.join('；'));
    }

    if (validation.warnings.length > 0) {
      console.warn(`[tina/articles] ${validation.warnings.join(' | ')}`);
    }

    nextVariables = mergeNormalizedPayload(variables, validation.normalizedValues as Record<string, unknown>);
  }

  const database = await getDatabase();

  return resolve({
    config: {
      useRelativeMedia: true,
    },
    database,
    query,
    variables: nextVariables,
    verbose: true,
    ctxUser: user,
  });
}

export async function request(args: RequestArgs) {
  const result = await databaseRequest(args);

  return {
    data: result.data as any,
    query: args.query,
    variables: args.variables ?? {},
    errors: result.errors || null,
  };
}

export async function authenticate({ username, password }: { username: string; password: string }) {
  return databaseRequest({
    query: `query auth($username:String!, $password:String!) {
      authenticate(sub:$username, password:$password) {
      }
    }`,
    variables: { username, password },
  });
}

export async function authorize(user: { sub: string }) {
  return databaseRequest({
    query: `query authz { authorize { } }`,
    variables: {},
    user,
  });
}

const localDatabaseClient = {
  request,
  authenticate,
  authorize,
};

export default localDatabaseClient;
