## Schemas for relational DB tables (Postgres DB):
1. All schemas are in the <project-root>/db-init-scripts/01-create-databases.sql file
2. Relevant postgres schemas (in the sense of a namespace) are common & assets.
3. The relevant tables in common are: users, accounts & groups.
4. The relevant tables in assets are: hypotheses, experiments, objectives, context, metrics & project.

## Schemas for MongoDB collections:
1. The only relevant database is assets.
2. The only relevant collections in this database is threads.
3. The schema for the collection is in the  <project-root>/sever/src/services/threadsModel.ts file
