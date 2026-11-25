import {useEffect,useState} from 'react';import {adminApi} from '../../services/adminApi';
export default function UsersTab({user,onNotice})
{const [items,setItems]=useState([]),[q,setQ]=useState('');
    const load=async()=>setItems((await adminApi.users()).data);
    useEffect(()=>{load().catch(e=>onNotice(e.message))},[onNotice]);return 
    <section className="mt-6"><div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-semibold">Customers and users</h2>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name/email/phone" className="rounded-xl border px-3 py-2"/>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50"><tr>{['Name','Email','Phone','Role','Joined','Orders','Actions'].map(x=><th key={x} className="p-3">{x}</th>)}</tr>
                </thead>
                <tbody>{items.filter(x=>`${x.name} ${x.email} ${x.phone}`.toLowerCase().includes(q.toLowerCase())).map(x=>
                    <tr key={x.id} className="border-t"><td className="p-3">{x.name}</td><td>{x.email}</td><td>{x.phone||'—'}</td>
                    <td><select disabled={x.id===user?.id} value={x.role} onChange={async e=>{try{await adminApi.updateUserRole(x.id,e.target.value);onNotice('Role updated. It applies to the next login.');await load()}catch(err){onNotice(err.message)}}} className="rounded-lg border p-2"><option value="customer">customer</option><option value="admin">admin</option></select></td><td>{x.createdAt?new Date(x.createdAt).toLocaleDateString('en-IN'):'—'}</td><td>{x.orderCount||0}</td><td><button disabled={x.id===user?.id} className="text-red-600 underline disabled:opacity-30" onClick={async()=>{if(confirm('Delete this user?'))try{await adminApi.deleteUser(x.id);await load()}catch(e){onNotice(e.message)}}}>Delete</button></td></tr>)}</tbody></table></div><p className="mt-2 text-xs text-gray-500">Role changes are reflected in the JWT after the user signs in again. Password hashes are not displayed.</p></section>}
