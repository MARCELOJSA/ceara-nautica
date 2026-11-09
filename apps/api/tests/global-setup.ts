import { prepareTestDatabase } from '../scripts/test-db.js';

export default async function setup() {
  const url = await prepareTestDatabase();
  process.env.TEST_DATABASE_URL = url;
}
