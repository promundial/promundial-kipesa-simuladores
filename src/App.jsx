import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TallerAutos from "./TallerAutos";
import TallerMotos from "./TallerMotos";
import VNAutos from "./VNAutos";
import VNMotos from "./VNMotos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{minHeight:"100vh",background:"#F7F5F0",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
            <div style={{maxWidth:420,width:"100%",padding:24}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <h1 style={{color:"#0F3521",fontSize:22,marginBottom:4}}>Simuladores Monte Carlo</h1>
                <p style={{color:"#7A7267",fontSize:12,margin:0}}>Promundial Consulting Group · KIPESA Nicaragua</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Link to="/taller-autos" style={{display:"block",padding:"16px 20px",borderRadius:10,textDecoration:"none",color:"#fff",fontSize:15,fontWeight:600,background:"linear-gradient(135deg,#1A5C38,#0F3521)"}}>🔧 Taller de Autos<span style={{display:"block",fontSize:11,fontWeight:400,opacity:.8,marginTop:3}}>Servicios y repuestos · 3 cuellos de botella · Absorción</span></Link>
                <Link to="/taller-motos" style={{display:"block",padding:"16px 20px",borderRadius:10,textDecoration:"none",color:"#fff",fontSize:15,fontWeight:600,background:"linear-gradient(135deg,#2E5E8E,#1A3D5C)"}}>🏍️ Taller de Motos<span style={{display:"block",fontSize:11,fontWeight:400,opacity:.8,marginTop:3}}>Servicios y repuestos motos · Defaults calibrados</span></Link>
                <Link to="/vn-autos" style={{display:"block",padding:"16px 20px",borderRadius:10,textDecoration:"none",color:"#fff",fontSize:15,fontWeight:600,background:"linear-gradient(135deg,#1A5C38,#0F3521)"}}>🚗 Venta Autos Nuevos<span style={{display:"block",fontSize:11,fontWeight:400,opacity:.8,marginTop:3}}>Funnel comercial · Inventario · Floor plan</span></Link>
                <Link to="/vn-motos" style={{display:"block",padding:"16px 20px",borderRadius:10,textDecoration:"none",color:"#fff",fontSize:15,fontWeight:600,background:"linear-gradient(135deg,#C8922A,#A07020)"}}>🏍️ Venta Motos Nuevas<span style={{display:"block",fontSize:11,fontWeight:400,opacity:.8,marginTop:3}}>Funnel comercial motos · Sin devoluciones</span></Link>
              </div>
              <div style={{textAlign:"center",marginTop:24,fontSize:10,color:"#7A7267"}}>© Promundial Consulting Group · IR 32% · WACC 14%</div>
            </div>
          </div>
        }/>
        <Route path="/taller-autos" element={<TallerAutos/>}/>
        <Route path="/taller-motos" element={<TallerMotos/>}/>
        <Route path="/vn-autos" element={<VNAutos/>}/>
        <Route path="/vn-motos" element={<VNMotos/>}/>
      </Routes>
    </BrowserRouter>
  );
}
