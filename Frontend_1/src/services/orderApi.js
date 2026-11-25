import { apiRequest } from './api';
export const orderApi = {
 create: payload => apiRequest('/orders',{method:'POST',body:JSON.stringify(payload)}), mine:()=>apiRequest('/orders/mine'),
 cancel:id=>apiRequest(`/orders/${id}/cancel`,{method:'POST'}), requestReturn:(id,reason)=>apiRequest(`/orders/${id}/return`,{method:'POST',body:JSON.stringify({reason})}), invoice:id=>apiRequest(`/orders/${id}/invoice`),
};
