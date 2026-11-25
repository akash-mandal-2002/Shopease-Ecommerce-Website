import { apiRequest } from './api';
export const adminApi={
 orders:()=>apiRequest('/orders'),updateOrderStatus:(id,status)=>apiRequest(`/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
 createProduct:p=>apiRequest('/products',{method:'POST',body:JSON.stringify(p)}),updateProduct:(id,p)=>apiRequest(`/products/${id}`,{method:'PATCH',body:JSON.stringify(p)}),deleteProduct:id=>apiRequest(`/products/${id}`,{method:'DELETE'}),
 createCategory:p=>apiRequest('/categories',{method:'POST',body:JSON.stringify(p)}),updateCategory:(id,p)=>apiRequest(`/categories/${id}`,{method:'PATCH',body:JSON.stringify(p)}),deleteCategory:id=>apiRequest(`/categories/${id}`,{method:'DELETE'}),
 users:()=>apiRequest('/admin/users'),updateUserRole:(id,role)=>apiRequest(`/admin/users/${id}/role`,{method:'PATCH',body:JSON.stringify({role})}),deleteUser:id=>apiRequest(`/admin/users/${id}`,{method:'DELETE'}),
 returnStatus:(id,returnStatus,note)=>apiRequest(`/admin/orders/${id}/return-status`,{method:'PATCH',body:JSON.stringify({returnStatus,note})}),payments:()=>apiRequest('/admin/payments'),reports:params=>apiRequest(`/admin/reports?${new URLSearchParams(params||{})}`),inquiries:()=>apiRequest('/admin/inquiries'),updateInquiry:(id,p)=>apiRequest(`/admin/inquiries/${id}`,{method:'PATCH',body:JSON.stringify(p)}),
};
