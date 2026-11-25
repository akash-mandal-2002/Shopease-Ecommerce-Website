import { HttpError } from '../utils/httpError.js';
function clean(document) { if (!document) return null; const record={...document}; delete record._id; delete record.__v; return record; }
function normalizeMongoError(error) { if(error?.code===11000){const field=Object.keys(error.keyPattern||{})[0]||'value'; return new HttpError(409,`A record with this ${field} already exists.`);} return error; }
export function createMongoRepository(Model) { return {
 async findAll(){return (await Model.find({}).lean()).map(clean)},
 async find(filter={}, {sort,skip,limit,projection}={}) { let q=Model.find(filter,projection).lean(); if(sort)q=q.sort(sort); if(Number.isFinite(skip))q=q.skip(skip); if(Number.isFinite(limit))q=q.limit(limit); return (await q).map(clean); },
 async findMany(ids){return (await Model.find({id:{$in:ids.map(String)}}).lean()).map(clean)},
 async findById(id){return clean(await Model.findOne({id:String(id)}).lean())},
 async findOne(filter){return clean(await Model.findOne(filter).lean())},
 async insert(record){try{return clean((await Model.create({...record,id:String(record.id)})).toObject())}catch(e){throw normalizeMongoError(e)}},
 async update(id,patch){try{const safe={...patch};delete safe.id;delete safe._id;delete safe.__v; safe.updatedAt=new Date().toISOString(); return clean(await Model.findOneAndUpdate({id:String(id)},{$set:safe},{new:true,runValidators:true,lean:true}));}catch(e){throw normalizeMongoError(e)}},
 async compareAndUpdate(id,filter,patch){try{const safe={...patch};delete safe.id;delete safe._id;delete safe.__v;safe.updatedAt=new Date().toISOString();return clean(await Model.findOneAndUpdate({id:String(id),...filter},{$set:safe},{new:true,runValidators:true,lean:true}));}catch(e){throw normalizeMongoError(e)}},
 async remove(id){return (await Model.deleteOne({id:String(id)})).deletedCount>0},
 async replace(records){if(!Array.isArray(records))throw new HttpError(400,'Replacement data must be an array.');if(records.length){const ops=records.map(r=>{if(r?.id==null||String(r.id).trim()==='')throw new HttpError(400,'Every record must have an id.');const replacement={...r,id:String(r.id)};delete replacement._id;delete replacement.__v;return {updateOne:{filter:{id:replacement.id},update:{$set:replacement},upsert:true}}});try{await Model.bulkWrite(ops,{ordered:true});await Model.deleteMany({id:{$nin:records.map(r=>String(r.id))}})}catch(e){throw normalizeMongoError(e)}}else await Model.deleteMany({});return this.findAll()},
 async count(filter={}){return Model.countDocuments(filter)},
 async decrementIfAvailable(id,qty){const r=await Model.updateOne({id:String(id),stock:{$gte:Number(qty)}},{$inc:{stock:-Number(qty)}});return r.modifiedCount===1},
 async increment(id,qty){const r=await Model.updateOne({id:String(id)},{$inc:{stock:Number(qty)}});return r.modifiedCount===1},
 async bulkWrite(operations){if(!Array.isArray(operations)||!operations.length)return {modifiedCount:0};return Model.bulkWrite(operations,{ordered:false})},
 async aggregate(pipeline){return Model.aggregate(pipeline)},
 }; }
