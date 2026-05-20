import { Router } from 'express';
import { productService, type CatalogQuery } from '../services/product.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const hasFilters = Object.keys(req.query).length > 0;

    if (hasFilters) {
      const data = await productService.listCatalog({
        q: req.query.q as string | undefined,
        categorySlug: req.query.category as string | undefined,
        featured: req.query.featured === 'true',
        trending: req.query.trending === 'true',
        sort: req.query.sort as CatalogQuery['sort'],
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 12,
      });
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
