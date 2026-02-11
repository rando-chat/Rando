'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TAGLINES = [
  'Meet someone new.',
  'Start a real conversation.',
  'The internet, but human.',
  'Talk to a stranger. Make a friend.',
]

export default function HomePage() {
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [onlineCount] = useState(Math.floor(Math.random() * 800) + 1200)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f0f0f0',
      fontFamily: "'Georgia', serif",
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,60,180,0.15) 0%, transparent 70%)',
          animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,160,140,0.12) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,80,120,0.08) 0%, transparent 70%)',
          animation: 'float3 12s ease-in-out infinite',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
        @keyframes float3 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-50%,-55%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .tagline-text { transition: opacity 0.4s ease, transform 0.4s ease; }
        .tagline-visible { opacity: 1; transform: translateY(0); }
        .tagline-hidden { opacity: 0; transform: translateY(-8px); }
        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border: none;
          padding: 18px 48px;
          font-size: 18px;
          font-family: 'Georgia', serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #6d28d9, #4338ca);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.4); }
        .btn-secondary {
          background: transparent;
          color: #a0a0b0;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 17px 40px;
          font-size: 16px;
          font-family: 'Georgia', serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.3); color: #f0f0f0; transform: translateY(-2px); }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 32px;
          transition: all 0.3s ease;
          animation: fadeIn 0.8s ease forwards;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(124,58,237,0.3);
          transform: translateY(-4px);
        }
        .stat-num {
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>✦</div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>RANDO</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 20,
            fontSize: 13, color: '#86efac',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {onlineCount.toLocaleString()} online
          </div>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: 14 }}>Sign in</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        position: 'relative', zIndex: 10,
        maxWidth: 900, margin: '0 auto',
        padding: '100px 48px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20,
          fontSize: 13, color: '#c4b5fd',
          marginBottom: 32,
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          AI-Powered Matchmaking
        </div>

        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 88px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-3px',
          marginBottom: 16,
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0c0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Talk to<br />strangers.
        </h1>

        <div style={{ height: 48, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className={`tagline-text ${visible ? 'tagline-visible' : 'tagline-hidden'}`} style={{
            fontSize: 'clamp(18px, 3vw, 26px)',
            color: '#8080a0',
            fontStyle: 'italic',
          }}>
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 80 }}>
          <Link href="/matchmaking" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">
              <span style={{ position: 'relative', zIndex: 1 }}>Start Chatting →</span>
            </button>
          </Link>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary">Create Account</button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: 100,
        }}>
          {[
            { num: '50K+', label: 'Conversations today' },
            { num: '2min', label: 'Avg match time' },
            { num: '94%', label: 'Safety score' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '32px 24px',
              background: '#0a0a0f',
              textAlign: 'center',
            }}>
              <div className="stat-num" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: '#60607a', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, textAlign: 'left' }}>
          {[
            {
              icon: '⚡',
              title: 'Smart Matching',
              desc: 'Our AI connects you with people who share your interests — not just random noise.',
              delay: '0s',
            },
            {
              icon: '🛡',
              title: 'Built-in Safety',
              desc: 'Real-time content moderation and one-tap reporting keeps every chat safe.',
              delay: '0.1s',
            },
            {
              icon: '✦',
              title: 'Premium Tiers',
              desc: 'Student and Premium plans unlock priority matching, longer chats, and more.',
              delay: '0.2s',
            },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: f.delay }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#e0e0f0' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#60607a', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '40px 48px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: '#40404a', fontSize: 13,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
          <Link href="/safety" style={{ color: '#60607a', textDecoration: 'none' }}>Safety</Link>
          <Link href="/login" style={{ color: '#60607a', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/register" style={{ color: '#60607a', textDecoration: 'none' }}>Register</Link>
        </div>
        © 2026 RANDO CHAT · All rights reserved
      </footer>
    </div>
  )
}
