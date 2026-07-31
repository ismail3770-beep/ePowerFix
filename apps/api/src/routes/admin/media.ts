import { Router } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { asyncHandler } from '../../lib/api-handler.js';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_PREFIX = process.env.PUBLIC_UPLOAD_PREFIX || '/uploads';

async function scanDirectory(dir: string, baseDir: string): Promise<any[]> {
  const items = await fs.readdir(dir).catch(() => []);
  const results = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath).catch(() => null);

    if (!stat) continue;

    if (stat.isDirectory()) {
      const subItems = await scanDirectory(fullPath, baseDir);
      results.push(...subItems);
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        id: Math.random().toString(36).substring(7),
        filename: item,
        thumbnail: `${PUBLIC_PREFIX}/${relativePath}`,
        createdAt: stat.birthtime || stat.mtime
      });
    }
  }

  return results;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      return res.json({ data: [] });
    }

    const files = await scanDirectory(UPLOAD_DIR, UPLOAD_DIR);
    // Sort by createdAt desc
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ data: files });
  })
);

export default router;
