(() => {
"use strict";
const KEY = "servicepilot_v1";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0,10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2,8));
const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:state.settings.currency||"INR",maximumFractionDigits:2}).format(Number(n||0));
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaultState = () => ({
  version:1,
  settings:{businessName:"My Service Business",ownerName:"",email:"",phone:"",address:"",currency:"INR",language:"en",invoicePrefix:"SP",nextInvoice:1001},
  clients:[], sales:[], jobs:[], invoices:[], expenses:[], products:[], tasks:[], services:[]
});
let state = loadState();
let currentView = "dashboard";
let searchTerm = "";
function loadState(){
  try { const x=JSON.parse(localStorage.getItem(KEY)); if(x && x.version===1) return {...defaultState(),...x,settings:{...defaultState().settings,...x.settings}}; } catch(e){}
  return defaultState();
}
function save(){ localStorage.setItem(KEY,JSON.stringify(state)); $("#storage-status").textContent="Saved on this device"; }
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function setView(view){currentView=view;searchTerm="";$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#page-title").textContent=({"dashboard":"Overview","clients":"Clients","sales":"Sales records","jobs":"Jobs & projects","invoices":"Invoices","expenses":"Expenses","products":"Products & inventory","tasks":"Tasks & KPI","services":"Service templates","calculator":"Profit calculator","reports":"Reports","settings":"Settings & backup"})[view]||"Overview";$("#sidebar").classList.remove("open");render();}
function pageHead(title,desc,action=""){return `<div class="page-head"><div><div class="eyebrow">SERVICEPILOT WORKSPACE</div><h1>${title}</h1><p>${desc}</p></div><div class="head-actions">${action}</div></div>`}
function stat(label,value,icon,note=""){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function statusPill(s){const cls=String(s||"").toLowerCase().replace(/\s+/g,"-");return `<span class="pill ${esc(cls)}">${esc(s||"—")}</span>`}
function clientName(id){return state.clients.find(c=>c.id===id)?.name||"Deleted client"}
function jobName(id){return state.jobs.find(j=>j.id===id)?.title||"General service"}
function recentActivity(){
  const all=[
    ...state.clients.map(x=>({date:x.createdAt||today(),icon:"♙",title:"Client added",desc:x.name,amount:""})),
    ...state.jobs.map(x=>({date:x.date||today(),icon:"▤",title:"Job updated",desc:x.title,amount:money(x.price)})),
    ...state.invoices.map(x=>({date:x.date||today(),icon:"▧",title:"Invoice "+x.number,desc:clientName(x.clientId),amount:money(x.total)}))
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  return all.length?`<div class="activity-list">${all.map(x=>`<div class="activity-item"><div class="activity-dot">${x.icon}</div><div><strong>${esc(x.title)}</strong><small>${esc(x.desc)} · ${esc(x.date)}</small></div><div class="activity-amount">${x.amount}</div></div>`).join("")}</div>`:`<div class="empty"><b>Your workspace is ready</b>Add a client or job to see activity here.</div>`;
}
function renderDashboard(){
 const income=state.invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+Number(i.total),0);
 const outstanding=state.invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+Number(i.total),0);
 const expenses=state.expenses.reduce((s,e)=>s+Number(e.amount),0);
 const activeJobs=state.jobs.filter(j=>!["Completed","Cancelled"].includes(j.status)).length;
 const totalJobs=state.jobs.length||1;
 const done=state.jobs.filter(j=>j.status==="Completed").length;
 return pageHead("Good work starts here.","A clear view of your clients, projects and cash flow.",`<button class="btn" data-action="export">↧ Backup data</button><button class="btn btn-primary" data-action="new-job">＋ New job</button>`)
 + `<div class="grid stats-grid">${stat("Paid invoices",money(income),"↗","Total marked as paid")}${stat("Outstanding",money(outstanding),"◷","Invoices not marked paid")}${stat("Recorded expenses",money(expenses),"↘","All expenses entered")}${stat("Active jobs",activeJobs,"▤",`${state.jobs.length} jobs in total`)}</div>
 <div class="grid two-col"><div class="panel"><div class="panel-head"><div><h2>Recent activity</h2><p>Your latest workspace updates</p></div><button class="text-link" data-view="jobs">View jobs →</button></div>${recentActivity()}</div>
 <div class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Get routine work done faster</p></div></div><div class="quick-grid">
 <button class="quick-card" data-action="new-client"><span>♙</span><strong>Add client</strong><small>Save contact details</small></button>
 <button class="quick-card" data-action="new-job"><span>▤</span><strong>Create job</strong><small>Track work and price</small></button>
 <button class="quick-card" data-action="new-invoice"><span>▧</span><strong>New invoice</strong><small>Prepare a PDF invoice</small></button>
 <button class="quick-card" data-view="reports"><span>◷</span><strong>View reports</strong><small>Review income and costs</small></button>
 </div><div style="margin-top:24px"><div class="panel-head"><h2>Job progress</h2><span class="small-muted">${done} completed</span></div><div class="progress-row"><div class="progress-label"><span>Completed jobs</span><span>${Math.round(done/totalJobs*100)}%</span></div><div class="progress"><i style="width:${Math.round(done/totalJobs*100)}%"></i></div></div><div class="progress-row"><div class="progress-label"><span>Open jobs</span><span>${activeJobs}</span></div><div class="progress"><i style="width:${Math.min(100,activeJobs/totalJobs*100)}%;background:#e3a43c"></i></div></div></div></div></div>`;
}
function tablePage(kind){
 const configs={
 clients:{title:"Clients",desc:"Keep customer details and their service history together.",btn:"＋ Add client",action:"new-client",rows:state.clients,empty:"No clients yet",headers:["Client","Contact","Company","Added","Actions"]},
 jobs:{title:"Jobs & projects",desc:"Track work from request to completion.",btn:"＋ New job",action:"new-job",rows:state.jobs,empty:"No jobs yet",headers:["Job","Client","Due date","Price","Status","Actions"]},
 invoices:{title:"Invoices",desc:"Prepare invoices and track which payments are still due.",btn:"＋ New invoice",action:"new-invoice",rows:state.invoices,empty:"No invoices yet",headers:["Invoice","Client","Date","Due date","Total","Status","Actions"]},
 expenses:{title:"Expenses",desc:"Record business costs so your profit view is more useful.",btn:"＋ Add expense",action:"new-expense",rows:state.expenses,empty:"No expenses recorded",headers:["Expense","Category","Date","Amount","Actions"]}
 };
 const c=configs[kind], q=searchTerm.toLowerCase();
 let rows=c.rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
 let body="";
 if(kind==="clients") body=rows.map(x=>`<tr><td><strong>${esc(x.name)}</strong><small>${esc(x.email||"No email")}</small></td><td>${esc(x.phone||"—")}</td><td>${esc(x.company||"—")}</td><td>${esc(x.createdAt||"—")}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-client" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-client" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 if(kind==="jobs") body=rows.map(x=>`<tr><td><strong>${esc(x.title)}</strong><small>${esc(x.description||"")}</small></td><td>${esc(clientName(x.clientId))}</td><td>${esc(x.dueDate||"—")}</td><td>${money(x.price)}</td><td>${statusPill(x.status)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-job" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-job" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 if(kind==="invoices") body=rows.map(x=>`<tr><td><strong>${esc(x.number)}</strong></td><td>${esc(clientName(x.clientId))}</td><td>${esc(x.date)}</td><td>${esc(x.dueDate||"—")}</td><td><strong>${money(x.total)}</strong></td><td>${statusPill(x.status)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="view-invoice" data-id="${x.id}">View / PDF</button><button class="btn btn-small" data-action="toggle-paid" data-id="${x.id}">${x.status==="Paid"?"Mark due":"Mark paid"}</button><button class="btn btn-small btn-danger" data-action="delete-invoice" data-id="${x.id}">×</button></div></td></tr>`).join("");
 if(kind==="expenses") body=rows.map(x=>`<tr><td><strong>${esc(x.title)}</strong><small>${esc(x.note||"")}</small></td><td>${esc(x.category||"Other")}</td><td>${esc(x.date)}</td><td><strong>${money(x.amount)}</strong></td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-expense" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-expense" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 return pageHead(c.title,c.desc,`<button class="btn btn-primary" data-action="${c.action}">${c.btn}</button>`)
 + `<div class="table-wrap"><div class="table-toolbar"><div class="small-muted">${rows.length} record${rows.length===1?"":"s"}</div><input class="search" id="table-search" placeholder="Search ${kind}…" value="${esc(searchTerm)}"></div><div class="table-scroll"><table><thead><tr>${c.headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>${rows.length?"":`<div class="empty"><b>${c.empty}</b>Use the button above to add your first record.</div>`}</div></div>`;
}
function renderReports(){
 const paid=state.invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+Number(i.total),0);
 const due=state.invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+Number(i.total),0);
 const exp=state.expenses.reduce((s,e)=>s+Number(e.amount),0);
 const profit=paid-exp;
 const category={};state.expenses.forEach(e=>category[e.category||"Other"]=(category[e.category||"Other"]||0)+Number(e.amount));
 return pageHead("Reports","A simple snapshot based on the records you have entered.",`<button class="btn" data-action="export">↧ Export backup</button><button class="btn" data-action="export-csv">Export invoices CSV</button>`)
 + `<div class="grid stats-grid">${stat("Paid income",money(paid),"↗","Invoices marked paid")}${stat("Outstanding",money(due),"◷","Not yet marked paid")}${stat("Expenses",money(exp),"↘","Expenses recorded")}${stat("Cash-basis balance",money(profit),"◈","Paid income minus recorded expenses")}</div>
 <div class="grid report-grid"><div class="report-box"><h3>Business summary</h3><div class="report-line"><span>Total clients</span><strong>${state.clients.length}</strong></div><div class="report-line"><span>Total jobs</span><strong>${state.jobs.length}</strong></div><div class="report-line"><span>Completed jobs</span><strong>${state.jobs.filter(j=>j.status==="Completed").length}</strong></div><div class="report-line"><span>Total invoices</span><strong>${state.invoices.length}</strong></div><div class="report-line"><span>Paid invoices</span><strong>${state.invoices.filter(i=>i.status==="Paid").length}</strong></div></div>
 <div class="report-box"><h3>Expenses by category</h3>${Object.keys(category).length?Object.entries(category).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="report-line"><span>${esc(k)}</span><strong>${money(v)}</strong></div>`).join(""):`<div class="empty">Add expenses to see category totals.</div>`}</div></div>
 <div class="notice" style="margin-top:16px">This is an operational summary, not a tax, accounting or legal report. Confirm tax treatment and statutory requirements with a qualified professional before relying on figures for filings.</div>`;
}
function renderSettings(){
 return pageHead("Settings & backup","Set your business identity and keep a copy of your data.",`<button class="btn btn-primary" data-action="save-settings">Save settings</button>`)
 + `<div class="grid settings-grid"><div class="setting-card"><h3>Business profile</h3><p>These details appear on invoices you print or save as PDF.</p><form id="settings-form"><div class="form-grid">
 ${field("businessName","Business name",state.settings.businessName,"text",true)}
 ${field("ownerName","Owner / contact person",state.settings.ownerName)}
 ${field("phone","Phone",state.settings.phone,"tel")}
 ${field("email","Email",state.settings.email,"email")}
 ${field("address","Business address",state.settings.address,"text",false,true)}
 ${field("invoicePrefix","Invoice prefix",state.settings.invoicePrefix)}
 <div class="field"><label>Currency</label><select name="currency">${["INR","USD","GBP","EUR","BDT","AED"].map(c=>`<option ${state.settings.currency===c?"selected":""}>${c}</option>`).join("")}</select></div>
 </div></form></div>
 <div class="setting-card"><h3>Backup & restore</h3><p>Your records are stored in this browser on this device. Export backups regularly. Clearing browser data may erase your records.</p><div style="display:grid;gap:9px"><button class="btn btn-primary" data-action="export">Download full JSON backup</button><label class="btn" for="restore-file">Restore from JSON backup</label><input id="restore-file" type="file" accept="application/json,.json" hidden><button class="btn" data-action="export-csv">Export invoices CSV</button><button class="btn" data-action="export-clients-csv">Export clients CSV</button></div><div class="notice" style="margin-top:16px">For privacy, do not use this starter to store highly sensitive personal, identity or financial data. Backup files contain your business records.</div></div>
 <div class="setting-card"><h3>Data & privacy</h3><p>ServicePilot Starter has no user account or cloud sync. Records stay in this browser unless you export them.</p><button class="btn btn-danger" data-action="clear-data">Delete all local data</button></div>
 <div class="setting-card"><h3>About this edition</h3><p>Starter MVP build. No payment processor, cloud sync, license enforcement, email sending or automatic WhatsApp messaging is included.</p><p class="small-muted">Before selling, test on real Android devices, publish a privacy policy, define support terms and confirm applicable consumer/tax obligations.</p></div></div>`;
}
function field(name,label,value="",type="text",required=false,full=false){
 return `<div class="field ${full?"full":""}"><label for="${name}">${label}${required?" *":""}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?"required":""}></div>`;
}
function selectField(name,label,options,value,full=false){
 return `<div class="field ${full?"full":""}"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(o=>`<option value="${esc(o)}" ${value===o?"selected":""}>${esc(o)}</option>`).join("")}</select></div>`;
}


function renderSales(){
 const total=state.sales.reduce((a,x)=>a+Number(x.amount||0),0);
 return pageHead("Sales records","Record sales separately from invoices and review payment status.",`<button class="btn" data-action="export-sales">Export CSV</button><button class="btn btn-primary" data-action="new-sale">＋ Record sale</button>`)
 + `<div class="grid stats-grid">${stat("Sales total",money(total),"↗","All recorded sales")}${stat("Paid",money(state.sales.filter(x=>x.status==="Paid").reduce((a,x)=>a+Number(x.amount||0),0)),"✓","Marked paid")}${stat("Pending",money(state.sales.filter(x=>x.status!=="Paid").reduce((a,x)=>a+Number(x.amount||0),0)),"◷","Not marked paid")}${stat("Transactions",state.sales.length,"▤","Sales entries")}</div><div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Date</th><th>Sale ID</th><th>Customer</th><th>Description</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.sales.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.number)}</td><td>${esc(x.customer||"—")}</td><td>${esc(x.description)}</td><td><strong>${money(x.amount)}</strong></td><td>${statusPill(x.status)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-sale" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-sale" data-id="${x.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>${state.sales.length?"":'<div class="empty"><b>No sales recorded</b>Record sales here independently from invoices.</div>'}</div></div>`;
}
function editSale(id=null){
 const o=state.sales.find(x=>x.id===id)||{};
 openModal(id?"Edit sale":"Record sale",`<div class="form-grid">${field("number","Sale ID",o.number||("SALE-"+Date.now().toString().slice(-6)),"text",true)}${field("date","Date",o.date||today(),"date",true)}${field("customer","Customer",o.customer||"")}${field("description","Sale description",o.description||"","text",true,true)}${field("amount","Amount (₹)",o.amount??0,"number",true)}${selectField("status","Payment status",["Paid","Pending","Part-paid","Refunded"],o.status||"Paid")}${field("notes","Notes",o.notes||"","text",false,true)}</div>`,d=>{if(!d.number.trim()||!d.description.trim()||Number(d.amount)<0)return false;const x={...o,...d,id:o.id||uid(),amount:+d.amount};state.sales=o.id?state.sales.map(v=>v.id===id?x:v):[x,...state.sales];toast("Sale saved")});
}
function exportSales(){const rows=[["Date","Sale ID","Customer","Description","Amount","Payment Status","Notes"],...state.sales.map(x=>[x.date,x.number,x.customer,x.description,x.amount,x.status,x.notes])];download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-sales-${today()}.csv`)}

function renderProducts(){
 const low=state.products.filter(p=>Number(p.stock||0)<=Number(p.reorder||0));
 return pageHead("Products & inventory","Maintain product records, stock levels, cost and selling prices.",`<button class="btn" data-action="export-products">Export CSV</button><button class="btn btn-primary" data-action="new-product">＋ Add product</button>`)
 + `<div class="grid stats-grid">${stat("Products",state.products.length,"▣","Catalog items")}${stat("Stock units",state.products.reduce((a,p)=>a+Number(p.stock||0),0),"▤","Units on hand")}${stat("Low-stock items",low.length,"!","At or below reorder level")}${stat("Stock cost value",money(state.products.reduce((a,p)=>a+Number(p.stock||0)*Number(p.cost||0),0)),"₹","Estimated cost value")}</div>
 <div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder at</th><th>Unit cost</th><th>Selling price</th><th>Actions</th></tr></thead><tbody>${state.products.map(p=>`<tr><td><strong>${esc(p.name)}</strong><small>${esc(p.category||"")}</small></td><td>${esc(p.sku||"—")}</td><td>${Number(p.stock||0)<=Number(p.reorder||0)?statusPill("Low stock"):Number(p.stock||0)}</td><td>${Number(p.reorder||0)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-product" data-id="${p.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>${state.products.length?"":'<div class="empty"><b>No products yet</b>Add products to track inventory and low-stock alerts.</div>'}</div></div>`;
}
function renderTasks(){
 const open=state.tasks.filter(t=>t.status!=="Done");
 return pageHead("Tasks, goals & KPI","Track everyday work, due dates, priorities and measurable targets.",`<button class="btn btn-primary" data-action="new-task">＋ Add task</button>`)
 + `<div class="grid stats-grid">${stat("All tasks",state.tasks.length,"✓","Tasks and goals")}${stat("Open",open.length,"◷","Still to do")}${stat("Completed",state.tasks.length-open.length,"✔","Marked done")}${stat("Overdue",open.filter(t=>t.due&&t.due<today()).length,"!","Past due date")}</div>
 <div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Task / KPI</th><th>Due date</th><th>Priority</th><th>Target</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.tasks.map(t=>`<tr><td><strong>${esc(t.title)}</strong><small>${esc(t.note||"")}</small></td><td>${esc(t.due||"—")}</td><td>${esc(t.priority||"Normal")}</td><td>${esc(t.target||"—")}</td><td>${statusPill(t.status)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="toggle-task" data-id="${t.id}">${t.status==="Done"?"Reopen":"Mark done"}</button><button class="btn btn-small" data-action="edit-task" data-id="${t.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-task" data-id="${t.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>${state.tasks.length?"":'<div class="empty"><b>No tasks yet</b>Add a task, goal or KPI to begin tracking.</div>'}</div></div>`;
}
function renderServices(){
 return pageHead("Service templates","Save reusable service prices, estimated costs, processing time and document checklists.",`<button class="btn btn-primary" data-action="new-service">＋ Add service</button>`)
 + `<div class="grid two-col">${state.services.map(v=>`<div class="panel"><div class="panel-head"><div><h2>${esc(v.name)}</h2><p>${esc(v.category||"Custom service")} · ${esc(v.turnaround||"Time not set")}</p></div><button class="btn btn-small" data-action="edit-service" data-id="${v.id}">Edit</button></div><div class="report-line"><span>Customer charge</span><strong>${money(v.charge)}</strong></div><div class="report-line"><span>Estimated cost</span><strong>${money(Number(v.direct||0)+Number(v.other||0))}</strong></div><div class="report-line"><span>Estimated profit</span><strong>${money(Number(v.charge||0)-Number(v.direct||0)-Number(v.other||0))}</strong></div><p class="small-muted">Required documents: ${esc(v.docs||"No checklist set")}</p><button class="btn btn-small btn-danger" data-action="delete-service" data-id="${v.id}">Delete template</button></div>`).join("")}</div>${state.services.length?"":'<div class="empty"><b>No service templates</b>Create reusable service records and define your own document checklist.'}</div>`;
}
function renderCalculator(){
 return pageHead("Service cost & profit calculator","Estimate charges, direct costs, overhead and margin before accepting work.")
 + `<div class="setting-card" style="max-width:760px"><div class="form-grid">
 ${selectField("calcType","Work type",["Online service / form filling","Freelance work","Product sale","Custom service"],"Online service / form filling")}
 ${field("calcCharge","Customer charge (₹)","500","number",true)}
 ${field("calcDirect","Direct cost (₹)","150","number",true)}
 ${field("calcOther","Other costs (₹)","30","number",true)}
 </div><div class="grid stats-grid" style="margin-top:18px;grid-template-columns:repeat(2,minmax(0,1fr))"><div class="stat-card"><div class="stat-top">Total charge</div><div class="stat-value" id="calc-total">₹500.00</div></div><div class="stat-card"><div class="stat-top">Total cost</div><div class="stat-value" id="calc-cost">₹180.00</div></div><div class="stat-card"><div class="stat-top">Estimated profit</div><div class="stat-value" id="calc-profit">₹320.00</div></div><div class="stat-card"><div class="stat-top">Profit margin</div><div class="stat-value" id="calc-margin">64.0%</div></div></div><p class="notice">Estimate only. Taxes, refunds, your own labour and missing costs can change actual profit. The default document checklist is not official legal guidance.</p><button class="btn btn-primary" data-action="save-calculator-service">Save as service template</button></div>`;
}
function editProduct(id=null){const o=state.products.find(x=>x.id===id)||{};openModal(id?"Edit product":"Add product",`<div class="form-grid">${field("name","Product name",o.name||"","text",true)}${field("sku","SKU / code",o.sku||"")}${field("category","Category",o.category||"")}${field("stock","Current stock",o.stock??0,"number",true)}${field("reorder","Low-stock threshold",o.reorder??0,"number",true)}${field("cost","Unit cost",o.cost??0,"number",true)}${field("price","Selling price",o.price??0,"number",true)}</div>`,d=>{if(!d.name.trim())return false;const x={...o,...d,id:o.id||uid(),stock:+d.stock,reorder:+d.reorder,cost:+d.cost,price:+d.price};state.products=o.id?state.products.map(p=>p.id===id?x:p):[x,...state.products];toast("Product saved")})}
function editTask(id=null){const o=state.tasks.find(x=>x.id===id)||{};openModal(id?"Edit task":"Add task or KPI",`<div class="form-grid">${field("title","Task / goal name",o.title||"","text",true)}${field("due","Due date",o.due||"","date")}${selectField("priority","Priority",["Low","Normal","High","Urgent"],o.priority||"Normal")}${selectField("status","Status",["To do","In progress","Done"],o.status||"To do")}${field("target","Target / KPI",o.target||"")}${field("note","Notes",o.note||"","text",false,true)}</div>`,d=>{if(!d.title.trim())return false;const x={...o,...d,id:o.id||uid()};state.tasks=o.id?state.tasks.map(t=>t.id===id?x:t):[x,...state.tasks];toast("Task saved")})}
function editService(id=null){const o=state.services.find(x=>x.id===id)||{};openModal(id?"Edit service template":"Add service template",`<div class="form-grid">${field("name","Service name",o.name||"","text",true)}${field("category","Work type",o.category||"Online service")}${field("charge","Customer charge (₹)",o.charge??0,"number",true)}${field("direct","Direct cost (₹)",o.direct??0,"number",true)}${field("other","Other costs (₹)",o.other??0,"number",true)}${field("turnaround","Processing time",o.turnaround||"")}${field("docs","Required documents (comma-separated)",o.docs||"","text",false,true)}</div><p class="small-muted">You define the checklist. Verify official requirements separately.</p>`,d=>{if(!d.name.trim())return false;const x={...o,...d,id:o.id||uid(),charge:+d.charge,direct:+d.direct,other:+d.other};state.services=o.id?state.services.map(v=>v.id===id?x:v):[x,...state.services];toast("Service template saved")})}
function exportProducts(){const rows=[["Name","SKU","Category","Stock","Reorder threshold","Unit cost","Selling price"],...state.products.map(p=>[p.name,p.sku,p.category,p.stock,p.reorder,p.cost,p.price])];download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-products-${today()}.csv`)}

function render(){
 const root=$("#view-root");
 if(currentView==="dashboard") root.innerHTML=renderDashboard();
 else if(["clients","jobs","invoices","expenses"].includes(currentView)) root.innerHTML=tablePage(currentView);
 else if(currentView==="sales") root.innerHTML=renderSales();
 else if(currentView==="products") root.innerHTML=renderProducts();
 else if(currentView==="tasks") root.innerHTML=renderTasks();
 else if(currentView==="services") root.innerHTML=renderServices();
 else if(currentView==="calculator") root.innerHTML=renderCalculator();
 else if(currentView==="reports") root.innerHTML=renderReports();
 else if(currentView==="settings") root.innerHTML=renderSettings();
}
function openModal(title,body,onSubmit,submitLabel="Save"){
 const d=$("#modal");
 $("#modal-content").innerHTML=`<div class="modal-inner"><div class="modal-head"><h2>${title}</h2><button class="close-btn" type="button" data-action="close-modal">×</button></div><form id="modal-form">${body}<div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${submitLabel}</button></div></form></div>`;
 d.showModal();
 $("#modal-form").onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());if(onSubmit(data)!==false){d.close();save();render();}};
}
function editClient(id=null){
 const old=state.clients.find(x=>x.id===id)||{};
 openModal(id?"Edit client":"Add client",`<div class="form-grid">${field("name","Client name",old.name||"","text",true)}${field("company","Company",old.company||"")}${field("phone","Phone",old.phone||"","tel")}${field("email","Email",old.email||"","email")}${field("address","Address",old.address||"","text",false,true)}${field("notes","Notes",old.notes||"","text",false,true)}</div>`,d=>{
  if(!d.name.trim()){toast("Client name is required.");return false}
  const x={...old,...d,id:old.id||uid(),createdAt:old.createdAt||today()}; if(old.id)state.clients=state.clients.map(c=>c.id===id?x:c);else state.clients.unshift(x);toast(old.id?"Client updated":"Client added");
 });
}
function editJob(id=null){
 const old=state.jobs.find(x=>x.id===id)||{};
 openModal(id?"Edit job":"Create job",`<div class="form-grid">${field("title","Job title",old.title||"","text",true)}${selectField("clientId","Client",state.clients.map(c=>c.id),old.clientId||"")}${field("date","Start date",old.date||today(),"date")}${field("dueDate","Due date",old.dueDate||"","date")}${field("price","Quoted price",old.price??"","number")}${selectField("status","Status",["New","In progress","Waiting","Completed","Cancelled"],old.status||"New")}${field("description","Description",old.description||"","text",false,true)}</div>`,d=>{
  if(!d.title.trim()){toast("Job title is required.");return false}
  const x={...old,...d,id:old.id||uid(),price:Number(d.price||0)};if(old.id)state.jobs=state.jobs.map(j=>j.id===id?x:j);else state.jobs.unshift(x);toast(old.id?"Job updated":"Job created");
 });
}
function editExpense(id=null){
 const old=state.expenses.find(x=>x.id===id)||{};
 openModal(id?"Edit expense":"Add expense",`<div class="form-grid">${field("title","Expense name",old.title||"","text",true)}${field("amount","Amount",old.amount??"","number",true)}${selectField("category","Category",["Software","Travel","Materials","Marketing","Phone & internet","Office","Contractor","Other"],old.category||"Other")}${field("date","Date",old.date||today(),"date")}${field("note","Notes",old.note||"","text",false,true)}</div>`,d=>{
  if(!d.title.trim()||!Number.isFinite(Number(d.amount))||Number(d.amount)<0){toast("Enter a name and valid amount.");return false}
  const x={...old,...d,id:old.id||uid(),amount:Number(d.amount)};if(old.id)state.expenses=state.expenses.map(e=>e.id===id?x:e);else state.expenses.unshift(x);toast(old.id?"Expense updated":"Expense added");
 });
}
function editInvoice(id=null){
 const old=state.invoices.find(x=>x.id===id)||{};
 const clientOpts=state.clients.map(c=>`<option value="${esc(c.id)}" ${old.clientId===c.id?"selected":""}>${esc(c.name)}</option>`).join("");
 openModal(id?"Edit invoice":"New invoice",`<div class="form-grid">
 <div class="field"><label>Client *</label><select name="clientId" required><option value="">Choose client</option>${clientOpts}</select></div>
 ${field("date","Invoice date",old.date||today(),"date",true)}${field("dueDate","Due date",old.dueDate||"","date")}
 ${field("description","Description",old.description||"Service provided","text",true,true)}
 ${field("subtotal","Amount before tax",old.subtotal??"","number",true)}
 ${field("taxRate","Tax rate (%)",old.taxRate??0,"number")}
 ${selectField("status","Payment status",["Due","Paid","Overdue"],old.status||"Due")}
 </div><p class="small-muted">Check local tax rules before issuing tax invoices. This starter does not validate GST registration or statutory invoice requirements.</p>`,d=>{
  if(!d.clientId||!d.description.trim()||!Number.isFinite(Number(d.subtotal))||Number(d.subtotal)<0||Number(d.taxRate)<0){toast("Complete required fields with valid amounts.");return false}
  let number=old.number;if(!number){number=(state.settings.invoicePrefix||"SP")+"-"+state.settings.nextInvoice;state.settings.nextInvoice++}
  const subtotal=Number(d.subtotal),taxRate=Number(d.taxRate||0);
  const x={...old,...d,id:old.id||uid(),number,subtotal,taxRate,tax:Math.round(subtotal*taxRate)/100,total:Math.round(subtotal*(1+taxRate/100)*100)/100};
  if(old.id)state.invoices=state.invoices.map(i=>i.id===id?x:i);else state.invoices.unshift(x);toast(old.id?"Invoice updated":"Invoice created");
 });
}
function invoiceHtml(i){
 const s=state.settings,c=state.clients.find(x=>x.id===i.clientId)||{};
 return `<div class="invoice-preview" id="print-invoice"><div class="invoice-head"><div><div class="brand" style="padding:0 0 15px"><div class="brand-mark">S</div><div><strong>${esc(s.businessName)}</strong><small>${esc(s.ownerName||"Service provider")}</small></div></div><div class="small-muted">${esc(s.address||"")}${s.phone?"<br>"+esc(s.phone):""}${s.email?"<br>"+esc(s.email):""}</div></div><div style="text-align:right"><div class="eyebrow">INVOICE</div><h2>${esc(i.number)}</h2><div class="small-muted">Issue date: ${esc(i.date)}<br>Due date: ${esc(i.dueDate||"—")}<br>Status: ${esc(i.status)}</div></div></div>
 <div style="margin-bottom:22px"><div class="small-muted">BILL TO</div><strong>${esc(c.name||"Client")}</strong><div class="small-muted">${esc(c.company||"")}${c.email?"<br>"+esc(c.email):""}${c.address?"<br>"+esc(c.address):""}</div></div>
 <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>${esc(i.description)}</td><td>${money(i.subtotal)}</td></tr>${Number(i.taxRate)?`<tr><td>Tax (${Number(i.taxRate)}%)</td><td>${money(i.tax)}</td></tr>`:""}</tbody></table>
 <div class="invoice-total">Total: ${money(i.total)}</div><p class="small-muted" style="margin-top:24px">Thank you for your business. Please contact us if you have questions about this invoice.</p></div>`;
}
function viewInvoice(id){
 const i=state.invoices.find(x=>x.id===id);if(!i)return;
 const d=$("#modal");$("#modal-content").innerHTML=`<div class="modal-inner"><div class="modal-head"><h2>Invoice ${esc(i.number)}</h2><button class="close-btn" data-action="close-modal">×</button></div><div class="no-print" style="display:flex;gap:8px;margin-bottom:15px"><button class="btn btn-primary" data-action="print-invoice">Print / Save PDF</button><button class="btn" data-action="copy-invoice" data-id="${i.id}">Copy payment reminder</button></div>${invoiceHtml(i)}</div>`;d.showModal();
}
function exportJson(){
 const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
 download(blob,`servicepilot-backup-${today()}.json`);toast("Backup downloaded");
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function csvCell(v){return '"'+String(v??"").replace(/"/g,'""')+'"'}
function exportCsv(kind){
 const rows=kind==="clients"?[["Name","Company","Phone","Email","Address","Notes"],...state.clients.map(c=>[c.name,c.company,c.phone,c.email,c.address,c.notes])]:[["Invoice","Client","Date","Due date","Description","Subtotal","Tax rate","Tax","Total","Status"],...state.invoices.map(i=>[i.number,clientName(i.clientId),i.date,i.dueDate,i.description,i.subtotal,i.taxRate,i.tax,i.total,i.status])];
 download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-${kind}-${today()}.csv`);toast("CSV exported");
}
function deleteRecord(kind,id){
 const labels={clients:"client",sales:"sale",jobs:"job",invoices:"invoice",expenses:"expense",products:"product",tasks:"task",services:"service template"};
 if(!confirm(`Delete this ${labels[kind]}? This cannot be undone unless you have a backup.`))return;
 state[kind]=state[kind].filter(x=>x.id!==id);save();render();toast("Record deleted");
}
function doAction(a,id){
 if(a==="new-sale")editSale();else if(a==="edit-sale")editSale(id);else if(a==="delete-sale")deleteRecord("sales",id);else if(a==="export-sales")exportSales();

 if(a==="new-product")editProduct();else if(a==="edit-product")editProduct(id);else if(a==="delete-product")deleteRecord("products",id);else if(a==="export-products")exportProducts();
 else if(a==="new-task")editTask();else if(a==="edit-task")editTask(id);else if(a==="delete-task")deleteRecord("tasks",id);else if(a==="toggle-task"){const t=state.tasks.find(t=>t.id===id);if(t)t.status=t.status==="Done"?"To do":"Done";save();render()}
 else if(a==="new-service")editService();else if(a==="edit-service")editService(id);else if(a==="delete-service")deleteRecord("services",id);
 else if(a==="save-calculator-service"){const q=n=>Number(document.getElementById(n)?.value||0);editService();setTimeout(()=>{const f=$("#modal-form");if(f){f.elements.name.value=$("#calcType")?.value||"Custom service";f.elements.charge.value=q("calcCharge");f.elements.direct.value=q("calcDirect");f.elements.other.value=q("calcOther")}},50)}
 if(a==="new-client")editClient();else if(a==="edit-client")editClient(id);
 else if(a==="new-job")editJob();else if(a==="edit-job")editJob(id);
 else if(a==="new-expense")editExpense();else if(a==="edit-expense")editExpense(id);
 else if(a==="new-invoice")editInvoice();else if(a==="view-invoice")viewInvoice(id);
 else if(a==="delete-client")deleteRecord("clients",id);else if(a==="delete-job")deleteRecord("jobs",id);else if(a==="delete-expense")deleteRecord("expenses",id);else if(a==="delete-invoice")deleteRecord("invoices",id);
 else if(a==="toggle-paid"){const i=state.invoices.find(x=>x.id===id);if(i){i.status=i.status==="Paid"?"Due":"Paid";save();render();toast("Invoice status updated")}}
 else if(a==="export")exportJson();else if(a==="export-csv")exportCsv("invoices");else if(a==="export-clients-csv")exportCsv("clients");
 else if(a==="close-modal")$("#modal").close();
 else if(a==="print-invoice")window.print();
 else if(a==="copy-invoice"){const i=state.invoices.find(x=>x.id===id);if(i){const msg=`Hello ${clientName(i.clientId)}, a friendly reminder that invoice ${i.number} for ${money(i.total)} is currently ${i.status.toLowerCase()}. Due date: ${i.dueDate||"not specified"}. Please let me know if you need any details.`;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).then(()=>toast("Reminder copied")).catch(()=>prompt("Copy this message",msg));else prompt("Copy this message",msg)}}
 else if(a==="save-settings"){saveSettings()}
 else if(a==="clear-data"){if(confirm("Permanently delete all ServicePilot data stored in this browser? Export a backup first if needed.")){localStorage.removeItem(KEY);state=defaultState();save();render();toast("Local data cleared")}}
}
function saveSettings(){
 const f=$("#settings-form");if(!f)return;const d=Object.fromEntries(new FormData(f).entries());if(!d.businessName?.trim()){toast("Business name is required");return}
 state.settings={...state.settings,...d};save();render();toast("Settings saved");
}
document.addEventListener("click",e=>{
 const view=e.target.closest("[data-view]");if(view){setView(view.dataset.view);return}
 const b=e.target.closest("[data-action]");if(b){doAction(b.dataset.action,b.dataset.id);return}
});
document.addEventListener("input",e=>{if(e.target.id==="table-search"){searchTerm=e.target.value;const pos=e.target.selectionStart;render();const n=$("#table-search");if(n){n.focus();n.setSelectionRange(pos,pos)}}});
document.addEventListener("input",e=>{if(["calcCharge","calcDirect","calcOther"].includes(e.target.id)){const n=id=>Number(document.getElementById(id)?.value||0),c=n("calcCharge"),cost=n("calcDirect")+n("calcOther");$("#calc-total").textContent=money(c);$("#calc-cost").textContent=money(cost);$("#calc-profit").textContent=money(c-cost);$("#calc-margin").textContent=(c?((c-cost)/c*100):0).toFixed(1)+"%"}});
$("#quick-add").addEventListener("click",()=>openModal("Add new",`<div class="quick-grid"><button type="button" class="quick-card" data-action="new-client"><span>♙</span><strong>Client</strong></button><button type="button" class="quick-card" data-action="new-job"><span>▤</span><strong>Job</strong></button><button type="button" class="quick-card" data-action="new-invoice"><span>▧</span><strong>Invoice</strong></button><button type="button" class="quick-card" data-action="new-expense"><span>↘</span><strong>Expense</strong></button></div>`,()=>false,"Choose"));
$("#menu-btn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#view-root").addEventListener("click",e=>{if(e.target.closest('[data-action="save-settings"]'))saveSettings()});
document.addEventListener("change",e=>{
 if(e.target.id==="restore-file"){
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();reader.onload=()=>{try{const x=JSON.parse(reader.result);if(!x||x.version!==1||!Array.isArray(x.clients)||!Array.isArray(x.jobs)||!Array.isArray(x.invoices)||!Array.isArray(x.expenses))throw new Error("Invalid backup format");if(confirm("Replace the current data with this backup? Export current data first if needed.")){state={...defaultState(),...x,settings:{...defaultState().settings,...x.settings}};save();render();toast("Backup restored")}}catch(err){alert("Could not restore this file. Choose a valid ServicePilot JSON backup.")}};reader.readAsText(file);
 }
});
$("#settings-form")?.addEventListener("submit",e=>{e.preventDefault();saveSettings()});
window.addEventListener("online",()=>$("#network-state").textContent="● Online · local data");
window.addEventListener("offline",()=>$("#network-state").textContent="● Offline · local data");
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
$("#network-state").textContent=navigator.onLine?"● Online · local data":"● Offline · local data";
render();
})();