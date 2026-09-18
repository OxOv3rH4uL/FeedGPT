import { PrismaPg } from '@prisma/adapter-pg';
import {PrismaClient} from "../../prisma/generated/prisma/client.js"
import { Pool } from 'pg';
import dotenv from "dotenv";

dotenv.config();
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString})
const adapter = new PrismaPg(pool);
export const prismaClient = new PrismaClient({adapter});
