-- Init PostgreSQL with pgvector (runs once on first container start)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
