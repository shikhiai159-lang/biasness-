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
  clients:[], jobs:[], invoices:[], expenses:[], services:[], serviceWorks:[]
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
function setView(view){currentView=view;searchTerm="";$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#page-title").textContent=({"dashboard":"Overview","clients":"Clients","jobs":"Jobs & projects","invoices":"Invoices","expenses":"Expenses","reports":"Reports","services":"Services & profit","settings":"Settings & backup"})[view]||"Overview";$("#sidebar").classList.remove("open");render();}
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

function renderServices(){
 const services=state.services||[], works=state.serviceWorks||[];
 const estimated=works.reduce((a,w)=>a+Number(w.estimatedCost||0),0), actual=works.reduce((a,w)=>a+Number(w.actualCost||0),0);
 const pending=works.filter(w=>w.paymentStatus!=="Paid").reduce((a,w)=>a+Number(w.charge||0),0);
 const opts=services.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
 return pageHead("Services & profit","Plan each service, check documents, estimate profit and track real work costs.",`<button class="btn" data-action="new-service-work">＋ Record work</button><button class="btn btn-primary" data-action="new-service">＋ Add service</button>`)
 + `<div class="notice">Document lists are user-defined reminders, not official or legally required document lists. Verify current requirements with the relevant authority. Customer documents should only be collected when necessary and stored securely.</div>
 <div class="grid stats-grid">${stat("Work charges",money(works.reduce((a,w)=>a+Number(w.charge||0),0)),"₹","Recorded service work")}${stat("Estimated costs",money(estimated),"◷","Before work starts")}${stat("Actual costs",money(actual),"↘","Costs entered after work")}${stat("Payments pending",money(pending),"!","Work not marked paid")}</div>
 <div class="grid two-col"><div class="panel"><div class="panel-head"><div><h2>Service cost & profit calculator</h2><p>Change the amounts to calculate immediately.</p></div></div>
 <div class="form-grid"><div class="field full"><label for="calc-kind">Work type</label><select id="calc-kind"><option>Online service / form filling</option><option>Freelance work</option><option>Product sale</option><option>Custom service</option></select></div>
 <div class="field"><label for="calc-charge">Customer charge (₹)</label><input id="calc-charge" type="number" min="0" step="0.01" value="500"></div><div class="field"><label for="calc-direct">Direct cost (₹)</label><input id="calc-direct" type="number" min="0" step="0.01" value="150"></div><div class="field full"><label for="calc-other">Other costs (₹)</label><input id="calc-other" type="number" min="0" step="0.01" value="30"></div></div>
 <div class="grid stats-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:18px;margin-bottom:0"><div class="stat-card"><div class="stat-top">Total charge</div><div class="stat-value" id="calc-total">₹500.00</div></div><div class="stat-card"><div class="stat-top">Total cost</div><div class="stat-value" id="calc-cost">₹180.00</div></div><div class="stat-card"><div class="stat-top">Estimated profit</div><div class="stat-value money-positive" id="calc-profit">₹320.00</div></div><div class="stat-card"><div class="stat-top">Profit margin</div><div class="stat-value" id="calc-margin">64.0%</div></div></div><p class="small-muted" style="margin-top:12px">Estimate only. Add taxes, refunds, your labour value and any omitted costs for a more realistic result.</p></div>
 <div class="panel"><div class="panel-head"><div><h2>Profit forecast</h2><p>Estimate monthly results from a typical job.</p></div></div><div class="form-grid"><div class="field"><label for="forecast-jobs">Jobs per month</label><input id="forecast-jobs" type="number" min="0" value="30"></div><div class="field"><label for="forecast-charge">Average charge (₹)</label><input id="forecast-charge" type="number" min="0" value="500"></div><div class="field full"><label for="forecast-cost">Average total cost per job (₹)</label><input id="forecast-cost" type="number" min="0" value="180"></div></div><div class="report-line"><span>Forecast revenue</span><strong id="forecast-revenue">₹15,000.00</strong></div><div class="report-line"><span>Forecast costs</span><strong id="forecast-cost-total">₹5,400.00</strong></div><div class="report-line"><span>Forecast profit</span><strong class="money-positive" id="forecast-profit">₹9,600.00</strong></div></div></div>
 <div class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Service templates</h2><p>Save your own price, document checklist and processing time.</p></div><span class="small-muted">${services.length} saved</span></div>${services.length?`<div class="table-scroll"><table><thead><tr><th>Service</th><th>Charge</th><th>Estimated cost</th><th>Processing</th><th>Documents checklist</th><th>Actions</th></tr></thead><tbody>${services.map(x=>`<tr><td><strong>${esc(x.name)}</strong><small>${esc(x.kind||"Custom service")}</small></td><td>${money(x.charge)}</td><td>${money(Number(x.directCost||0)+Number(x.otherCost||0))}</td><td>${esc(x.processing||"Not set")}</td><td>${(x.documents||[]).map((d,i)=>`<label style="display:block;margin:5px 0"><input type="checkbox" data-doc-service="${esc(x.id)}" data-doc-index="${i}" ${x.checked?.[i]?"checked":""}> ${esc(d)}</label>`).join("")||"No documents added"}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-service" data-id="${esc(x.id)}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-service" data-id="${esc(x.id)}">Delete</button><button class="btn btn-small" data-action="quote-service" data-id="${esc(x.id)}">Quotation</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><b>No service templates yet</b>Add a service to define your own charge, process and document checklist.</div>`}</div>
 <div class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Work, actual vs estimated cost & payments</h2><p>Track who paid, what is in progress and how actual costs compare.</p></div></div>${works.length?`<div class="table-scroll"><table><thead><tr><th>Work / customer</th><th>Charge</th><th>Estimated cost</th><th>Actual cost</th><th>Difference</th><th>Status / payment</th><th>Actions</th></tr></thead><tbody>${works.map(w=>`<tr><td><strong>${esc(w.title)}</strong><small>${esc(w.customer||"No customer")}${w.serviceId?" · "+esc(services.find(x=>x.id===w.serviceId)?.name||"Service removed"):""}</small></td><td>${money(w.charge)}</td><td>${money(w.estimatedCost)}</td><td>${money(w.actualCost)}</td><td class="${Number(w.actualCost)>Number(w.estimatedCost)?"money-negative":"money-positive"}">${money(Number(w.actualCost||0)-Number(w.estimatedCost||0))}</td><td>${statusPill(w.status)}<small>${esc(w.paymentStatus||"Pending")}</small></td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-service-work" data-id="${esc(w.id)}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-service-work" data-id="${esc(w.id)}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><b>No service work recorded</b>Record a job to track estimates, actual costs and pending payments.</div>`}</div>`;
}
function updateServiceCalculators(){
 const val=id=>Math.max(0,Number($(id)?.value||0)); const fmt=n=>money(n);
 const charge=val("#calc-charge"),cost=val("#calc-direct")+val("#calc-other"),profit=charge-cost;
 if($("#calc-total")){ $("#calc-total").textContent=fmt(charge);$("#calc-cost").textContent=fmt(cost);$("#calc-profit").textContent=fmt(profit);$("#calc-profit").className="stat-value "+(profit<0?"money-negative":"money-positive");$("#calc-margin").textContent=(charge?profit/charge*100:0).toFixed(1)+"%"; }
 const jobs=val("#forecast-jobs"),fc=val("#forecast-charge"),fco=val("#forecast-cost"),rev=jobs*fc,co=jobs*fco;
 if($("#forecast-revenue")){ $("#forecast-revenue").textContent=fmt(rev);$("#forecast-cost-total").textContent=fmt(co);$("#forecast-profit").textContent=fmt(rev-co); }
}
function editService(id=null){const old=(state.services||[]).find(x=>x.id===id)||{};openModal(id?"Edit service template":"Add service template",`<div class="form-grid">${field("name","Service name",old.name||"","text",true)}${field("kind","Work type",old.kind||"Online service / form filling")}${field("charge","Customer charge (₹)",old.charge??500,"number",true)}${field("directCost","Direct cost (₹)",old.directCost??150,"number")}${field("otherCost","Other costs (₹)",old.otherCost??30,"number")}${field("processing","Processing time",old.processing||"1-2 days")}<div class="field full"><label for="documentsText">Required documents checklist (one per line)</label><textarea id="documentsText" name="documentsText" rows="4">${esc((old.documents||[]).join("\n"))}</textarea></div></div><p class="small-muted">Enter only the documents you choose to request. This is a custom checklist, not an official list.</p>`,d=>{if(!d.name.trim()||Number(d.charge)<0||Number(d.directCost)<0||Number(d.otherCost)<0){toast("Enter a service name and valid non-negative amounts.");return false}const x={...old,id:old.id||uid(),name:d.name.trim(),kind:d.kind,charge:Number(d.charge||0),directCost:Number(d.directCost||0),otherCost:Number(d.otherCost||0),processing:d.processing,documents:d.documentsText.split(/\n/).map(x=>x.trim()).filter(Boolean),checked:old.checked||[]};if(old.id)state.services=state.services.map(y=>y.id===id?x:y);else state.services.unshift(x);toast("Service template saved")});}
function editServiceWork(id=null){const old=(state.serviceWorks||[]).find(x=>x.id===id)||{};const services=state.services||[];openModal(id?"Edit service work":"Record service work",`<div class="form-grid">${field("title","Work title",old.title||"","text",true)}${field("customer","Customer name",old.customer||"")}
<div class="field full"><label>Service template</label><select name="serviceId"><option value="">Custom / not selected</option>${services.map(x=>`<option value="${esc(x.id)}" ${old.serviceId===x.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>${field("charge","Customer charge (₹)",old.charge??0,"number",true)}${field("estimatedCost","Estimated total cost (₹)",old.estimatedCost??0,"number")}${field("actualCost","Actual total cost (₹)",old.actualCost??0,"number")}${field("dueDate","Due date",old.dueDate||today(),"date")}${selectField("status","Work status",["Pending","In progress","Completed","Cancelled"],old.status||"Pending")}${selectField("paymentStatus","Payment status",["Pending","Part-paid","Paid"],old.paymentStatus||"Pending")}</div>`,d=>{if(!d.title.trim()||[d.charge,d.estimatedCost,d.actualCost].some(v=>Number(v)<0)){toast("Enter a title and valid non-negative amounts.");return false}const svc=services.find(x=>x.id===d.serviceId);const x={...old,...d,id:old.id||uid(),charge:Number(d.charge||0),estimatedCost:Number(d.estimatedCost||0),actualCost:Number(d.actualCost||0),serviceId:d.serviceId||""};if(!old.id&&svc){if(!x.charge)x.charge=svc.charge;if(!x.estimatedCost)x.estimatedCost=Number(svc.directCost||0)+Number(svc.otherCost||0)}if(old.id)state.serviceWorks=state.serviceWorks.map(y=>y.id===id?x:y);else state.serviceWorks.unshift(x);toast("Service work saved")});}
function createServiceQuote(id){const svc=(state.services||[]).find(x=>x.id===id);if(!svc)return;const customer=prompt("Customer name for quotation:")||"Customer";const quote=`QUOTATION — ${state.settings.businessName}\nService: ${svc.name}\nCustomer: ${customer}\nCharge: ${money(svc.charge)}\nEstimated costs: ${money(Number(svc.directCost||0)+Number(svc.otherCost||0))}\nEstimated profit: ${money(Number(svc.charge||0)-Number(svc.directCost||0)-Number(svc.otherCost||0))}\nProcessing time: ${svc.processing||"To be confirmed"}\nDocuments to confirm: ${(svc.documents||[]).join(", ")||"None specified"}\n\nThis is an estimate, not a tax invoice. Confirm scope, applicable taxes and official document requirements before proceeding.`;openModal("Quotation",`<div class="field"><label>Quotation text (copy or print)</label><textarea id="quote-text" rows="12" style="width:100%">${esc(quote)}</textarea></div><button class="btn" type="button" onclick="window.print()">Print / Save PDF</button>`,()=>false,"Close")}

function render(){
 const root=$("#view-root");
 if(currentView==="dashboard") root.innerHTML=renderDashboard();
 else if(["clients","jobs","invoices","expenses"].includes(currentView)) root.innerHTML=tablePage(currentView);
 else if(currentView==="reports") root.innerHTML=renderReports();
 else if(currentView==="services") root.innerHTML=renderServices();
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
 const labels={clients:"client",jobs:"job",invoices:"invoice",expenses:"expense"};
 if(!confirm(`Delete this ${labels[kind]}? This cannot be undone unless you have a backup.`))return;
 state[kind]=state[kind].filter(x=>x.id!==id);save();render();toast("Record deleted");
}
function doAction(a,id){
 if(a==="new-service")editService();else if(a==="edit-service")editService(id);else if(a==="delete-service"){if(confirm("Delete this service template? Existing work records remain.")){state.services=state.services.filter(x=>x.id!==id);save();render();}}else if(a==="new-service-work")editServiceWork();else if(a==="edit-service-work")editServiceWork(id);else if(a==="delete-service-work"){if(confirm("Delete this service work record?")){state.serviceWorks=state.serviceWorks.filter(x=>x.id!==id);save();render();}}else if(a==="quote-service")createServiceQuote(id);
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
document.addEventListener("input",e=>{if(["calc-charge","calc-direct","calc-other","forecast-jobs","forecast-charge","forecast-cost"].includes(e.target.id))updateServiceCalculators();if(e.target.id==="table-search"){searchTerm=e.target.value;const pos=e.target.selectionStart;render();const n=$("#table-search");if(n){n.focus();n.setSelectionRange(pos,pos)}}});
$("#quick-add").addEventListener("click",()=>openModal("Add new",`<div class="quick-grid"><button type="button" class="quick-card" data-action="new-client"><span>♙</span><strong>Client</strong></button><button type="button" class="quick-card" data-action="new-job"><span>▤</span><strong>Job</strong></button><button type="button" class="quick-card" data-action="new-invoice"><span>▧</span><strong>Invoice</strong></button><button type="button" class="quick-card" data-action="new-expense"><span>↘</span><strong>Expense</strong></button></div>`,()=>false,"Choose"));
$("#menu-btn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#view-root").addEventListener("click",e=>{if(e.target.closest('[data-action="save-settings"]'))saveSettings()});
document.addEventListener("change",e=>{
 if(e.target.matches("[data-doc-service]")){const svc=state.services.find(x=>x.id===e.target.dataset.docService);if(svc){svc.checked=svc.checked||[];svc.checked[Number(e.target.dataset.docIndex)]=e.target.checked;save();}}
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