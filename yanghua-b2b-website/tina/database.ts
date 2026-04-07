import { createDatabaseInternal, createSchema, FilesystemBridge, type Database } from '@tinacms/graphql';
import { MemoryLevel } from 'memory-level';

import graphQLSchema from './__generated__/_graphql.json';
import lookup from './__generated__/_lookup.json';
import schemaDefinition from './__generated__/_schema.json';

let databasePromise: Promise<Database> | null = null;

async function initializeDatabase(): Promise<Database> {
  const bridge = new FilesystemBridge(process.cwd());
  const level = new MemoryLevel<string, Record<string, unknown>>({
    valueEncoding: 'json',
  });

  const database = createDatabaseInternal({
    bridge,
    level,
    tinaDirectory: 'tina',
  });

  const tinaSchema = await createSchema({
    schema: schemaDefinition as any,
  });

  await database.indexContent({
    graphQLSchema: graphQLSchema as any,
    tinaSchema,
    lookup: lookup as any,
  });

  return database;
}

export async function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
}

export default getDatabase;
