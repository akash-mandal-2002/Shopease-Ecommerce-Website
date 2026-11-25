import { repositories } from '../repositories/index.js';import { HttpError } from '../utils/httpError.js';
const subtotalOf=items=>items.reduce((s,i)=>s+i.price*i.quantity,0);
export async function createOrder({userId,shippingAddress,billingAddress=shippingAddress,paymentMethod,paymentDetails={}}){const cart=await repositories.carts.findOne({userId:String(userId)});if(!cart||!cart.items?.length)throw new HttpError(400,'Your cart is empty.');const orderItems=[];for(const item of cart.items){const p=await repositories.products.findById(item.productId);if(!p||p.status==='Inactive')throw new HttpError(400,`Product ${item.productId} is no longer available.`);const qty=Number(item.quantity);if(!Number.isInteger(qty)||qty<1)throw new HttpError(400,'Invalid cart quantity.');orderItems.push({productId:p.id,title:p.title,image:p.images?.[0]||'',price:Number(p.price)||0,quantity:qty,variant:item.variant||null});}
 if(paymentMethod!=='cod'){const details=paymentDetails||{};if(paymentMethod==='upi'&&!/^[\w.-]+@[\w.-]+$/.test(String(details.upiId||'')))throw new HttpError(402,'Payment failed, try again');if(paymentMethod==='netbanking'&&!['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Punjab National Bank'].includes(String(details.bank||'')))throw new HttpError(402,'Payment failed, try again');if(paymentMethod==='card'){const expiry=String(details.expiry||'');const match=/^(0[1-9]|1[0-2])\/([0-9]{2})$/.exec(expiry);const now=new Date();const expired=!match||2000+Number(match[2])<now.getFullYear()||(2000+Number(match[2])===now.getFullYear()&&Number(match[1])<now.getMonth()+1);if(!/^\d{4}$/.test(String(details.cardLast4||''))||!['Visa','Mastercard','American Express','Card'].includes(String(details.cardBrand||''))||!String(details.cardHolder||'').trim()||expired)throw new HttpError(402,'Payment failed, try again');}if(details.expired===true)throw new HttpError(402,'Payment failed, try again');}
 const subtotal=subtotalOf(orderItems),shipping=subtotal>=999?0:79,tax=Math.round(subtotal*.05),totalAmount=subtotal+shipping+tax,now=new Date().toISOString(),orderId=`ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,paymentId=`PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
 const paymentStatus=paymentMethod==='cod'?'pending':'success';const order={id:orderId,userId:String(userId),orderDate:now,status:'confirmed',statusHistory:[{status:'confirmed',at:now,by:String(userId)}],stockRestored:false,returnStatus:'not_requested',shippingAddress,billingAddress,items:orderItems,subtotal,shipping,tax,totalAmount,paymentMethod,paymentStatus,paymentId};const decremented=[];
 try{for(const item of orderItems){const ok=await repositories.products.decrementIfAvailable(item.productId,item.quantity);if(!ok)throw new HttpError(409,`${item.title} stock changed. Please review your cart.`);decremented.push({id:item.productId,quantity:item.quantity});}await repositories.orders.insert(order);await repositories.payments.insert({id:paymentId,orderId,amount:totalAmount,method:paymentMethod,provider:'demo',transactionId:paymentMethod==='cod'?null:`DEMO-TXN-${Date.now()}`,status:paymentStatus,paymentDate:now,note:paymentMethod==='cod'?'Cash on delivery':'Simulated payment; no real gateway transaction occurred.',cardLast4:paymentMethod==='card'?paymentDetails.cardLast4:undefined,cardBrand:paymentMethod==='card'?paymentDetails.cardBrand:undefined});await repositories.carts.update(cart.id,{items:[],updatedAt:now});return order;}catch(error){for(const i of decremented)await repositories.products.increment(i.id,i.quantity);await repositories.orders.remove(orderId);await repositories.payments.remove(paymentId);throw error;}}
export async function changeOrderStatus(order,nextStatus,actor){
 const allowed={confirmed:['dispatched','cancelled'],dispatched:['delivered','cancelled'],delivered:[],cancelled:[]};
 if(!allowed[order.status]?.includes(nextStatus))throw new HttpError(409,`Cannot change order status from ${order.status} to ${nextStatus}.`);
 if(nextStatus==='cancelled'&&actor.role!=='admin'&&order.status!=='confirmed')throw new HttpError(409,'Customers can cancel only confirmed orders.');
 const now=new Date().toISOString();
 const shouldRestore=nextStatus==='cancelled'&&!order.stockRestored;
 let paymentStatus=order.paymentStatus;
 const payment=order.paymentId?await repositories.payments.findById(order.paymentId):(await repositories.payments.findOne({orderId:order.id}));
 let paymentPatch={};
 if(nextStatus==='cancelled'){
   if(order.paymentMethod==='cod'){paymentStatus='failed';paymentPatch={status:'failed',note:'Order cancelled'};}
   else paymentPatch={note:'Refund to be processed (simulated)'};
 }
 if(nextStatus==='delivered'&&order.paymentMethod==='cod'){paymentStatus='success';paymentPatch={status:'success',note:'Cash on delivery collected at delivery'};}
 const history=[...(order.statusHistory||[]),{status:nextStatus,at:now,by:String(actor.id||actor.role)}];
 // Compare-and-set the current status so concurrent requests cannot both restore stock.
 const updated=await repositories.orders.compareAndUpdate(order.id,{status:order.status},{status:nextStatus,paymentStatus,stockRestored:order.stockRestored===true||shouldRestore,statusHistory:history,...(nextStatus==='cancelled'?{cancelledAt:now}:{})});
 if(!updated)throw new HttpError(409,'The order status changed in another request. Refresh and try again.');
 if(shouldRestore){for(const item of order.items||[])await repositories.products.increment(item.productId,Number(item.quantity||0));}
 if(payment&&Object.keys(paymentPatch).length)await repositories.payments.update(payment.id,paymentPatch);
 return updated;
}
