import { connectDatabase } from '../config/database.js';
import { migrateLegacyJsonIfNeeded } from '../services/legacyMigrationService.js';
import { repositories } from '../repositories/index.js';
await connectDatabase();
const result=await migrateLegacyJsonIfNeeded();
const products=await repositories.products.findAll();const seen=new Set(products.map(p=>String(p.code||'').toUpperCase()).filter(Boolean));for(const p of products){const patch={};if(!p.status)patch.status='Active';if(!p.code){let code;do{code=`SE-${String(p.id).replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`}while(seen.has(code));seen.add(code);patch.code=code;}if(Object.keys(patch).length)await repositories.products.update(p.id,patch);}
console.log(`Seed completed: ${result.filter(x=>x.imported).reduce((s,x)=>s+x.imported,0)} records imported. Non-empty collections were left unchanged.`);
process.exit(0);
