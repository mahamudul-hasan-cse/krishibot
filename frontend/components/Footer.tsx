"use client"
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{background: '#14532d'}}>
      
      {/* Main footer content */}
      <div style={{
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '48px 32px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px'
      }}>
        
        {/* Brand column */}
        <div>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
            <span style={{fontSize:'22px'}}>🌿</span>
            <span style={{color:'white', fontWeight:'700', fontSize:'20px'}}>KrishiBot</span>
          </div>
          <p style={{color:'#86efac', fontSize:'13px', lineHeight:'1.7', marginBottom:'16px'}}>
            AI-powered agriculture assistant helping farmers detect crop diseases,
            get expert guidance, and make confident farming decisions with reliable
            offline intelligence.
          </p>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            <span style={{
              background:'#166534', color:'#86efac', 
              fontSize:'11px', padding:'3px 10px', 
              borderRadius:'20px', border:'1px solid #16a34a'
            }}>Local AI</span>
            <span style={{
              background:'#166534', color:'#86efac', 
              fontSize:'11px', padding:'3px 10px', 
              borderRadius:'20px', border:'1px solid #16a34a'
            }}>No Cloud</span>
            <span style={{
              background:'#166534', color:'#86efac', 
              fontSize:'11px', padding:'3px 10px', 
              borderRadius:'20px', border:'1px solid #16a34a'
            }}>EN + বাংলা</span>
          </div>
        </div>

        {/* Features column */}
        <div>
          <h4 style={{color:'white', fontWeight:'600', fontSize:'14px', 
            marginBottom:'16px', textTransform:'uppercase', 
            letterSpacing:'0.08em'}}>
            Features
          </h4>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'10px'}}>
            {[
              {label:'Crop Disease Detection', href:'/analyze'},
              {label:'Agriculture Chatbot', href:'/chat'},
              {label:'Crop Advisory', href:'/advisory'},
              {label:'Weather Risk Forecast', href:'/advisory'},
              {label:'Community Board', href:'/community'},
              {label:'Disease Tracker', href:'/tracker'},
            ].map(item => (
              <li key={item.label}>
                <Link href={item.href} style={{
                  color:'#bbf7d0', fontSize:'13px', 
                  textDecoration:'none', display:'flex',
                  alignItems:'center', gap:'6px'
                }}
                onMouseOver={e => (e.currentTarget.style.color='white')}
                onMouseOut={e => (e.currentTarget.style.color='#bbf7d0')}
                >
                  <span style={{color:'#4ade80', fontSize:'10px'}}>▶</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Supported Crops column */}
        <div>
          <h4 style={{color:'white', fontWeight:'600', fontSize:'14px', 
            marginBottom:'16px', textTransform:'uppercase', 
            letterSpacing:'0.08em'}}>
            Supported Crops
          </h4>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'10px'}}>
            {[
              {crop:'Rice', bn:'ধান', emoji:'🌾'},
              {crop:'Tomato', bn:'টমেটো', emoji:'🍅'},
              {crop:'Potato', bn:'আলু', emoji:'🥔'},
              {crop:'Wheat', bn:'গম', emoji:'🌿'},
              {crop:'Jute', bn:'পাট', emoji:'🌱'},
            ].map(item => (
              <li key={item.crop} style={{
                display:'flex', alignItems:'center', 
                gap:'8px', color:'#bbf7d0', fontSize:'13px'
              }}>
                <span style={{fontSize:'14px'}}>{item.emoji}</span>
                <span>{item.crop}</span>
                <span style={{color:'#4ade80', fontSize:'11px'}}>({item.bn})</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Platform column */}
        <div>
          <h4 style={{color:'white', fontWeight:'600', fontSize:'14px', 
            marginBottom:'16px', textTransform:'uppercase', 
            letterSpacing:'0.08em'}}>
            Platform
          </h4>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {[
              {name:'Private by Design', role:'Your data stays local'},
              {name:'Offline-First', role:'Runs without cloud dependency'},
              {name:'Farmer-Centered', role:'Simple and practical workflows'},
              {name:'Multilingual', role:'English and Bangla support'},
              {name:'Actionable Insights', role:'Advice aligned to field needs'},
            ].map(item => (
              <div key={item.name} style={{display:'flex', 
                justifyContent:'space-between', alignItems:'center',
                borderBottom:'1px solid #166534', paddingBottom:'8px'
              }}>
                <span style={{color:'white', fontSize:'13px', fontWeight:'500'}}>
                  {item.name}
                </span>
                <span style={{color:'#4ade80', fontSize:'11px'}}>
                  {item.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Divider */}
      <div style={{borderTop:'1px solid #166534', margin:'0 32px'}}/>

      {/* Bottom bar */}
      <div style={{
        maxWidth:'1200px', margin:'0 auto',
        padding:'20px 32px',
        display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:'12px'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
          <span style={{color:'#86efac', fontSize:'12px'}}>
            © 2026 KrishiBot — AI Agriculture Assistant
          </span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <span style={{color:'#4ade80', fontSize:'12px'}}>
            Powered by local AI · Secure and offline-first
          </span>
          <span style={{color:'#166534', fontSize:'18px'}}>|</span>
          <Link href="/about" style={{
            color:'#86efac', fontSize:'12px', textDecoration:'none'
          }}>
            About KrishiBot
          </Link>
        </div>
      </div>

    </footer>
  )
}
