import { Router } from 'express';
import { z } from 'zod';
import { productService, type CatalogQuery } from '../services/product.service';

const router = Router();
const catalogQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  trending: z.enum(['true', 'false']).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const hasFilters = Object.keys(req.query).length > 0;

    if (hasFilters) {
      const query = catalogQuerySchema.parse(req.query);
      const catalogQuery: CatalogQuery = {
        q: query.q,
        categorySlug: query.category,
        featured: query.featured === 'true',
        trending: query.trending === 'true',
        sort: query.sort,
        page: query.page ?? 1,
        limit: query.limit ?? 12,
      };
      const data = await productService.listCatalog(catalogQuery);
      return res.json({ success: true, data, requestId: req.requestId });
    }

    const products = await productService.listPublic();
    res.json({ success: true, data: products, requestId: req.requestId });
  } catch (e) {
    next(e);
  }
});

router.get('/catalog/featured', async (req, res, next) => {
  try {
    const data = await productService.listCatalog({ featured: true, limit: 8 });
    res.json({ success: true, data: data.items });
  } catch (e) {
    next(e);
  }
});

router.get('/:slug/related', async (req, res, next) => {
  try {
    const related = await productService.getRelated(req.params.slug);
    res.json({ success: true, data: related });
  } catch (e) {
    next(e);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await productService.getBySlug(req.params.slug);
    if (!product) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

export default router;
