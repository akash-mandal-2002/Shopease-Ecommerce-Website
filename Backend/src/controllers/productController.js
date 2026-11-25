import { repositories } from '../repositories/index.js';
import { getProduct, listProducts } from '../services/productService.js';
import { HttpError } from '../utils/httpError.js';

export async function getProducts(req, res) {
  const result = await listProducts({ ...req.query, includeInactive: req.user?.role === 'admin' && req.query.includeInactive === 'true' });
  res.json({ success: true, data: result.products, pagination: result.pagination });
}
export async function getProductById(req, res) {
  const product = await getProduct(req.params.id, { includeInactive: req.user?.role === 'admin' });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ success: true, data: product });
}
export async function getCategories(_req, res) { res.json({ success: true, data: await repositories.categories.findAll() }); }
const PRODUCT_FIELDS=['title','description','price','mrp','category','categorySlug','subcategory','brand','images','tags','variants','stock','featured','trending','new','status'];
function productInput(body, partial=false){const data=Object.fromEntries(Object.entries(body||{}).filter(([k])=>PRODUCT_FIELDS.includes(k)));if(data.title!==undefined)data.title=String(data.title).trim();if(data.description!==undefined)data.description=String(data.description).trim();for(const k of ['price','mrp','stock'])if(data[k]!==undefined)data[k]=Number(data[k]);if(data.title!==undefined&&data.title.length<2)throw new HttpError(400,'Title must contain at least 2 characters.');if(data.description!==undefined&&data.description.length<1)throw new HttpError(400,'Description is required.');if(data.price!==undefined&&(!Number.isFinite(data.price)||data.price<0))throw new HttpError(400,'Price must be a non-negative number.');if(data.stock!==undefined&&(!Number.isInteger(data.stock)||data.stock<0))throw new HttpError(400,'Stock must be a non-negative integer.');if(data.mrp!==undefined&&(!Number.isFinite(data.mrp)||data.mrp<data.price))throw new HttpError(400,'MRP must be greater than or equal to price.');if(data.status!==undefined&&!['Active','Inactive'].includes(data.status))throw new HttpError(400,'Status must be Active or Inactive.');if(data.categorySlug){const slug=String(data.categorySlug);data.categorySlug=slug; }if(data.images!==undefined&&!Array.isArray(data.images))data.images=String(data.images).split(',').map(x=>x.trim()).filter(Boolean);if(data.tags!==undefined&&!Array.isArray(data.tags))data.tags=String(data.tags).split(',').map(x=>x.trim()).filter(Boolean);if(data.price!==undefined&&data.mrp!==undefined)data.discount=data.mrp>0?Math.max(0,Math.round((1-data.price/data.mrp)*100)):0;return data;}
export async function createProduct(req,res){const data=productInput(req.body);if(!data.title||!data.description||!data.categorySlug||data.price===undefined)throw new HttpError(400,'Title, description, category and a valid price are required.');const category=await repositories.categories.findOne({slug:data.categorySlug});if(!category)throw new HttpError(400,'Choose an existing category.');data.category=category.name;data.id=`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;data.code=`SE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;data.createdAt=new Date().toISOString();const product=await repositories.products.insert(data);res.status(201).json({success:true,data:product});}
export async function updateProduct(req,res){const patch=productInput(req.body,true);if(patch.categorySlug){const category=await repositories.categories.findOne({slug:patch.categorySlug});if(!category)throw new HttpError(400,'Choose an existing category.');patch.category=category.name;}const existing=await repositories.products.findById(req.params.id);if(!existing)throw new HttpError(404,'Product not found.');const price=patch.price??existing.price,mrp=patch.mrp??existing.mrp;if(mrp!==undefined&&Number(mrp)<Number(price))throw new HttpError(400,'MRP must be greater than or equal to price.');if(patch.price!==undefined||patch.mrp!==undefined)patch.discount=Number(mrp)>0?Math.max(0,Math.round((1-Number(price)/Number(mrp))*100)):0;const product=await repositories.products.update(req.params.id,patch);res.json({success:true,data:product});}
export async function deleteProduct(req, res) {
  const deleted = await repositories.products.remove(req.params.id);
  if (!deleted) throw new HttpError(404, 'Product not found.');
  res.json({ success: true, message: 'Product deleted.' });
}
