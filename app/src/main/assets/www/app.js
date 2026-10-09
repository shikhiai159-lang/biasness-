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
  clients:[], sales:[], jobs:[], invoices:[], purchases:[], tenders:[], expenses:[], products:[], tasks:[], services:[]
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
function setView(view){currentView=view;searchTerm="";$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#page-title").textContent=({"dashboard":"Overview","clients":"Clients","sales":"Sales records","jobs":"Jobs & projects","invoices":"Sales invoices","purchases":"Purchase bills","tenders":"Tender desk","expenses":"Expenses","products":"Products & inventory","tasks":"Tasks & KPI","services":"Service templates","calculator":"Profit calculator","reports":"Reports","settings":"Settings & backup"})[view]||"Overview";$("#sidebar").classList.remove("open");render();}
function pageHead(title,desc,action=""){return `<div class="page-head"><div><div class="eyebrow">SERVICEPILOT WORKSPACE</div><h1>${title}</h1><p>${desc}</p></div><div class="head-actions">${action}</div></div>`}
function stat(label,value,icon,note=""){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function statusPill(s){const cls=String(s||"").toLowerCase().replace(/\s+/g,"-");return `<span class="pill ${esc(cls)}">${esc(s||"—")}</span>`}
function invoicePaid(i){ return Math.min(Number(i.total||0),Math.max(0,Number(i.paidAmount??(i.status==="Paid"?i.total:0)))); }
function invoiceBalance(i){ return Math.max(0,Number(i.total||0)-invoicePaid(i)); }
function invoiceStatus(i){ const bal=invoiceBalance(i); if(bal<=0.009)return "Paid"; if(invoicePaid(i)>0)return "Part-paid"; return "Unpaid"; }
function invoiceItems(i){ if(Array.isArray(i.items)&&i.items.length)return i.items; return [{description:i.description||"Service provided",qty:1,rate:Number(i.subtotal||0),amount:Number(i.subtotal||0)}]; }
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
 const income=state.invoices.reduce((s,i)=>s+invoicePaid(i),0)+state.sales.filter(x=>x.status==="Paid").reduce((s,x)=>s+Number(x.amount||0),0);
 const outstanding=state.invoices.reduce((s,i)=>s+invoiceBalance(i),0);
 const expenses=state.expenses.reduce((s,e)=>s+Number(e.amount),0);
 const activeJobs=state.jobs.filter(j=>!["Completed","Cancelled"].includes(j.status)).length;
 const totalJobs=state.jobs.length||1, done=state.jobs.filter(j=>j.status==="Completed").length;
 const monthKeys=Array.from({length:6},(_,n)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-n));return d.toISOString().slice(0,7)});
 const months=monthKeys.map(k=>{const d=new Date(k+"-01T12:00:00");const label=d.toLocaleDateString("en-IN",{month:"short"});const revenue=state.invoices.filter(i=>(i.date||"").startsWith(k)).reduce((a,i)=>a+Number(i.total||0),0)+state.sales.filter(x=>(x.date||"").startsWith(k)).reduce((a,x)=>a+Number(x.amount||0),0);const cost=state.expenses.filter(e=>(e.date||"").startsWith(k)).reduce((a,e)=>a+Number(e.amount||0),0);return {label,revenue,cost,profit:revenue-cost}});
 const max=Math.max(1,...months.flatMap(m=>[m.revenue,m.cost]));
 const overdue=state.invoices.filter(i=>invoiceBalance(i)>0 && i.dueDate && i.dueDate<today()).length;
 return pageHead("Business command center","Your daily business snapshot — sales, cash collection, costs and work in progress.",`<button class="btn" data-action="export">↧ Backup data</button><button class="btn btn-primary" data-action="new-job">＋ New job</button>`)
 + `<div class="hero-banner"><div><div class="hero-kicker">PREMIUM BUSINESS OVERVIEW</div><h2>${esc(state.settings.businessName||"Your Business")}</h2><p>One workspace for customers, services, invoices, stock and business performance.</p><div class="hero-actions"><button class="btn btn-primary" data-action="new-invoice">＋ Create invoice</button><button class="btn hero-secondary" data-view="reports">View reports ↗</button></div></div><div class="hero-orbit"><div class="orbit-ring"></div><div class="orbit-card"><span>NET POSITION</span><strong>${money(income-expenses)}</strong><small>Collected income less recorded costs</small></div></div></div>
 <div class="grid stats-grid">${stat("Collected income",money(income),"↗","Invoices and sales marked paid")}${stat("Outstanding balance",money(outstanding),"◷",`${overdue} overdue invoice${overdue===1?"":"s"}`)}${stat("Recorded expenses",money(expenses),"↘","All recorded business costs")}${stat("Active jobs",activeJobs,"▤",`${state.jobs.length} total jobs`)}</div>
 <div class="grid two-col"><div class="panel chart-panel"><div class="panel-head"><div><h2>Revenue & expense trends</h2><p>Last six months · based on entered records</p></div><span class="chart-legend"><i></i> Revenue <i class="legend-expense"></i> Expenses</span></div><div class="trend-chart">${months.map(m=>`<div class="trend-col"><div class="trend-bars"><i title="Revenue ${money(m.revenue)}" class="bar-revenue" style="height:${Math.max(3,m.revenue/max*100)}%"></i><i title="Expenses ${money(m.cost)}" class="bar-expense" style="height:${Math.max(3,m.cost/max*100)}%"></i></div><span>${m.label}</span></div>`).join("")}</div><div class="trend-foot"><span>Six-month revenue</span><strong>${money(months.reduce((a,m)=>a+m.revenue,0))}</strong><span>Six-month expenses</span><strong>${money(months.reduce((a,m)=>a+m.cost,0))}</strong></div></div>
 <div class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Common tasks, one tap away</p></div></div><div class="quick-grid"><button class="quick-card" data-action="new-client"><span>♙</span><strong>Add customer</strong><small>Save contact details</small></button><button class="quick-card" data-action="new-job"><span>▤</span><strong>New service job</strong><small>Track work and price</small></button><button class="quick-card" data-action="new-invoice"><span>▧</span><strong>Create invoice</strong><small>Track partial payments</small></button><button class="quick-card" data-view="products"><span>▣</span><strong>Check inventory</strong><small>${state.products.filter(p=>Number(p.stock||0)<=Number(p.reorder||0)).length} low-stock items</small></button></div><div class="progress-row"><div class="progress-label"><span>Completed jobs</span><span>${Math.round(done/totalJobs*100)}%</span></div><div class="progress"><i style="width:${Math.round(done/totalJobs*100)}%"></i></div></div><div class="progress-row"><div class="progress-label"><span>Open jobs</span><span>${activeJobs}</span></div><div class="progress"><i style="width:${Math.min(100,activeJobs/totalJobs*100)}%;background:#e3a43c"></i></div></div></div></div>
 <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Recent activity</h2><p>Latest customer, job and invoice records</p></div><button class="text-link" data-view="invoices">Manage invoices →</button></div>${recentActivity()}</div>`;
}
function tablePage(kind){
 const configs={
 clients:{title:"Clients",desc:"Keep customer details and their service history together.",btn:"＋ Add client",action:"new-client",rows:state.clients,empty:"No clients yet",headers:["Client","Contact","Company","Added","Actions"]},
 jobs:{title:"Jobs & projects",desc:"Track work from request to completion.",btn:"＋ New job",action:"new-job",rows:state.jobs,empty:"No jobs yet",headers:["Job","Client","Due date","Price","Status","Actions"]},
 invoices:{title:"Invoices",desc:"Prepare invoices and track which payments are still due.",btn:"＋ New invoice",action:"new-invoice",rows:state.invoices,empty:"No invoices yet",headers:["Invoice","Client","Issue date","Total","Paid / balance","Status","Actions"]},
 expenses:{title:"Expenses",desc:"Record business costs so your profit view is more useful.",btn:"＋ Add expense",action:"new-expense",rows:state.expenses,empty:"No expenses recorded",headers:["Expense","Category","Date","Amount","Actions"]}
 };
 const c=configs[kind], q=searchTerm.toLowerCase();
 let rows=c.rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
 let body="";
 if(kind==="clients") body=rows.map(x=>`<tr><td><strong>${esc(x.name)}</strong><small>${esc(x.email||"No email")}</small></td><td>${esc(x.phone||"—")}</td><td>${esc(x.company||"—")}</td><td>${esc(x.createdAt||"—")}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-client" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-client" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 if(kind==="jobs") body=rows.map(x=>`<tr><td>${x.photo?`<img class="record-thumb" src="${x.photo}" alt="${esc(x.title)}">`:""}<strong>${esc(x.title)}</strong><small>${esc(x.description||"")}</small></td><td>${esc(clientName(x.clientId))}</td><td>${esc(x.dueDate||"—")}</td><td>${money(x.price)}</td><td>${statusPill(x.status)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-job" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-job" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 if(kind==="invoices") body=rows.map(x=>`<tr><td><strong>${esc(x.number)}</strong></td><td>${esc(clientName(x.clientId))}</td><td>${esc(x.date)}</td><td><strong>${money(x.total)}</strong></td><td>Paid ${money(invoicePaid(x))}<small>Balance ${money(invoiceBalance(x))}</small></td><td>${statusPill(invoiceStatus(x))}</td><td><div class="table-actions"><button class="btn btn-small" data-action="view-invoice" data-id="${x.id}">View / PDF</button><button class="btn btn-small" data-action="toggle-paid" data-id="${x.id}">${invoiceBalance(x)<=0.009?"Payment details":"Record payment"}</button><button class="btn btn-small btn-danger" data-action="delete-invoice" data-id="${x.id}">×</button></div></td></tr>`).join("");
 if(kind==="expenses") body=rows.map(x=>`<tr><td><strong>${esc(x.title)}</strong><small>${esc(x.note||"")}</small></td><td>${esc(x.category||"Other")}</td><td>${esc(x.date)}</td><td><strong>${money(x.amount)}</strong></td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-expense" data-id="${x.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-expense" data-id="${x.id}">Delete</button></div></td></tr>`).join("");
 return pageHead(c.title,c.desc,`<button class="btn btn-primary" data-action="${c.action}">${c.btn}</button>`)
 + `<div class="table-wrap"><div class="table-toolbar"><div class="small-muted">${rows.length} record${rows.length===1?"":"s"}</div><input class="search" id="table-search" placeholder="Search ${kind}…" value="${esc(searchTerm)}"></div><div class="table-scroll"><table><thead><tr>${c.headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>${rows.length?"":`<div class="empty"><b>${c.empty}</b>Use the button above to add your first record.</div>`}</div></div>`;
}
function renderPurchases(){
 const total=state.purchases.reduce((a,p)=>a+Number(p.total||0),0),due=state.purchases.reduce((a,p)=>a+Math.max(0,Number(p.total||0)-Number(p.paidAmount||0)),0);
 return pageHead("Purchase bills & supplier invoices","Record goods bought from suppliers, GST split, payments and outstanding supplier balances.",`<button class="btn" data-action="export-purchases">Export CSV</button><button class="btn btn-primary" data-action="new-purchase">＋ New purchase bill</button>`)+
 `<div class="grid stats-grid">${stat("Purchase bills",state.purchases.length,"▧","Supplier invoices")}${stat("Total purchases",money(total),"₹","Including entered tax")}${stat("Supplier balance due",money(due),"◷","Unpaid purchase bills")}${stat("Suppliers",new Set(state.purchases.map(p=>p.supplier).filter(Boolean)).size,"♙","Distinct supplier names")}</div><div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Bill no.</th><th>Supplier</th><th>Bill date</th><th>Due date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead><tbody>${state.purchases.map(p=>`<tr><td><strong>${esc(p.number)}</strong><small>${esc(p.reference||"")}</small></td><td>${esc(p.supplier)}</td><td>${esc(p.date)}</td><td>${esc(p.dueDate||"—")}</td><td>${money(p.total)}</td><td>${money(p.paidAmount)}</td><td><strong>${money(Math.max(0,p.total-p.paidAmount))}</strong></td><td><div class="table-actions"><button class="btn btn-small" data-action="view-purchase" data-id="${p.id}">View / Print</button><button class="btn btn-small" data-action="edit-purchase" data-id="${p.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-purchase" data-id="${p.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>${state.purchases.length?"":'<div class="empty"><b>No purchase bills yet</b>Use this section when buying stock, materials or other goods from a supplier.</div>'}</div></div>`;
}
function editPurchase(id=null){
 const o=state.purchases.find(x=>x.id===id)||{}, lines=(o.items||[]).map(x=>`${x.description} | ${x.qty} | ${x.rate}`).join("\n");
 openModal(id?"Edit supplier purchase bill":"New supplier purchase bill",`<div class="notice">Use this for bills you RECEIVE when buying goods. This is separate from sales invoices you issue to customers.</div><div class="form-grid">${field("supplier","Supplier / seller legal name",o.supplier||"","text",true)}${field("supplierGstin","Supplier GSTIN (if applicable)",o.supplierGstin||"")}${field("number","Supplier bill / invoice number",o.number||("PUR-"+Date.now().toString().slice(-6)),"text",true)}${field("date","Bill date",o.date||today(),"date",true)}${field("dueDate","Payment due date",o.dueDate||"","date")}${field("reference","PO / reference",o.reference||"")}${selectField("taxMode","Tax mode",["No tax entered","CGST + SGST","IGST"],o.taxMode||"CGST + SGST")}${field("taxRate","GST rate (%)",o.taxRate??18,"number")}${field("paidAmount","Amount paid to supplier (₹)",o.paidAmount??0,"number")}<div class="field full"><label>Purchased items (one per line: Description | Qty | Unit price before GST)</label><textarea name="lineItems" rows="5" required>${esc(lines||"Product / material | 1 | 0")}</textarea><small class="small-muted">Amounts are calculated from quantity × unit price. Confirm actual tax rates and supplier invoice details against the original bill.</small></div>${field("notes","Notes",o.notes||"","text",false,true)}</div>`,d=>{
 let items;try{items=d.lineItems.split(/\r?\n/).map(line=>{let a=line.split("|").map(v=>v.trim());if(!a[0])return null;let qty=Number(a[1]||1),rate=Number(a[2]||0);if(!(qty>0)||rate<0||!Number.isFinite(qty)||!Number.isFinite(rate))throw 0;return {description:a[0],qty,rate,amount:Math.round(qty*rate*100)/100}}).filter(Boolean)}catch(e){toast("Use Description | Quantity | Unit price for each item.");return false}
 if(!d.supplier.trim()||!d.number.trim()||!items.length){toast("Supplier, bill number and at least one item are required.");return false}
 const subtotal=Math.round(items.reduce((a,x)=>a+x.amount,0)*100)/100,rate=Math.max(0,Number(d.taxRate||0)),tax=Math.round(subtotal*rate)/100,total=Math.round((subtotal+tax)*100)/100,paid=Math.min(total,Math.max(0,Number(d.paidAmount||0)));
 const x={...o,...d,id:o.id||uid(),items,subtotal,taxRate:rate,tax,total,paidAmount:paid,balance:Math.max(0,total-paid),cgst:d.taxMode==="CGST + SGST"?tax/2:0,sgst:d.taxMode==="CGST + SGST"?tax/2:0,igst:d.taxMode==="IGST"?tax:0};
 if(o.id)state.purchases=state.purchases.map(v=>v.id===id?x:v);else state.purchases.unshift(x);toast("Purchase bill saved");
 });
}
function viewPurchase(id){const p=state.purchases.find(x=>x.id===id);if(!p)return;const rows=(p.items||[]).map(x=>`<tr><td>${esc(x.description)}</td><td>${x.qty}</td><td>${money(x.rate)}</td><td>${money(x.amount)}</td></tr>`).join("");openModal("Supplier purchase bill",`<div class="invoice-preview"><h2>${esc(state.settings.businessName)}</h2><p>Purchase bill record · Supplier: <b>${esc(p.supplier)}</b></p><p>Supplier invoice: ${esc(p.number)} · Date: ${esc(p.date)} · GSTIN: ${esc(p.supplierGstin||"—")}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${money(p.subtotal)}<br>GST (${p.taxRate}%): ${money(p.tax)}<br>CGST: ${money(p.cgst)} · SGST: ${money(p.sgst)} · IGST: ${money(p.igst)}<br><b>Total: ${money(p.total)}</b><br>Paid: ${money(p.paidAmount)} · Balance due: ${money(p.balance)}</p><p>${esc(p.notes||"")}</p></div><button class="btn btn-primary" data-action="print-purchase">Print / Save PDF</button>`,()=>false,"Close");}
function renderTenders(){return pageHead("Tender desk","Find official tender notices, track deadlines, prepare documents and open the official portal to submit bids.",`<button class="btn btn-primary" data-action="new-tender">＋ Track tender</button>`)+
 `<div class="notice"><b>Important:</b> This desk helps you discover and prepare bids. Actual submission must happen on the tender owner's official portal; many portals require bidder enrollment, a Digital Signature Certificate (DSC), OTP/login and portal-specific steps. This app can track notices and prepare checklists, but cannot directly submit or digitally sign a bid. Submission requires the official portal, bidder login and (where required) registered DSC/e-token. Links open in your device browser to avoid Android WebView cache/navigation errors.</div><div class="grid two-col"><div class="panel"><div class="panel-head"><div><h2>Official tender portals</h2><p>Open current notices and bid submission pages</p></div></div><div class="quick-grid"><a class="quick-card" href="https://eprocure.gov.in/eprocure/app" target="_self"><span>🏛️</span><strong>Central eProcurement</strong><small>Search tenders, corrigenda and bid awards</small></a><a class="quick-card" href="https://www.etenders.gov.in/eprocure/app" target="_self"><span>📄</span><strong>eTender portal</strong><small>Search and submit through official portal</small></a><a class="quick-card" href="https://gem.gov.in/" target="_self"><span>🛒</span><strong>Government e-Marketplace</strong><small>Government procurement marketplace</small></a><a class="quick-card" href="https://eprocure.gov.in/epublish/app" target="_self"><span>📢</span><strong>Tender notices</strong><small>Published tender enquiries and updates</small></a></div></div><div class="panel"><div class="panel-head"><div><h2>Tender news & updates</h2><p>Open current official notices and procurement updates</p></div></div><p>Use these official pages for active tenders, corrigenda, closing dates and award notices. The portal is the source of truth; this offline app does not scrape live tender listings.</p><p><a href="https://eprocure.gov.in/eprocure/app?page=FrontEndAdvancedSearch&service=page" target="_self">Advanced tender search ↗</a></p><p><a href="https://eprocure.gov.in/epublish/app" target="_self">Latest published notices ↗</a></p><p><a href="https://gem.gov.in/" target="_self">GeM notices and procurement ↗</a></p></div></div><div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>My tender tracker</h2><p>Track closing date, estimated value, documents and preparation status</p></div></div><div class="table-scroll"><table><thead><tr><th>Tender</th><th>Portal / authority</th><th>Closing date</th><th>Estimated value</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.tenders.map(t=>`<tr><td><strong>${esc(t.title)}</strong><small>${esc(t.ref||"")}</small></td><td>${esc(t.portal||"")}</td><td>${esc(t.closing||"—")}</td><td>${money(t.value||0)}</td><td>${statusPill(t.status||"Watching")}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-tender" data-id="${t.id}">Edit</button><button class="btn btn-small" data-action="delete-tender" data-id="${t.id}">Delete</button>${t.url?`<a class="btn btn-small" href="${esc(t.url)}" target="_self">Open portal</a>`:""}</div></td></tr>`).join("")}</tbody></table>${state.tenders.length?"":'<div class="empty"><b>No tenders tracked</b>Add a tender from an official notice to track its deadline and documents.</div>'}</div></div><div class="panel" style="margin-top:18px"><h2>Bid preparation checklist</h2><p>Confirm eligibility, tender fee/EMD and exemptions, GST/PAN/business registration, technical bid, price bid, declarations, validity period, delivery terms and corrigenda. Use the portal's current bidder manual; requirements differ by tender.</p></div>`}
function editTender(id=null){const o=state.tenders.find(x=>x.id===id)||{};openModal(id?"Edit tracked tender":"Track tender",`<div class="form-grid">${field("title","Tender title",o.title||"","text",true)}${field("ref","Tender ID / reference",o.ref||"")}${field("portal","Portal / authority",o.portal||"CPPP / eProcurement")}${field("closing","Closing date",o.closing||"","date")}${field("value","Estimated value (₹)",o.value??0,"number")}${selectField("status","Preparation status",["Watching","Documents pending","Preparing bid","Ready to submit","Submitted","Not eligible","Closed"],o.status||"Watching")}${field("url","Official tender URL",o.url||"url","url",false,true)}${field("docs","Documents / notes",o.docs||"","text",false,true)}</div>`,d=>{if(!d.title.trim())return false;const x={...o,...d,id:o.id||uid(),value:Number(d.value||0)};state.tenders=o.id?state.tenders.map(t=>t.id===id?x:t):[x,...state.tenders];toast("Tender tracker saved")})}
function renderReports(){
 const paid=state.invoices.reduce((s,i)=>s+invoicePaid(i),0);
 const due=state.invoices.reduce((s,i)=>s+invoiceBalance(i),0);
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
function imageField(name,label,existing="") { return `<div class="field full"><label>${label} (optional)</label>${existing?`<img class="upload-preview" src="${existing}" alt="Current attachment">`:""}<input type="file" name="${name}" accept="image/*"><small class="small-muted">JPG, PNG or WebP. Stored on this device; large images may use browser storage.</small><label class="check-label"><input type="checkbox" name="removePhoto" value="yes"> Remove current image</label></div>`; }
function field(name,label,value="",type="text",required=false,full=false){
 return `<div class="field ${full?"full":""}"><label for="${name}">${label}${required?" *":""}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?"required":""}></div>`;
}
function selectField(name,label,options,value,full=false){
 return `<div class="field ${full?"full":""}"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(o=>{const v=typeof o==="string"?o:o.value,l=typeof o==="string"?o:o.label;return `<option value="${esc(v)}" ${value===v?"selected":""}>${esc(l)}</option>`}).join("")}</select></div>`;
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
 <div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder at</th><th>Unit cost</th><th>Selling price</th><th>Actions</th></tr></thead><tbody>${state.products.map(p=>`<tr><td>${p.photo?`<img class="record-thumb" src="${p.photo}" alt="${esc(p.name)}">`:""}<strong>${esc(p.name)}</strong><small>${esc(p.category||"")}</small></td><td>${esc(p.sku||"—")}</td><td>${Number(p.stock||0)<=Number(p.reorder||0)?statusPill("Low stock"):Number(p.stock||0)}</td><td>${Number(p.reorder||0)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-product" data-id="${p.id}">Edit</button><button class="btn btn-small btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>${state.products.length?"":'<div class="empty"><b>No products yet</b>Add products to track inventory and low-stock alerts.</div>'}</div></div>`;
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
function editProduct(id=null){const o=state.products.find(x=>x.id===id)||{};openModal(id?"Edit product":"Add product",`<div class="form-grid">${field("name","Product name",o.name||"","text",true)}${imageField("photoFile","Product photo",o.photo)}${field("sku","SKU / code",o.sku||"")}${field("category","Category",o.category||"")}${field("stock","Current stock",o.stock??0,"number",true)}${field("reorder","Low-stock threshold",o.reorder??0,"number",true)}${field("cost","Unit cost",o.cost??0,"number",true)}${field("price","Selling price",o.price??0,"number",true)}</div>`,d=>{if(!d.name.trim())return false;const x={...o,...d,photo:d.photo!==undefined?d.photo:(o.photo||""),id:o.id||uid(),stock:+d.stock,reorder:+d.reorder,cost:+d.cost,price:+d.price};state.products=o.id?state.products.map(p=>p.id===id?x:p):[x,...state.products];toast("Product saved")})}
function editTask(id=null){const o=state.tasks.find(x=>x.id===id)||{};openModal(id?"Edit task":"Add task or KPI",`<div class="form-grid">${field("title","Task / goal name",o.title||"","text",true)}${field("due","Due date",o.due||"","date")}${selectField("priority","Priority",["Low","Normal","High","Urgent"],o.priority||"Normal")}${selectField("status","Status",["To do","In progress","Done"],o.status||"To do")}${field("target","Target / KPI",o.target||"")}${field("note","Notes",o.note||"","text",false,true)}</div>`,d=>{if(!d.title.trim())return false;const x={...o,...d,id:o.id||uid()};state.tasks=o.id?state.tasks.map(t=>t.id===id?x:t):[x,...state.tasks];toast("Task saved")})}
function editService(id=null){const o=state.services.find(x=>x.id===id)||{};openModal(id?"Edit service template":"Add service template",`<div class="form-grid">${field("name","Service name",o.name||"","text",true)}${field("category","Work type",o.category||"Online service")}${field("charge","Customer charge (₹)",o.charge??0,"number",true)}${field("direct","Direct cost (₹)",o.direct??0,"number",true)}${field("other","Other costs (₹)",o.other??0,"number",true)}${field("turnaround","Processing time",o.turnaround||"")}${field("docs","Required documents (comma-separated)",o.docs||"","text",false,true)}</div><p class="small-muted">You define the checklist. Verify official requirements separately.</p>`,d=>{if(!d.name.trim())return false;const x={...o,...d,id:o.id||uid(),charge:+d.charge,direct:+d.direct,other:+d.other};state.services=o.id?state.services.map(v=>v.id===id?x:v):[x,...state.services];toast("Service template saved")})}
function exportProducts(){const rows=[["Name","SKU","Category","Stock","Reorder threshold","Unit cost","Selling price"],...state.products.map(p=>[p.name,p.sku,p.category,p.stock,p.reorder,p.cost,p.price])];download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-products-${today()}.csv`)}

function render(){
 const root=$("#view-root");
 if(currentView==="dashboard") root.innerHTML=renderDashboard();
 else if(["clients","jobs","invoices","expenses"].includes(currentView)) root.innerHTML=tablePage(currentView);
 else if(currentView==="purchases") root.innerHTML=renderPurchases();
 else if(currentView==="tenders") root.innerHTML=renderTenders();
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
 $("#modal-form").onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
  try {
   const file=data.photoFile;
   if(file instanceof File && file.size>0){
    if(!file.type.startsWith("image/")){toast("Choose an image file.");return;}
    data.photo=await compressImage(file); delete data.photoFile;
   } else {delete data.photoFile;}
   if(data.removePhoto==="yes")data.photo=""; delete data.removePhoto;
   if(onSubmit(data)!==false){d.close();save();render();}
  } catch(err){console.error(err);toast("Could not read this file. Try a JPG or PNG image under 10 MB.");}
 };
}
function compressImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",0.78));};img.src=reader.result;};reader.readAsDataURL(file);});
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
 openModal(id?"Edit job":"Create job",`<div class="form-grid">${field("title","Job title",old.title||"","text",true)}${selectField("clientId","Client",state.clients.map(c=>c.id),old.clientId||"")}${field("date","Start date",old.date||today(),"date")}${field("dueDate","Due date",old.dueDate||"","date")}${field("price","Quoted price",old.price??"","number")}${selectField("status","Status",["New","In progress","Waiting","Completed","Cancelled"],old.status||"New")}${field("description","Description",old.description||"","text",false,true)}${imageField("photoFile","Work / product photo",old.photo)}</div>`,d=>{
  if(!d.title.trim()){toast("Job title is required.");return false}
  const x={...old,...d,photo:d.photo!==undefined?d.photo:(old.photo||""),id:old.id||uid(),price:Number(d.price||0)};if(old.id)state.jobs=state.jobs.map(j=>j.id===id?x:j);else state.jobs.unshift(x);toast(old.id?"Job updated":"Job created");
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
 const items=invoiceItems(old); const lineText=items.map(it=>`${it.description||"Service"} | ${it.qty||1} | ${it.rate??it.amount??0}`).join("\n");
 openModal(id?"Edit invoice":"New invoice",`<div class="form-grid"><div class="field full"><label>Customer / bill to *</label><select name="clientId" required><option value="">Choose customer</option>${clientOpts}</select></div>${field("date","Invoice date",old.date||today(),"date",true)}${field("reference","PO / reference number",old.reference||"")}${selectField("taxMode","Invoice type",[{value:"non-gst",label:"Non-GST / Bill of Supply"},{value:"gst-intra",label:"GST — CGST + SGST"},{value:"gst-inter",label:"GST — IGST"}],old.taxMode||"non-gst")}${field("taxRate","GST rate (%) — only for GST invoice",old.taxMode&&old.taxMode!=="non-gst"?(old.taxRate??18):0,"number")}${field("discount","Discount amount",old.discount??0,"number")}${field("paidAmount","Amount already received",old.paidAmount??(old.status==="Paid"?old.total:0),"number")}
 <div class="field full"><label>Invoice line items * (one per line: Description | Qty | Unit price)</label><textarea name="lineItems" rows="4" required placeholder="Website design | 1 | 15000&#10;Hosting | 2 | 1200">${esc(lineText||"Service provided | 1 | 0")}</textarea><small class="small-muted">Example: Logo design | 2 | 1500. Amounts are calculated from quantity × unit price.</small></div><div class="field full"><label>Notes / payment instructions</label><textarea name="notes" rows="2">${esc(old.notes||"")}</textarea></div></div><p class="notice">The invoice calculates subtotal, discount, tax, total, payments received and balance due. Verify applicable GST/tax rules and statutory invoice fields before issuing.</p>`,d=>{
  if(!d.clientId){toast("Choose a customer.");return false}
  let parsed;try{parsed=d.lineItems.split(/\r?\n/).map(line=>{const parts=line.split("|").map(x=>x.trim());if(!parts[0])return null;const qty=Number(parts[1]||1),rate=Number(parts[2]||0);if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(rate)||rate<0)throw new Error();return {description:parts[0],qty,rate,amount:Math.round(qty*rate*100)/100}}).filter(Boolean)}catch(err){toast("Check line items: use Description | Quantity | Unit price.");return false}
  if(!parsed.length){toast("Add at least one invoice line item.");return false}
  let number=old.number;if(!number){number=(state.settings.invoicePrefix||"INV")+"-"+String(state.settings.nextInvoice).padStart(4,"0");state.settings.nextInvoice++}
  const subtotal=Math.round(parsed.reduce((a,it)=>a+it.amount,0)*100)/100,discount=Math.max(0,Number(d.discount||0)),taxMode=d.taxMode||"non-gst",taxRate=taxMode==="non-gst"?0:Math.max(0,Number(d.taxRate||0)),tax=Math.round(Math.max(0,subtotal-discount)*taxRate)/100,total=Math.max(0,Math.round((subtotal-discount+tax)*100)/100),paidAmount=Math.min(total,Math.max(0,Number(d.paidAmount||0)));
  const x={...old,...d,id:old.id||uid(),number,items:parsed,description:parsed.map(it=>it.description).join(", "),subtotal,discount,taxMode,taxRate,tax,cgst:taxMode==="gst-intra"?tax/2:0,sgst:taxMode==="gst-intra"?tax/2:0,igst:taxMode==="gst-inter"?tax:0,total,paidAmount,status:paidAmount>=total?"Paid":paidAmount>0?"Part-paid":"Due"};
  if(old.id)state.invoices=state.invoices.map(i=>i.id===id?x:i);else state.invoices.unshift(x);toast(old.id?"Invoice updated":"Invoice created");
 });
}
function invoiceHtml(i){
 const s=state.settings,c=state.clients.find(x=>x.id===i.clientId)||{},items=invoiceItems(i),paid=invoicePaid(i),balance=invoiceBalance(i);
 return `<div class="invoice-preview" id="print-invoice"><div class="invoice-head"><div><div class="brand" style="padding:0 0 15px"><div class="brand-mark">S</div><div><strong>${esc(s.businessName)}</strong><small>${esc(s.ownerName||"Service provider")}</small></div></div><div class="small-muted">${esc(s.address||"")}${s.phone?"<br>"+esc(s.phone):""}${s.email?"<br>"+esc(s.email):""}</div></div><div style="text-align:right"><div class="eyebrow">${i.taxMode&&i.taxMode!=="non-gst"?"TAX INVOICE":"INVOICE / BILL OF SUPPLY"}</div><h2>${esc(i.number)}</h2><div class="small-muted">Issue date: ${esc(i.date)}<br>Status: ${esc(invoiceStatus(i))}${i.reference?"<br>Reference: "+esc(i.reference):""}</div></div></div>
 <div style="margin-bottom:22px"><div class="small-muted">BILL TO</div><strong>${esc(c.name||"Client")}</strong><div class="small-muted">${esc(c.company||"")}${c.email?"<br>"+esc(c.email):""}${c.phone?"<br>"+esc(c.phone):""}${c.address?"<br>"+esc(c.address):""}</div></div>
 <table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${items.map(it=>`<tr><td>${esc(it.description)}</td><td>${Number(it.qty||1)}</td><td>${money(it.rate??it.amount)}</td><td>${money(it.amount??Number(it.qty||1)*Number(it.rate||0))}</td></tr>`).join("")}<tr><td colspan="3">Subtotal</td><td>${money(i.subtotal)}</td></tr>${Number(i.discount)?`<tr><td colspan="3">Discount</td><td>−${money(i.discount)}</td></tr>`:""}${Number(i.taxRate)?`<tr><td colspan="3">GST (${Number(i.taxRate)}%)</td><td>${money(i.tax)}</td></tr>${i.taxMode==="gst-intra"?`<tr><td colspan="3">CGST</td><td>${money(i.cgst)}</td></tr><tr><td colspan="3">SGST</td><td>${money(i.sgst)}</td></tr>`:i.taxMode==="gst-inter"?`<tr><td colspan="3">IGST</td><td>${money(i.igst)}</td></tr>`:""}`:""}</tbody></table>
 <div class="invoice-summary"><div><span>Invoice total</span><strong>${money(i.total)}</strong></div><div><span>Payments received</span><strong>${money(paid)}</strong></div><div class="balance-due"><span>Balance due</span><strong>${money(balance)}</strong></div></div>${i.notes?`<p class="small-muted"><b>Notes / payment instructions:</b> ${esc(i.notes)}</p>`:""}<p class="small-muted" style="margin-top:24px">Thank you for your business. Please contact us if you have questions about this invoice.</p></div>`;
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
 const rows=kind==="clients"?[["Name","Company","Phone","Email","Address","Notes"],...state.clients.map(c=>[c.name,c.company,c.phone,c.email,c.address,c.notes])]:[["Invoice","Client","Date","Description","Tax mode","Subtotal","Tax rate","Tax","Total","Paid","Balance","Status"],...state.invoices.map(i=>[i.number,clientName(i.clientId),i.date,i.description,i.taxMode||"non-gst",i.subtotal,i.taxRate,i.tax,i.total,invoicePaid(i),invoiceBalance(i),invoiceStatus(i)])];
 download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-${kind}-${today()}.csv`);toast("CSV exported");
}
function deleteRecord(kind,id){
 const labels={clients:"client",sales:"sale",jobs:"job",invoices:"invoice",expenses:"expense",products:"product",tasks:"task",services:"service template"};
 if(!confirm(`Delete this ${labels[kind]}? This cannot be undone unless you have a backup.`))return;
 state[kind]=state[kind].filter(x=>x.id!==id);save();render();toast("Record deleted");
}
function doAction(a,id){
 if(a==="new-purchase")editPurchase();else if(a==="edit-purchase")editPurchase(id);else if(a==="view-purchase")viewPurchase(id);else if(a==="delete-purchase")deleteRecord("purchases",id);else if(a==="export-purchases"){const rows=[["Bill No","Supplier","Date","Due Date","Subtotal","Tax","Total","Paid","Balance"],...state.purchases.map(p=>[p.number,p.supplier,p.date,p.dueDate,p.subtotal,p.tax,p.total,p.paidAmount,p.balance])];download(new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`servicepilot-purchases-${today()}.csv`)}
 else if(a==="new-tender")editTender();else if(a==="edit-tender")editTender(id);else if(a==="delete-tender")deleteRecord("tenders",id);else if(a==="print-purchase")window.print();
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
 else if(a==="toggle-paid"){const i=state.invoices.find(x=>x.id===id);if(i){const remaining=invoiceBalance(i);if(remaining<=0.009){toast("Invoice is already fully paid.")}else{const amount=prompt(`Balance due: ${money(remaining)}\nEnter payment received now:`,String(remaining));if(amount!==null){const n=Number(amount);if(Number.isFinite(n)&&n>0){i.paidAmount=Math.min(Number(i.total||0),invoicePaid(i)+n);i.status=invoiceStatus(i);save();render();toast(`Payment recorded. Balance: ${money(invoiceBalance(i))}`)}else toast("Enter a valid positive payment amount.")}}}}
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