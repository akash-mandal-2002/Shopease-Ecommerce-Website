import {apiRequest} from './api';export const inquiryApi={create:p=>apiRequest('/inquiries',{method:'POST',body:JSON.stringify(p)}),mine:()=>apiRequest('/inquiries/mine')};
