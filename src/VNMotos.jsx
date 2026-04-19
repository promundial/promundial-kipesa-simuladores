import { useState, useCallback, useMemo, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
// SIMULADOR MONTE CARLO — VENTA DE AUTOS NUEVOS
// Funnel comercial completo + Goal-Seeking inverso
// Promundial Consulting Group
// ═══════════════════════════════════════════════════════════════════════

const C = {
  deep:"#0F3521",green:"#1A5C38",gold:"#C8922A",light:"#F7F5F0",
  card:"#FFFFFF",border:"#E2DDD5",text:"#2C2C2C",muted:"#7A7267",
  red:"#B34040",blue:"#2E5E8E",teal:"#1A7A6D",purple:"#5B4A8A",
  orange:"#D4772C",
};

const PD = {
  // ╔═══════════════════════════════════════════════════════════╗
  // ║  FUNNEL COMERCIAL                                        ║
  // ╚═══════════════════════════════════════════════════════════╝
  leads_mes:            {mean:600,std:100,min:150,max:1500,label:"Leads / mes",unit:"u",group:"funnel",lever:true},
  tasa_conversion:      {mean:15,std:3,min:5,max:30,label:"Tasa de conversión %",unit:"%",group:"funnel",lever:true},
  cierre_1er_contacto:  {mean:45,std:8,min:20,max:70,label:"% cierre en 1er contacto",unit:"%",group:"funnel",lever:true},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PRECIO Y MARGEN                                         ║
  // ╚═══════════════════════════════════════════════════════════╝
  precio_promedio:      {mean:3000,std:600,min:1200,max:8000,label:"Precio promedio venta",unit:"$",group:"precio",lever:false},
  margen_bruto_pct:     {mean:13,std:2,min:5,max:22,label:"Margen bruto %",unit:"%",group:"precio",lever:true},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PRODUCTIVIDAD COMERCIAL                                 ║
  // ╚═══════════════════════════════════════════════════════════╝
  productividad:        {mean:20,std:4,min:8,max:40,label:"Unidades / vendedor / mes",unit:"u",group:"prod",lever:true},
  sueldo_base:          {mean:450,std:80,min:250,max:900,label:"Sueldo base vendedor / mes",unit:"$",group:"prod",lever:false},
  comision_por_u:       {mean:40,std:15,min:10,max:100,label:"Comisión por unidad vendida",unit:"$",group:"prod",lever:false},
  gerente_ventas:       {mean:1500,std:250,min:800,max:3000,label:"Sueldo gerente ventas / mes",unit:"$",group:"prod",lever:false},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  MARKETING                                               ║
  // ╚═══════════════════════════════════════════════════════════╝
  gasto_marketing:      {mean:5000,std:1000,min:1500,max:15000,label:"Gasto marketing / mes",unit:"$",group:"mktg",lever:true},
  costo_por_lead:       {mean:12,std:4,min:3,max:35,label:"Costo por lead",unit:"$",group:"mktg",lever:true},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  INVENTARIO Y FLOOR PLAN                                 ║
  // ╚═══════════════════════════════════════════════════════════╝
  dias_inventario:      {mean:45,std:10,min:15,max:90,label:"Días inventario motos",unit:"d",group:"inv",lever:true},
  unidades_stock:       {mean:200,std:40,min:50,max:500,label:"Unidades en stock (promedio)",unit:"u",group:"inv",lever:false},
  tasa_floorplan:       {mean:10,std:1.5,min:5,max:18,label:"Tasa floor plan % anual",unit:"%",group:"inv",lever:false},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GASTOS FIJOS Y OVERHEAD                                 ║
  // ╚═══════════════════════════════════════════════════════════╝
  personal_admin_vn:    {mean:2,std:0.5,min:1,max:4,label:"Personal admin VN motos",unit:"u",group:"gastos",lever:false},
  sueldo_admin:         {mean:700,std:100,min:400,max:1400,label:"Sueldo admin VN motos / mes",unit:"$",group:"gastos",lever:false},
  alquiler_showroom:    {mean:3500,std:800,min:1500,max:10000,label:"Alquiler punto de venta / mes",unit:"$",group:"gastos",lever:false},
  servicios_mes:        {mean:1200,std:300,min:500,max:3000,label:"Servicios básicos / mes",unit:"$",group:"gastos",lever:false},
  otros_gastos:         {mean:2000,std:500,min:800,max:5000,label:"Otros gastos generales / mes",unit:"$",group:"gastos",lever:false},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  DEPRECIACIÓN Y AMORTIZACIÓN                             ║
  // ╚═══════════════════════════════════════════════════════════╝
  deprec_showroom:      {mean:1000,std:200,min:0,max:3000,label:"Depreciación punto de venta / mes",unit:"$",group:"dya",lever:false},
  deprec_vehiculos:     {mean:500,std:100,min:0,max:1500,label:"Depreciación demos / utilitarios",unit:"$",group:"dya",lever:false},
  amort_software:       {mean:400,std:100,min:0,max:1000,label:"Amortización CRM/DMS / mes",unit:"$",group:"dya",lever:false},

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  EVA                                                     ║
  // ╚═══════════════════════════════════════════════════════════╝
  tasa_imp:             {mean:32,std:0,min:32,max:32,label:"Tasa impositiva % (IR 32%)",unit:"%",group:"eva_p",lever:false},
  capital_vn:           {mean:400000,std:60000,min:150000,max:1000000,label:"Capital invertido VN motos",unit:"$",group:"eva_p",lever:false},
  wacc:                 {mean:14,std:1.5,min:8,max:18,label:"WACC %",unit:"%",group:"eva_p",lever:false},
};

function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function S(p){return Math.max(p.min,Math.min(p.max,p.mean+randn()*p.std));}
function pctle(a,p){const s=[...a].sort((x,y)=>x-y);return s[Math.max(0,Math.ceil(s.length*p/100)-1)];}
function avg(a){return a.reduce((x,y)=>x+y,0)/a.length;}
const fmt=v=>{if(Math.abs(v)>=1e6)return(v/1e6).toFixed(2)+"M";if(Math.abs(v)>=1e3)return(v/1e3).toFixed(1)+"K";return v.toFixed(0);};
const fmtF=v=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(v);

// ═══ SIMULATION ═══
function simOnce(P){
  let tIngVN=0,tCOGS=0,tUVN=0,tVend=0;
  let tGVend=0,tGMktg=0,tGLeads=0,tFP=0,tGAdmin=0,tDA=0;

  for(let m=0;m<12;m++){
    // Funnel
    const leads=Math.round(S(P.leads_mes));
    const conv=S(P.tasa_conversion)/100;
    const uVN=Math.round(leads*conv);
    const precio=S(P.precio_promedio);
    const mb=S(P.margen_bruto_pct)/100;

    tIngVN+=uVN*precio;
    tCOGS+=uVN*precio*(1-mb); tUVN+=uVN;

    // Headcount from productivity
    const prod=S(P.productividad);
    const vendN=Math.ceil(uVN/Math.max(1,prod)); tVend+=vendN;
    tGVend+=vendN*S(P.sueldo_base)+uVN*S(P.comision_por_u)+S(P.gerente_ventas);

    // Marketing
    tGMktg+=S(P.gasto_marketing);
    tGLeads+=leads*S(P.costo_por_lead);

    // Floor plan
    const stock=Math.round(S(P.unidades_stock));
    tFP+=(stock*precio)*S(P.tasa_floorplan)/100/12;

    // Admin & gastos fijos
    const admN=Math.round(S(P.personal_admin_vn));
    tGAdmin+=admN*S(P.sueldo_admin)+S(P.alquiler_showroom)+S(P.servicios_mes)+S(P.otros_gastos);

    // D&A
    tDA+=S(P.deprec_showroom)+S(P.deprec_vehiculos)+S(P.amort_software);
  }

  const ingTotal=tIngVN;
  const margenBruto=tIngVN-tCOGS;
  const gastosComerciales=tGVend+tGMktg+tGLeads;
  const gastosTotal=gastosComerciales+tFP+tGAdmin;
  const ebitda=margenBruto-gastosTotal;
  const ebit=ebitda-tDA;
  const tx=P.tasa_imp.mean/100;
  const un=ebit>0?ebit*(1-tx):ebit;
  const cap=S(P.capital_vn),wacc=S(P.wacc)/100;
  const eva=un-cap*wacc;

  // Derived KPIs
  const fiPorU=tUVN>0?(tFI/tUVN):0;
  const costoAdq=tUVN>0?((tGMktg+tGLeads)/tUVN):0;
  const margenPorU=tUVN>0?(margenBruto/tUVN):0;
  const rotInv=tUVN>0?(tUVN/(S(P.unidades_stock)||1)):0;

  return{
    ingTotal,ingVN:tIngVN,
    margenBruto,cogs:tCOGS,
    gastosComerciales,floorPlan:tFP,gastosAdmin:tGAdmin,gastosTotal,da:tDA,
    ebitda,ebit,utilidadNeta:un,eva,
    uVN:tUVN,vendProm:tVend/12,costoAdq,margenPorU,rotInv,
  };
}
function runSim(P,n){const r=[];for(let i=0;i<n;i++)r.push(simOnce(P));return r;}

function goalSeek({params,metric,target,conf,levers,maxIter=25,simN=600}){
  let cur={};Object.entries(params).forEach(([k,v])=>{cur[k]={...v};});
  const log=[],checkP=100-conf;
  for(let it=0;it<maxIter;it++){
    const res=runSim(cur,simN);
    const vals=res.map(r=>r[metric]).sort((a,b)=>a-b);
    const cv=pctle(vals,checkP),gap=target-cv;
    log.push({it,val:cv,gap});
    if(Math.abs(gap)<Math.abs(target)*0.02||gap<=0)return{ok:true,params:cur,log,final:cv,iters:it+1};
    const sens={};let totS=0;
    levers.forEach(k=>{
      const tw={...cur,[k]:{...cur[k],mean:cur[k].mean*1.05}};
      const tr=runSim(tw,Math.min(400,simN));
      sens[k]=(pctle(tr.map(r=>r[metric]).sort((a,b)=>a-b),checkP)-cv)/0.05;totS+=Math.abs(sens[k]);
    });
    if(!totS)return{ok:false,params:cur,log,final:cv,iters:it+1};
    levers.forEach(k=>{
      if(Math.abs(sens[k])<totS*0.01)return;
      const w=sens[k]/totS;
      let nm=cur[k].mean*(1+Math.max(-0.12,Math.min(0.12,(gap/(sens[k]||1))*w*0.35)));
      cur[k]={...cur[k],mean:Math.max(cur[k].min,Math.min(cur[k].max,nm))};
    });
  }
  const fR=runSim(cur,simN);
  return{ok:false,params:cur,log,final:pctle(fR.map(r=>r[metric]).sort((a,b)=>a-b),checkP),iters:maxIter};
}

// ─── UI ───
function Histo({values,color,label,target,w=286,h=72}){
  const sorted=[...values].sort((a,b)=>a-b);
  const bins=28,mn=sorted[0],mx=sorted[sorted.length-1],rng=mx-mn||1,bw=rng/bins;
  const cts=new Array(bins).fill(0);
  sorted.forEach(v=>{let i=Math.floor((v-mn)/bw);if(i>=bins)i=bins-1;cts[i]++;});
  const maxC=Math.max(...cts),barW=w/bins,toX=v=>Math.max(0,Math.min(w,((v-mn)/rng)*w));
  const p10=pctle(sorted,10),p50=pctle(sorted,50),p90=pctle(sorted,90);
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
        <span style={{fontFamily:"var(--serif)",fontSize:11,fontWeight:700,color:C.deep}}>{label}</span>
        <span style={{fontFamily:"var(--mono)",fontSize:8,color:C.muted}}>μ ${fmt(avg(values))}</span>
      </div>
      <svg width={w} height={h+18} style={{display:"block"}}>
        {cts.map((c,i)=><rect key={i} x={i*barW} y={h-(c/maxC)*h} width={barW-.5} height={(c/maxC)*h} fill={color} opacity={.45} rx={1}/>)}
        {target!==undefined&&<><line x1={toX(target)} x2={toX(target)} y1={0} y2={h} stroke={C.red} strokeWidth={2} strokeDasharray="4,3"/><text x={toX(target)} y={h+10} fill={C.red} fontSize={7} fontFamily="var(--mono)" textAnchor="middle">META</text></>}
        {[[p10,"#D06838","P10"],[p50,C.deep,"P50"],[p90,C.blue,"P90"]].map(([v,cl,lb])=>(
          <g key={lb}><line x1={toX(v)} x2={toX(v)} y1={0} y2={h} stroke={cl} strokeWidth={1.2} strokeDasharray={lb==="P50"?"0":"3,2"}/><text x={toX(v)} y={h+16} fill={cl} fontSize={7} fontFamily="var(--mono)" textAnchor="middle">{lb} ${fmt(v)}</text></g>
        ))}
      </svg>
    </div>
  );
}

function Section({title,icon,color,children,defaultOpen=false}){
  const[open,setOpen]=useState(defaultOpen);
  return(
    <div style={{background:C.card,borderRadius:6,marginBottom:6,border:`1px solid ${C.border}`,borderTop:`3px solid ${color}`,overflow:"hidden"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontFamily:"var(--serif)",fontSize:12,fontWeight:700,color}}>{icon} {title}</span>
        <span style={{fontSize:14,color:C.muted,transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0)"}}>{open?"▾":"▸"}</span>
      </button>
      {open&&<div style={{padding:"0 8px 6px"}}>{children}</div>}
    </div>
  );
}

function PI({k,p,val,onChange,hl}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2,background:hl?`${C.gold}12`:"transparent",padding:"1px 3px",borderRadius:3}}>
      <label style={{width:175,fontSize:9.5,fontFamily:"var(--mono)",color:C.text,flexShrink:0,lineHeight:1.15}}>{p.label}</label>
      {["mean","std"].map(f=>(
        <div key={f} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
          <span style={{fontSize:6,color:C.muted,letterSpacing:1}}>{f==="mean"?"μ":"σ"}</span>
          <input type="number" value={val[f]} onChange={e=>onChange(k,f,parseFloat(e.target.value)||0)}
            style={{width:56,padding:"2px 3px",fontSize:10,fontFamily:"var(--mono)",border:`1px solid ${hl?C.gold:C.border}`,borderRadius:2,background:C.light,textAlign:"right"}}/>
        </div>
      ))}
      <span style={{fontSize:7,color:C.muted,width:12}}>{p.unit}</span>
    </div>
  );
}

// ═══ MAIN ═══
export default function VNMotosMonteCarlo(){
  const[params,setParams]=useState(()=>{const p={};Object.entries(PD).forEach(([k,v])=>{p[k]={...v};});return p;});
  const[numSims,setNumSims]=useState(3000);
  const[results,setResults]=useState(null);
  const[running,setRunning]=useState(false);
  const[tab,setTab]=useState("supuestos");
  const[sensData,setSensData]=useState(null);
  const[sensTarget,setSensTarget]=useState("eva");
  const[gsMetric,setGsMetric]=useState("eva");
  const[gsTarget,setGsTarget]=useState(100000);
  const[gsConf,setGsConf]=useState(60);
  const[gsLevers,setGsLevers]=useState(()=>{const l={};Object.entries(PD).forEach(([k,v])=>{if(v.lever)l[k]=true;});return l;});
  const[gsResult,setGsResult]=useState(null);
  const[gsRunning,setGsRunning]=useState(false);
  const origRef=useRef(null);

  const chg=useCallback((k,f,v)=>{setParams(p=>({...p,[k]:{...p[k],[f]:v}}));},[]);

  const handleRun=useCallback(()=>{
    setRunning(true);
    setTimeout(()=>{
      const res=runSim(params,numSims);setResults(res);
      const metrics=["eva","ebitda","ebit","utilidadNeta"];
      const bv={};metrics.forEach(m=>{bv[m]=avg(res.map(r=>r[m]));});
      const se={};Object.keys(params).filter(k=>k!=="tasa_imp").forEach(k=>{
        const tw={...params,[k]:{...params[k],mean:params[k].mean*1.10}};
        const tr=runSim(tw,Math.min(500,numSims));
        se[k]={};metrics.forEach(m=>{se[k][m]=avg(tr.map(r=>r[m]))-bv[m];});
      });
      setSensData(se);setRunning(false);setTab("results");
    },50);
  },[params,numSims]);

  const handleGS=useCallback(()=>{
    setGsRunning(true);
    origRef.current={};Object.entries(params).forEach(([k,v])=>{origRef.current[k]={...v};});
    setTimeout(()=>{
      const lk=Object.keys(gsLevers).filter(k=>gsLevers[k]);
      const r=goalSeek({params,metric:gsMetric,target:gsTarget,conf:gsConf,levers:lk});
      setGsResult(r);
      const optP=r.params;
      const fr=runSim(optP,numSims);setResults(fr);
      const metrics=["eva","ebitda","ebit","utilidadNeta"];
      const bv={};metrics.forEach(m=>{bv[m]=avg(fr.map(x=>x[m]));});
      const se={};Object.keys(optP).filter(k=>k!=="tasa_imp").forEach(k=>{
        const tw={...optP,[k]:{...optP[k],mean:optP[k].mean*1.10}};
        const tr=runSim(tw,Math.min(500,numSims));
        se[k]={};metrics.forEach(m=>{se[k][m]=avg(tr.map(x=>x[m]))-bv[m];});
      });
      setSensData(se);
      setParams(prev=>{const n={...prev};Object.entries(optP).forEach(([k,v])=>{n[k]={...v};});return n;});
      setGsRunning(false);setTab("goalseeking");
    },80);
  },[params,gsMetric,gsTarget,gsConf,gsLevers,numSims]);

  const stats=useMemo(()=>{
    if(!results)return null;
    const ex=f=>{const v=results.map(r=>r[f]).sort((a,b)=>a-b);return{values:v,mean:avg(v),p10:pctle(v,10),p50:pctle(v,50),p90:pctle(v,90)};};
    return{
      ebitda:ex("ebitda"),ebit:ex("ebit"),utilidadNeta:ex("utilidadNeta"),eva:ex("eva"),
      ingTotal:ex("ingTotal"),ingVN:ex("ingVN"),
      margenBruto:ex("margenBruto"),
      gastosComerciales:ex("gastosComerciales"),floorPlan:ex("floorPlan"),gastosAdmin:ex("gastosAdmin"),gastosTotal:ex("gastosTotal"),da:ex("da"),
      uVN:ex("uVN"),vendProm:ex("vendProm"),costoAdq:ex("costoAdq"),margenPorU:ex("margenPorU"),
    };
  },[results]);

  const sortedSens=useMemo(()=>{
    if(!sensData)return[];
    return Object.entries(sensData).map(([k,v])=>[k,v[sensTarget]]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,15);
  },[sensData,sensTarget]);

  const leverChanges=useMemo(()=>{
    if(!gsResult||!origRef.current)return[];
    const ch=[];
    Object.keys(gsResult.params).forEach(k=>{
      if(!PD[k]||!origRef.current[k])return;
      const o=origRef.current[k].mean,n=gsResult.params[k].mean,p=((n-o)/o)*100;
      if(Math.abs(p)>0.5)ch.push({k,label:PD[k].label,unit:PD[k].unit,o,n,p});
    });
    ch.sort((a,b)=>Math.abs(b.p)-Math.abs(a.p));return ch;
  },[gsResult]);

  const GC={
    funnel:{t:"Funnel Comercial",c:C.green,i:"🏍️"},
    precio:{t:"Precio y Margen",c:C.green,i:"💵"},
    prod:{t:"Productividad Comercial",c:C.blue,i:"👥"},
    mktg:{t:"Marketing y Adquisición",c:C.orange,i:"📣"},
    inv:{t:"Inventario Motos y Floor Plan",c:C.gold,i:"📦"},
    gastos:{t:"Gastos Fijos y Overhead",c:C.muted,i:"🏢"},
    dya:{t:"Depreciación y Amortización",c:C.purple,i:"📉"},
    eva_p:{t:"Parámetros EVA",c:C.purple,i:"📐"},
  };

  const tabs=[{k:"supuestos",l:"📝 Supuestos"},{k:"goalseeking",l:"🎯 Goal-Seek"},{k:"results",l:"📊 Resultados"},{k:"sensitivity",l:"🌪️ Tornado"}];
  const inpS={padding:"4px 7px",borderRadius:3,border:`1px solid ${C.border}`,fontSize:10,fontFamily:"var(--mono)",background:C.light,textAlign:"right"};

  return(
    <div style={{"--serif":"'Cormorant Garamond',serif","--sans":"'Outfit',sans-serif","--mono":"'JetBrains Mono',monospace",
      minHeight:"100vh",background:`linear-gradient(170deg,${C.light} 0%,#EDE8E0 100%)`,fontFamily:"var(--sans)",color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      <div style={{background:`linear-gradient(135deg,${C.deep} 0%,${C.green} 100%)`,padding:"14px 12px 10px",color:"#fff"}}>
        <svg width="150" height="22" viewBox="0 0 858 129" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom:6,display:"block"}}>
          <path d="M118.195 54.8174L99.4083 36.0308L87.6003 48.4433L109.189 48.6508L101.063 60.1719L80.0357 59.9704L76.8303 59.9399L66.4815 59.8422V24.2839L77.453 16.7314V38.3448L89.8777 26.5002L71.1827 7.80524C66.1091 2.73159 57.8911 2.73159 52.8174 7.80524L34.0309 26.5918L46.4433 38.3998L46.6509 16.8108L58.1719 24.9372L57.9704 45.9644L57.9399 49.1698L57.8422 59.5186H22.2839L14.7314 48.547H36.3448L24.5002 36.1224L5.80524 54.8174C0.731587 59.891 0.731587 68.1151 5.80524 73.1826L24.5918 91.9692L36.3998 79.5567L14.8108 79.3492L22.9372 67.8281L43.9645 68.0296L47.1699 68.0601L57.5186 68.1578V103.716L46.5471 111.269V89.6552L34.1225 101.5L52.8174 120.195C57.8911 125.268 66.1091 125.268 71.1827 120.195L89.9692 101.408L77.5568 89.6002L77.3492 111.189L65.8282 103.063L66.0297 82.0356L66.0602 78.8302L66.1579 68.4814H101.716L109.269 79.453H87.6553L99.4999 91.8776L118.195 73.1826C123.269 68.109 123.269 59.891 118.195 54.8174Z" fill="white"/>
          <path d="M173.977 73.19C172.701 73.19 171.425 73.19 170.149 73.19C168.873 73.19 167.738 73.0482 166.604 72.9065V104.098H152V24.2759H175.111C178.939 24.2759 182.342 24.4177 185.178 24.843C188.014 25.2684 190.708 25.6937 192.976 26.4026C198.364 28.1039 202.618 30.7978 205.595 34.3423C208.573 38.0286 209.991 42.7073 209.991 48.3785C209.991 52.2066 209.14 55.7511 207.58 58.7284C206.021 61.8476 203.61 64.3996 200.633 66.5263C197.513 68.653 193.827 70.3544 189.432 71.4887C184.894 72.6229 179.79 73.19 173.977 73.19ZM166.604 60.5716C167.455 60.7134 168.447 60.7134 169.865 60.8551C171.141 60.8551 172.559 60.997 173.835 60.997C177.805 60.997 181.066 60.7134 183.76 60.0045C186.454 59.4374 188.581 58.4449 190.141 57.3106C191.842 56.1764 192.976 54.7586 193.685 53.1991C194.394 51.6395 194.819 49.7963 194.819 47.9532C194.819 45.5429 194.252 43.558 193.26 41.8567C192.126 40.1553 190.282 38.8793 187.588 37.8868C186.171 37.4615 184.469 37.0361 182.484 36.8943C180.499 36.6108 177.947 36.6108 174.969 36.6108H166.746V60.5716H166.604Z" fill="white"/>
          <path d="M700.43 104.098V24.2759H715.034V104.098H700.43Z" fill="white"/>
          <path d="M814.569 24.2759V91.905H852.001V104.098H799.965V24.2759H814.569Z" fill="white"/>
        </svg>
        <div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700}}>Simulador Monte Carlo — Venta Motos Nuevas</div>
        <div style={{fontSize:7,opacity:.7,letterSpacing:1.5,textTransform:"uppercase"}}>Funnel Comercial Motos · Inventario · Goal-Seeking</div>
      </div>

      <div style={{padding:"8px 8px 36px"}}>
        <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
          <button onClick={handleRun} disabled={running} style={{padding:"7px 16px",borderRadius:4,border:"none",cursor:"pointer",background:running?C.muted:`linear-gradient(135deg,${C.green},${C.deep})`,color:"#fff",fontSize:10,fontWeight:600}}>{running?"⏳...":"▶ Simular"}</button>
          <button onClick={handleGS} disabled={gsRunning} style={{padding:"7px 16px",borderRadius:4,border:"none",cursor:"pointer",background:gsRunning?C.muted:`linear-gradient(135deg,${C.gold},${C.orange})`,color:"#fff",fontSize:10,fontWeight:600}}>{gsRunning?"⏳...":"🎯 Goal-Seek"}</button>
          <select value={numSims} onChange={e=>setNumSims(+e.target.value)} style={{...inpS,width:55,fontSize:9}}>{[1000,3000,5000].map(n=><option key={n} value={n}>{n}</option>)}</select>
        </div>

        <div style={{display:"flex",gap:0,marginBottom:8}}>
          {tabs.map((t,i)=>(<button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"6px 2px",fontSize:8.5,fontWeight:tab===t.k?600:400,background:tab===t.k?C.card:"transparent",color:tab===t.k?C.deep:C.muted,border:`1px solid ${C.border}`,borderBottom:tab===t.k?`2px solid ${C.gold}`:`1px solid ${C.border}`,borderRadius:i===0?"5px 0 0 0":i===tabs.length-1?"0 5px 0 0":0,cursor:"pointer"}}>{t.l}</button>))}
        </div>

        {/* ═══ SUPUESTOS ═══ */}
        {tab==="supuestos"&&(<div>
          {Object.entries(GC).map(([gk,gc])=>{
            const keys=Object.entries(PD).filter(([,v])=>v.group===gk).map(([k])=>k);
            if(!keys.length)return null;
            return(<Section key={gk} title={gc.t} icon={gc.i} color={gc.c} defaultOpen={["funnel","precio","prod"].includes(gk)}>
              {keys.map(k=><PI key={k} k={k} p={PD[k]} val={params[k]} onChange={chg} hl={gsLevers[k]}/>)}
            </Section>);
          })}
        </div>)}

        {/* ═══ GOAL-SEEKING ═══ */}
        {tab==="goalseeking"&&(<div>
          <div style={{background:C.card,borderRadius:6,padding:10,border:`1px solid ${C.border}`,marginBottom:8,borderTop:`3px solid ${C.gold}`}}>
            <div style={{fontFamily:"var(--serif)",fontSize:13,fontWeight:700,color:C.deep,marginBottom:6}}>🎯 Meta de Ventas Motos</div>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div>
                <div style={{fontSize:7,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:1}}>Métrica</div>
                <select value={gsMetric} onChange={e=>setGsMetric(e.target.value)} style={{...inpS,width:100}}>
                  <option value="eva">EVA</option><option value="ebitda">EBITDA</option><option value="ebit">EBIT</option><option value="utilidadNeta">Ut. Neta</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:7,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:1}}>Meta USD/año</div>
                <input type="number" value={gsTarget} onChange={e=>setGsTarget(parseFloat(e.target.value)||0)} style={{...inpS,width:95}}/>
              </div>
              <div>
                <div style={{fontSize:7,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:1}}>Confianza</div>
                <select value={gsConf} onChange={e=>setGsConf(+e.target.value)} style={{...inpS,width:55}}>{[50,60,70,80,90].map(n=><option key={n} value={n}>{n}%</option>)}</select>
              </div>
            </div>
            <div style={{fontSize:10,fontWeight:600,color:C.deep,marginBottom:4}}>Palancas</div>
            {Object.entries(GC).filter(([gk])=>Object.keys(PD).some(k=>PD[k].group===gk&&PD[k].lever)).map(([gk,gc])=>{
              const keys=Object.entries(PD).filter(([,v])=>v.group===gk&&v.lever).map(([k])=>k);
              if(!keys.length)return null;
              return(<div key={gk} style={{marginBottom:3}}>
                <div style={{fontSize:7,fontWeight:600,color:gc.c}}>{gc.i} {gc.t}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                  {keys.map(k=>(<button key={k} onClick={()=>setGsLevers(p=>({...p,[k]:!p[k]}))} style={{padding:"2px 5px",borderRadius:3,fontSize:7.5,fontFamily:"var(--mono)",border:`1px solid ${gsLevers[k]?C.gold:C.border}`,cursor:"pointer",background:gsLevers[k]?`${C.gold}20`:"transparent",color:gsLevers[k]?C.deep:C.muted}}>{PD[k].label}</button>))}
                </div>
              </div>);
            })}
          </div>
          {gsResult&&(
            <div style={{background:C.card,borderRadius:6,border:`1px solid ${C.border}`,marginBottom:8,overflow:"hidden"}}>
              <div style={{padding:"10px 12px",background:gsResult.ok?`linear-gradient(135deg,${C.green},${C.deep})`:`linear-gradient(135deg,${C.orange},${C.red})`,color:"#fff"}}>
                <div style={{fontSize:12,fontWeight:700}}>{gsResult.ok?"✅ Meta Alcanzable":"⚠️ Meta Difícil"}</div>
                <div style={{fontSize:10,fontFamily:"var(--mono)",opacity:.9,marginTop:2}}>{gsMetric.toUpperCase()} objetivo: ${fmtF(gsTarget)} → Logrado: ${fmtF(Math.round(gsResult.final))} ({gsConf}% confianza)</div>
              </div>
              <div style={{padding:"10px"}}>
                <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,color:C.deep,marginBottom:6}}>Objetivos KPI</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 65px 65px 50px",gap:2,padding:"5px 6px",background:C.deep,borderRadius:"4px 4px 0 0",color:"#fff",fontFamily:"var(--mono)",fontSize:8,fontWeight:600}}>
                  <div>KPI</div><div style={{textAlign:"center"}}>ACTUAL</div><div style={{textAlign:"center"}}>OBJETIVO</div><div style={{textAlign:"center"}}>DELTA</div>
                </div>
                {leverChanges.map((ch,idx)=>{
                  const up=ch.p>0;const isCost=ch.k.includes("sueldo")||ch.k.includes("gasto")||ch.k.includes("costo")||ch.k.includes("alquiler")||ch.k.includes("comision");
                  const good=isCost?!up:up;
                  const fmtVal=(v,u)=>{if(u==="%")return v.toFixed(1)+"%";if(u==="$")return"$"+fmtF(Math.round(v));return Math.round(v)+(u?" "+u:"");};
                  return(
                    <div key={ch.k} style={{display:"grid",gridTemplateColumns:"1fr 65px 65px 50px",gap:2,padding:"6px",alignItems:"center",background:idx%2===0?C.light:C.card,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:9.5,fontWeight:500}}>{ch.label}</div>
                      <div style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:10,color:C.muted}}>{fmtVal(ch.o,ch.unit)}</div>
                      <div style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:good?C.green:C.orange,background:good?`${C.green}12`:`${C.orange}12`,borderRadius:3,padding:"2px 4px"}}>{fmtVal(ch.n,ch.unit)}</div>
                      <div style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:9,fontWeight:600,color:good?C.green:C.orange}}>{up?"▲":"▼"} {Math.abs(ch.p).toFixed(1)}%</div>
                    </div>);
                })}
              </div>
            </div>
          )}
          {stats&&(
            <div style={{background:C.card,borderRadius:6,padding:10,border:`1px solid ${C.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:6}}>
                {[{l:"EBITDA",s:stats.ebitda,c:C.green},{l:"EVA",s:stats.eva,c:stats.eva.p50>=0?C.gold:C.red},{l:"UNID/AÑO",s:stats.uVN,c:C.blue,noD:true},{l:"COSTO ADQ/U",s:stats.costoAdq,c:C.orange}].map(x=>(
                  <div key={x.l} style={{background:C.light,borderRadius:4,padding:"5px 7px",borderLeft:`3px solid ${x.c}`}}>
                    <div style={{fontSize:7,textTransform:"uppercase",letterSpacing:1.5,color:C.muted}}>{x.l}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:500,color:x.c}}>{x.noD?Math.round(x.s.p50).toLocaleString():"$"+fmt(x.s.p50)}</div>
                  </div>
                ))}
              </div>
              <Histo values={stats.eva.values} color={C.gold} label="EVA" target={gsMetric==="eva"?gsTarget:undefined}/>
              <Histo values={stats.ebitda.values} color={C.green} label="EBITDA" target={gsMetric==="ebitda"?gsTarget:undefined}/>
            </div>
          )}
        </div>)}

        {/* ═══ RESULTS ═══ */}
        {tab==="results"&&stats&&(<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:6}}>
            {[{l:"EBITDA",s:stats.ebitda,c:C.green},{l:"EBIT",s:stats.ebit,c:C.blue},{l:"UT.NETA",s:stats.utilidadNeta,c:C.deep},{l:"EVA",s:stats.eva,c:stats.eva.p50>=0?C.gold:C.red}].map(x=>(
              <div key={x.l} style={{background:C.card,borderRadius:5,padding:"7px",border:`1px solid ${C.border}`,borderLeft:`3px solid ${x.c}`}}>
                <div style={{fontSize:7,textTransform:"uppercase",letterSpacing:1.5,color:C.muted}}>{x.l}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:500,color:x.c}}>${fmt(x.s.p50)}</div>
                <div style={{fontSize:7,fontFamily:"var(--mono)",color:C.muted}}>P10 ${fmt(x.s.p10)} · P90 ${fmt(x.s.p90)}</div>
              </div>
            ))}
          </div>

          {/* Operational KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:6}}>
            {[
              {l:"UNIDADES/AÑO",v:Math.round(stats.uVN.p50).toLocaleString(),c:C.green},
              {l:"VENDEDORES",v:stats.vendProm.p50.toFixed(1),c:C.blue},
              
              {l:"COSTO ADQ/U",v:"$"+fmt(stats.costoAdq.p50),c:C.orange},
            ].map(x=>(
              <div key={x.l} style={{background:C.card,borderRadius:4,padding:"5px 6px",border:`1px solid ${C.border}`,borderTop:`2px solid ${x.c}`}}>
                <div style={{fontSize:6,textTransform:"uppercase",letterSpacing:1,color:C.muted}}>{x.l}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:500,color:x.c}}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* P&L */}
          <div style={{background:C.card,borderRadius:6,padding:10,border:`1px solid ${C.border}`,marginBottom:6}}>
            <div style={{fontFamily:"var(--serif)",fontSize:12,fontWeight:700,color:C.deep,marginBottom:4}}>P&L VN Motos — Mediana Anual</div>
            {[
              {l:"INGRESOS VN",v:stats.ingTotal.p50,b:1,c:C.deep},
              {l:"  Venta vehículos",v:stats.ingVN.p50,c:C.green},
              {l:"MARGEN BRUTO",v:stats.margenBruto.p50,b:1,c:C.green,t:1},
              {l:"(-) GASTOS COMERCIALES",v:-stats.gastosComerciales.p50,b:1,c:C.red,t:1},
              {l:"(-) FLOOR PLAN",v:-stats.floorPlan.p50,c:C.orange},
              {l:"(-) GASTOS ADMIN/G&A",v:-stats.gastosAdmin.p50,c:C.red},
              {l:"= EBITDA",v:stats.ebitda.p50,b:1,c:C.green,t:1},
              {l:"(-) D&A",v:-stats.da.p50,c:C.muted},
              {l:"= EBIT",v:stats.ebit.p50,b:1,c:C.blue,t:1},
              {l:"(-) IR 32%",v:stats.ebit.p50>0?-stats.ebit.p50*0.32:0,c:C.muted},
              {l:"= UTILIDAD NETA",v:stats.utilidadNeta.p50,b:1,c:C.deep,t:1},
              {l:"(-) Cargo capital",v:-(params.capital_vn.mean*params.wacc.mean/100),c:C.red},
              {l:"= EVA",v:stats.eva.p50,b:1,c:stats.eva.p50>=0?C.gold:C.red,t:1},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontFamily:"var(--mono)",fontSize:8.5,fontWeight:r.b?600:400,borderTop:r.t?`1px solid ${C.border}`:"none"}}>
                <span>{r.l}</span><span style={{color:r.c}}>${fmtF(Math.round(r.v))}</span>
              </div>
            ))}
          </div>

          <div style={{background:C.card,borderRadius:6,padding:10,border:`1px solid ${C.border}`}}>
            <Histo values={stats.ebitda.values} color={C.green} label="EBITDA"/>
            <Histo values={stats.eva.values} color={C.gold} label="EVA"/>
            <Histo values={stats.uVN.values} color={C.blue} label="Unidades motos / año"/>
          </div>
        </div>)}
        {tab==="results"&&!stats&&(
          <div style={{background:C.card,borderRadius:6,padding:"24px 12px",textAlign:"center",border:`1px solid ${C.border}`,color:C.muted,fontSize:11}}>Presiona ▶ Simular o 🎯 Goal-Seek.</div>
        )}

        {/* ═══ TORNADO ═══ */}
        {tab==="sensitivity"&&(
          <div style={{background:C.card,borderRadius:6,padding:10,border:`1px solid ${C.border}`}}>
            <div style={{fontFamily:"var(--serif)",fontSize:12,fontWeight:700,color:C.deep,marginBottom:4}}>Tornado — Sensibilidad +10%</div>
            <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>
              {["eva","ebitda","ebit","utilidadNeta"].map(t=>(
                <button key={t} onClick={()=>setSensTarget(t)} style={{padding:"2px 7px",borderRadius:3,fontSize:8,fontFamily:"var(--mono)",border:`1px solid ${sensTarget===t?C.gold:C.border}`,background:sensTarget===t?`${C.gold}20`:"transparent",color:sensTarget===t?C.deep:C.muted,cursor:"pointer"}}>{t==="utilidadNeta"?"Ut.Neta":t.toUpperCase()}</button>
              ))}
            </div>
            {sortedSens.length>0?sortedSens.map(([k,val])=>{
              const mx=Math.max(...sortedSens.map(s=>Math.abs(s[1])));
              const pw=Math.abs(val)/mx*100;const ps=val>=0;
              return(
                <div key={k} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <div style={{width:155,fontSize:8,fontFamily:"var(--mono)",color:C.text,textAlign:"right",flexShrink:0,lineHeight:1.1}}>{params[k]?.label||k}</div>
                  <div style={{flex:1,height:10,background:"#F0ECE6",borderRadius:2,position:"relative"}}>
                    <div style={{position:"absolute",left:ps?"50%":`${50-pw/2}%`,width:`${pw/2}%`,height:"100%",background:ps?C.green:C.red,borderRadius:2,opacity:.6}}/>
                    <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.muted,opacity:.25}}/>
                  </div>
                  <div style={{width:48,fontSize:8,fontFamily:"var(--mono)",color:ps?C.green:C.red,flexShrink:0}}>{ps?"+":""}{fmt(val)}</div>
                </div>);
            }):(
              <div style={{textAlign:"center",padding:14,fontSize:10,color:C.muted}}>Ejecuta simulación primero.</div>
            )}
          </div>
        )}

        <div style={{marginTop:12,textAlign:"center",fontSize:7,color:C.muted}}>© Promundial Consulting Group · Monte Carlo VN Motos · Nicaragua IR 32%</div>
      </div>
    </div>
  );
}
