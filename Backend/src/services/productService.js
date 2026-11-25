import { repositories } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
export async function listProducts({search='',q='',category='all',brand='all',sort='featured',page=1,limit=12,minPrice,maxPrice,minRating,inStock,includeInactive=false}={}) {
 const query=String(search||q).trim(); const filter={}; if(!includeInactive)filter.status={$ne:'Inactive'};
 if(category&&category!=='all')filter.$and=[...(filter.$and||[]),{$or:[{categorySlug:category},{category}]}];
 if(brand&&brand!=='all')filter.brand=brand;
 const price={};let min=null,max=null;if(minPrice!==undefined&&minPrice!==''){min=Number(minPrice);if(!Number.isFinite(min)||min<0)throw new HttpError(400,'minPrice must be a non-negative number.');price.$gte=min;}if(maxPrice!==undefined&&maxPrice!==''){max=Number(maxPrice);if(!Number.isFinite(max)||max<0)throw new HttpError(400,'maxPrice must be a non-negative number.');price.$lte=max;}if(min!==null&&max!==null&&min>max)throw new HttpError(400,'minPrice cannot exceed maxPrice.');if(Object.keys(price).length)filter.price=price;
 if(minRating!==undefined&&minRating!==''){const n=Number(minRating);if(!Number.isFinite(n)||n<0||n>5)throw new HttpError(400,'minRating must be between 0 and 5.');filter.rating={$gte:n};}
 if(inStock==='true')filter.stock={$gt:0}; else if(inStock==='false')filter.stock={$lte:0};else if(inStock!==undefined&&inStock!==''&&inStock!==null)throw new HttpError(400,'inStock must be true or false.');
 if(query)filter.$and=[...(filter.$and||[]),{$or:['title','description','brand','category','subcategory','tags'].map(k=>({[k]:{$regex:escapeRegex(query),$options:'i'}}))}];
 const sortMap={price_asc:{price:1},price_desc:{price:-1},rating:{rating:-1},newest:{createdAt:-1},featured:{featured:-1}}; const safePage=Math.max(1,Math.floor(Number(page)||1)),safeLimit=Math.min(48,Math.max(1,Math.floor(Number(limit)||12)));
 const [products,total]=await Promise.all([repositories.products.find(filter,{sort:sortMap[sort]||sortMap.featured,skip:(safePage-1)*safeLimit,limit:safeLimit}),repositories.products.count(filter)]);
 return {products,pagination:{page:safePage,limit:safeLimit,total,pages:Math.ceil(total/safeLimit)}};
}
const escapeRegex=(s)=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export async function getProduct(id,{includeInactive=false}={}){const p=await repositories.products.findById(id);return p&&!includeInactive&&p.status==='Inactive'?null:p;}
