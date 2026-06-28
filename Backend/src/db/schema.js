import { pgTable, varchar, integer, text, jsonb, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const researchHistory = pgTable('research_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  ticker: varchar('ticker', { length: 20 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  verdict: varchar('verdict', { length: 20 }).notNull(),
  confidence: integer('confidence').notNull(),
  targetRange: varchar('target_range', { length: 50 }).notNull(),
  summary: text('summary').notNull(),
  swot: jsonb('swot').notNull(),
  sentiment: jsonb('sentiment').notNull(),
  financials: jsonb('financials').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
