import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
   COLE A CONFIGURAÇÃO DO SEU PROJETO AQUI.
   A linha "apiKey" é onde fica sua chave API.
   IMPORTANTE: no Firebase Web a apiKey não é uma senha.
   A segurança deve ser feita pelas Firestore Security Rules.
   ========================================================= */
const firebaseConfig = {

  apiKey: "AIzaSyD-bH7MY-VFHJYhuYGa18UKu2EslksAjgM",

  authDomain: "cubo-glass.firebaseapp.com",

  projectId: "cubo-glass",

  storageBucket: "cubo-glass.firebasestorage.app",

  messagingSenderId: "1010303888432",

  appId: "1:1010303888432:web:4892849f840824542e91f5",

  measurementId: "G-958FX0F2D5"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = { clients: [], products: [], prices: [], sales: [] };
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const pct = n => `${(Number(n)||0).toFixed(2).replace(".",",")}%`;
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const meta = () => (Number($("metaInput").value)||42.24)/100;

async function getAll(name){
  const snap = await getDocs(collection(db,name));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function loadData(){
  $("dbStatus").textContent="Carregando dados...";
  [state.clients,state.products,state.prices,state.sales] = await Promise.all([
    getAll("clientes"),getAll("produtos"),getAll("precos"),getAll("vendas")
  ]);
  $("dbStatus").textContent="Firebase conectado";
  renderAll();
}
function productById(id){return state.products.find(x=>x.id===id)}
function clientById(id){return state.clients.find(x=>x.id===id)}
function clientName(id){return clientById(id)?.nome || "—"}
function productName(id){return productById(id)?.nome || "—"}
function productCost(id){return Number(productById(id)?.custo)||0}

function totals(){
  const faturamento=state.sales.reduce((s,x)=>s+Number(x.faturamento||0),0);
  const custo=state.sales.reduce((s,x)=>s+Number(x.custoTotal||0),0);
  const qtd=state.sales.reduce((s,x)=>s+Number(x.quantidade||0),0);
  return {faturamento,custo,lucro:faturamento-custo,qtd,margem:faturamento?(faturamento-custo)/faturamento:0};
}

function renderDashboard(){
  const t=totals();
  $("kpiFaturamento").textContent=money(t.faturamento);
  $("kpiCusto").textContent=money(t.custo);
  $("kpiLucro").textContent=money(t.lucro);
  $("kpiMargem").textContent=pct(t.margem*100);
  $("kpiMeta").textContent=`Meta: ${pct(meta()*100)}`;
  $("kpiQtd").textContent=t.qtd.toLocaleString("pt-BR",{maximumFractionDigits:2});
  $("kpiClientes").textContent=state.clients.filter(x=>x.status!=="Inativo").length;
  $("kpiMargem").className=t.margem>=meta()?"good":"bad";

  const by={};
  state.sales.forEach(s=>{
    const k=clientName(s.clienteId);
    if(!by[k]) by[k]={f:0,c:0};
    by[k].f+=Number(s.faturamento||0); by[k].c+=Number(s.custoTotal||0);
  });
  const arr=Object.entries(by).map(([nome,v])=>({nome,m:v.f?(v.f-v.c)/v.f:0,f:v.f})).sort((a,b)=>b.f-a.f).slice(0,10);
  const max=Math.max(...arr.map(x=>x.f),1);
  $("clientChart").innerHTML=arr.length?arr.map(x=>`<div class="bar-row"><span>${escapeHtml(x.nome)}</span><div class="bar-bg"><div class="bar-fill" style="width:${x.f/max*100}%"></div></div><b>${pct(x.m*100)}</b></div>`).join(""):"<p>Nenhuma venda cadastrada.</p>";

  const recent=[...state.sales].sort((a,b)=>(b.data?.seconds||0)-(a.data?.seconds||0)).slice(0,7);
  $("recentSales").innerHTML=recent.length?recent.map(s=>`<div class="sale-line"><span>${escapeHtml(clientName(s.clienteId))} — ${escapeHtml(productName(s.produtoId))}<br><small>${Number(s.quantidade||0)} × ${money(s.precoUnit)}</small></span><b>${money(s.faturamento)}</b></div>`).join(""):"<p>Nenhuma venda cadastrada.</p>";
}

function renderClients(){
  const q=($("clientSearch").value||"").toLowerCase();
  const rows=state.clients.filter(x=>`${x.nome} ${x.documento||""} ${x.tabela||""}`.toLowerCase().includes(q));
  $("clientsTable").innerHTML=rows.map(x=>{
    const sales=state.sales.filter(s=>s.clienteId===x.id);
    const f=sales.reduce((a,s)=>a+Number(s.faturamento||0),0), c=sales.reduce((a,s)=>a+Number(s.custoTotal||0),0);
    const m=f?(f-c)/f:0;
    return `<tr><td><b>${escapeHtml(x.nome)}</b></td><td>${escapeHtml(x.documento||"")}</td><td>${escapeHtml(x.tabela||"")}</td><td>${money(f)}</td><td class="${m>=meta()?"margin-good":"margin-low"}">${pct(m*100)}</td><td class="actions"><button class="mini" onclick="editClient('${x.id}')">Editar</button><button class="mini danger" onclick="removeItem('clientes','${x.id}')">Excluir</button></td></tr>`;
  }).join("");
}
function renderProducts(){
  const q=($("productSearch").value||"").toLowerCase();
  const rows=state.products.filter(x=>`${x.nome} ${x.categoria||""} ${x.unidade||""}`.toLowerCase().includes(q));
  $("productsTable").innerHTML=rows.map(x=>`<tr><td><b>${escapeHtml(x.nome)}</b></td><td>${escapeHtml(x.categoria||"")}</td><td>${escapeHtml(x.unidade||"")}</td><td>${money(x.custo)}</td><td class="actions"><button class="mini" onclick="editProduct('${x.id}')">Editar</button><button class="mini danger" onclick="removeItem('produtos','${x.id}')">Excluir</button></td></tr>`).join("");
}
function renderPrices(){
  const q=($("priceSearch").value||"").toLowerCase();
  const rows=state.prices.filter(x=>`${clientName(x.clienteId)} ${productName(x.produtoId)}`.toLowerCase().includes(q));
  $("pricesTable").innerHTML=rows.map(x=>{
    const c=productCost(x.produtoId), m=Number(x.preco)?(x.preco-c)/Number(x.preco):0;
    return `<tr><td>${escapeHtml(clientName(x.clienteId))}</td><td>${escapeHtml(productName(x.produtoId))}</td><td>${money(c)}</td><td>${money(x.preco)}</td><td class="${m>=meta()?"margin-good":"margin-low"}">${pct(m*100)}</td><td class="actions"><button class="mini" onclick="editPrice('${x.id}')">Editar</button><button class="mini danger" onclick="removeItem('precos','${x.id}')">Excluir</button></td></tr>`;
  }).join("");
}
function renderSales(){
  const q=($("saleSearch").value||"").toLowerCase();
  const rows=state.sales.filter(x=>`${clientName(x.clienteId)} ${productName(x.produtoId)}`.toLowerCase().includes(q));
  $("salesTable").innerHTML=rows.map(x=>{
    const m=Number(x.faturamento)?(Number(x.faturamento)-Number(x.custoTotal||0))/Number(x.faturamento):0;
    return `<tr><td>${x.data?.seconds?new Date(x.data.seconds*1000).toLocaleDateString("pt-BR"):(x.dataTexto||"")}</td><td>${escapeHtml(clientName(x.clienteId))}</td><td>${escapeHtml(productName(x.produtoId))}</td><td>${Number(x.quantidade||0).toLocaleString("pt-BR")}</td><td>${money(x.faturamento)}</td><td>${money(x.custoTotal)}</td><td class="${m>=meta()?"margin-good":"margin-low"}">${pct(m*100)}</td><td><button class="mini danger" onclick="removeItem('vendas','${x.id}')">Excluir</button></td></tr>`;
  }).join("");
}
function renderReports(){
  const q=($("reportSearch").value||"").toLowerCase();
  const t=totals();
  const rows=state.clients.map(c=>{
    const ss=state.sales.filter(s=>s.clienteId===c.id);
    const f=ss.reduce((a,s)=>a+Number(s.faturamento||0),0), cost=ss.reduce((a,s)=>a+Number(s.custoTotal||0),0), qty=ss.reduce((a,s)=>a+Number(s.quantidade||0),0);
    return {c,f,cost,l:f-cost,m:f?(f-cost)/f:0,qty};
  }).filter(x=>x.c.nome.toLowerCase().includes(q)).sort((a,b)=>b.f-a.f);
  $("reportTable").innerHTML=rows.map(x=>`<tr><td>${escapeHtml(x.c.nome)}</td><td>${money(x.f)}</td><td>${money(x.cost)}</td><td>${money(x.l)}</td><td class="${x.m>=meta()?"margin-good":"margin-low"}">${pct(x.m*100)}</td><td>${pct(t.faturamento?x.f/t.faturamento*100:0)}</td><td>${x.qty.toLocaleString("pt-BR",{maximumFractionDigits:2})}</td></tr>`).join("");
}
function renderAll(){renderDashboard();renderClients();renderProducts();renderPrices();renderSales();renderReports();populateSim();}

function openModal(title, fields, onSubmit){
  $("modalTitle").textContent=title;
  $("modalForm").innerHTML=`<div class="modal-form">${fields.join("")}<div class="form-actions"><button type="button" class="btn secondary" id="cancelModal">Cancelar</button><button class="btn primary">Salvar</button></div></div>`;
  $("modal").classList.remove("hidden");
  $("cancelModal").onclick=closeModal;
  $("modalForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);await onSubmit(Object.fromEntries(fd));closeModal();await loadData();};
}
function closeModal(){$("modal").classList.add("hidden");$("modalForm").innerHTML=""}
const input=(name,label,value="",type="text",extra="")=>`<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra} required></label>`;
const select=(name,label,options,value="")=>`<label>${label}<select name="${name}" required><option value="">Selecione...</option>${options.map(o=>`<option value="${o.id}" ${o.id===value?"selected":""}>${escapeHtml(o.nome)}</option>`).join("")}</label>`;

function addClient(){
  openModal("Novo cliente",[input("nome","Nome"),input("documento","CNPJ/CPF"),input("tabela","Tabela / grupo"),input("observacao","Observação")],async d=>addDoc(collection(db,"clientes"),{...d,status:"Ativo",createdAt:serverTimestamp()}));
}
function editClient(id){const x=state.clients.find(a=>a.id===id);openModal("Editar cliente",[input("nome","Nome",x.nome),input("documento","CNPJ/CPF",x.documento||""),input("tabela","Tabela / grupo",x.tabela||""),input("observacao","Observação",x.observacao||"")],async d=>updateDoc(doc(db,"clientes",id),d));}
function addProduct(){
  openModal("Novo produto",[input("nome","Produto"),input("categoria","Categoria"),input("unidade","Unidade", "m²"),input("custo","Custo",0,"number",'step="0.01"')],async d=>addDoc(collection(db,"produtos"),{...d,custo:Number(d.custo),createdAt:serverTimestamp()}));
}
function editProduct(id){const x=state.products.find(a=>a.id===id);openModal("Editar produto",[input("nome","Produto",x.nome),input("categoria","Categoria",x.categoria||""),input("unidade","Unidade",x.unidade||"m²"),input("custo","Custo",x.custo,"number",'step="0.01"')],async d=>updateDoc(doc(db,"produtos",id),{...d,custo:Number(d.custo)}));}
function addPrice(){
  openModal("Novo preço negociado",[select("clienteId","Cliente",state.clients),select("produtoId","Produto",state.products),input("preco","Preço negociado",0,"number",'step="0.01"'),input("observacao","Observação")],async d=>addDoc(collection(db,"precos"),{...d,preco:Number(d.preco),createdAt:serverTimestamp()}));
}
function editPrice(id){const x=state.prices.find(a=>a.id===id);openModal("Editar preço",[select("clienteId","Cliente",state.clients,x.clienteId),select("produtoId","Produto",state.products,x.produtoId),input("preco","Preço negociado",x.preco,"number",'step="0.01"'),input("observacao","Observação",x.observacao||"")],async d=>updateDoc(doc(db,"precos",id),{...d,preco:Number(d.preco)}));}
function addSale(){
  openModal("Nova venda",[select("clienteId","Cliente",state.clients),select("produtoId","Produto",state.products),input("precoUnit","Preço unitário",0,"number",'step="0.01"'),input("quantidade","Quantidade / m²",1,"number",'step="0.01"')],async d=>{
    const qtd=Number(d.quantidade), preco=Number(d.precoUnit), custo=productCost(d.produtoId);
    await addDoc(collection(db,"vendas"),{clienteId:d.clienteId,produtoId:d.produtoId,precoUnit:preco,quantidade:qtd,faturamento:preco*qtd,custoTotal:custo*qtd,data:serverTimestamp(),dataTexto:new Date().toLocaleDateString("pt-BR")});
  });
}
async function removeItem(collectionName,id){
  if(!confirm("Excluir este registro?"))return;
  await deleteDoc(doc(db,collectionName,id)); await loadData();
}
window.removeItem=removeItem;window.editClient=editClient;window.editProduct=editProduct;window.editPrice=editPrice;

function populateSim(){
  $("simClient").innerHTML='<option value="">Selecione...</option>'+state.clients.map(x=>`<option value="${x.id}">${escapeHtml(x.nome)}</option>`).join("");
  $("simProduct").innerHTML='<option value="">Selecione...</option>'+state.products.map(x=>`<option value="${x.id}">${escapeHtml(x.nome)}</option>`).join("");
  calcSim();
}
function calcSim(){
  const price=Number($("simPrice").value)||0, qty=Number($("simQty").value)||0, pid=$("simProduct").value, cost=productCost(pid);
  const itemMargin=price?(price-cost)/price:0;
  const t=totals();
  const newF=t.faturamento+price*qty, newC=t.custo+cost*qty, newM=newF?(newF-newC)/newF:0;
  $("simItemMargin").textContent=pct(itemMargin*100);
  $("simCurrentMargin").textContent=pct(t.margem*100);
  $("simNewMargin").textContent=pct(newM*100);
  $("simImpact").textContent=`${((newM-t.margem)*100).toFixed(2).replace(".",",")} p.p.`;
}

document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(btn.dataset.view).classList.add("active");
  $("pageTitle").textContent=btn.textContent.trim();
});
$("closeModal").onclick=closeModal;$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("addClientBtn").onclick=addClient;$("addProductBtn").onclick=addProduct;$("addPriceBtn").onclick=addPrice;$("addSaleBtn").onclick=addSale;$("refreshBtn").onclick=loadData;
["clientSearch","productSearch","priceSearch","saleSearch","reportSearch","metaInput"].forEach(id=>$(id).addEventListener("input",renderAll));
["simPrice","simQty","simProduct","simClient"].forEach(id=>$(id).addEventListener("input",calcSim));
$("exportCsvBtn").onclick=()=>{
  const rows=[["Cliente","Faturamento","Custo","Lucro","Margem","Participação","Quantidade"]];
  const t=totals();
  state.clients.forEach(c=>{const ss=state.sales.filter(s=>s.clienteId===c.id),f=ss.reduce((a,s)=>a+Number(s.faturamento||0),0),co=ss.reduce((a,s)=>a+Number(s.custoTotal||0),0),q=ss.reduce((a,s)=>a+Number(s.quantidade||0),0);if(f)rows.push([c.nome,f,co,f-co,(f-co)/f,t.faturamento?f/t.faturamento:0,q])});
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="relatorio-margem-cubo-glass.csv";a.click();
};
loadData().catch(err=>{$("dbStatus").textContent="Erro no Firebase";console.error(err);alert("Não foi possível conectar ao Firebase. Confira o firebaseConfig no app.js e as regras do Firestore.");});
