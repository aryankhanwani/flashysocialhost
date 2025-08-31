"use client";

import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    // Add scroll effect to header
    const handleScroll = () => {
      const header = document.querySelector('header') as HTMLElement;
      if (header) {
        if (window.scrollY > 100) {
          header.style.background = 'rgba(0, 0, 0, 0.95)';
          header.style.backdropFilter = 'blur(10px)';
        } else {
          header.style.background = 'transparent';
          header.style.backdropFilter = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Animate cards on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.pricing-card, .feature-card').forEach(card => {
      const cardElement = card as HTMLElement;
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'translateY(50px)';
      cardElement.style.transition = 'all 0.6s ease';
      observer.observe(card);
    });

    // Add subtle particle animation
    function createParticle() {
      const particle = document.createElement('div') as HTMLElement;
      particle.style.position = 'fixed';
      particle.style.width = '2px';
      particle.style.height = '2px';
      particle.style.background = 'rgba(255, 255, 255, 0.3)';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '-1';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      particle.style.top = '-10px';
      
      document.body.appendChild(particle);
      
      const animation = particle.animate([
        { transform: 'translateY(-10px) scale(1)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 10}px) scale(0)`, opacity: 0 }
      ], {
        duration: Math.random() * 4000 + 3000,
        easing: 'linear'
      });
      
      animation.onfinish = () => particle.remove();
    }

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 800);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #000000;
          color: #ffffff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Animated Background */
        .bg-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          opacity: 0.1;
        }

        .bg-animation::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float1 6s ease-in-out infinite;
          top: 10%;
          left: 10%;
        }

        .bg-animation::after {
          content: '';
          position: absolute;
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float2 8s ease-in-out infinite;
          top: 60%;
          right: 10%;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(360deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }

        /* Header */
        header {
          padding: 30px 0;
          position: relative;
          z-index: 100;
          border-bottom: 1px solid #333;
          transition: all 0.3s ease;
        }

        .logo {
          text-align: center;
          font-size: 32px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -1px;
        }

        /* Hero Section */
        .hero {
          padding: 120px 0;
          text-align: center;
          position: relative;
        }

        .hero h1 {
          font-size: 4.5rem;
          font-weight: 900;
          margin-bottom: 30px;
          color: #ffffff;
          animation: slideUp 1s ease-out;
          letter-spacing: -2px;
        }

        .hero p {
          font-size: 1.4rem;
          margin-bottom: 60px;
          opacity: 0.8;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          animation: slideUp 1s ease-out 0.2s both;
          line-height: 1.6;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Features Section */
        .features {
          padding: 100px 0;
          background: #111111;
        }

        .features h2 {
          text-align: center;
          font-size: 3.5rem;
          margin-bottom: 80px;
          font-weight: 800;
          color: #ffffff;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
        }

        .feature-card {
          background: #000000;
          padding: 50px 40px;
          border-radius: 15px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid #333;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: #ffffff;
          background: #111111;
        }

        .feature-icon {
          font-size: 3.5rem;
          margin-bottom: 25px;
          color: #ffffff;
        }

        .feature-card h3 {
          font-size: 1.6rem;
          margin-bottom: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .feature-card p {
          opacity: 0.8;
          line-height: 1.6;
        }

        /* Pricing Section */
        .pricing {
          padding: 120px 0;
          background: #000000;
        }

        .pricing h2 {
          text-align: center;
          font-size: 3.5rem;
          margin-bottom: 60px;
          font-weight: 800;
          color: #ffffff;
        }

        .pricing-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .pricing-card {
          background: #111111;
          padding: 60px 50px;
          border-radius: 20px;
          text-align: center;
          transition: all 0.3s ease;
          border: 3px solid #333;
          position: relative;
          overflow: hidden;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transition: left 0.5s ease;
        }

        .pricing-card:hover::before {
          left: 100%;
        }

        .pricing-card:hover {
          transform: translateY(-15px) scale(1.02);
          border-color: #ffffff;
          background: #1a1a1a;
        }

        .plan-name {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 20px;
          color: #ffffff;
        }

        .plan-price {
          font-size: 4rem;
          font-weight: 900;
          margin-bottom: 15px;
          color: #ffffff;
        }

        .plan-period {
          opacity: 0.7;
          margin-bottom: 40px;
          font-size: 1.2rem;
        }

        .plan-features {
          list-style: none;
          margin-bottom: 50px;
        }

        .plan-features li {
          padding: 15px 0;
          border-bottom: 1px solid #333;
          font-size: 1.1rem;
        }

        .plan-features li:last-child {
          border-bottom: none;
        }

        .plan-button {
          display: block;
          width: 100%;
          padding: 25px;
          background: #ffffff;
          color: #000000;
          text-decoration: none;
          border-radius: 15px;
          font-weight: 800;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .plan-button:hover {
          transform: translateY(-3px);
          background: #f0f0f0;
          box-shadow: 0 15px 35px rgba(255, 255, 255, 0.1);
        }

        /* Footer */
        footer {
          padding: 80px 0 40px;
          background: #111111;
          text-align: center;
          border-top: 1px solid #333;
        }

        .footer-content {
          margin-bottom: 40px;
        }

        .footer-content h3 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .footer-content p {
          opacity: 0.7;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .copyright {
          border-top: 1px solid #333;
          padding-top: 30px;
          opacity: 0.6;
          font-size: 0.9rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.8rem;
          }
          
          .hero p {
            font-size: 1.2rem;
          }
          
          .features h2, .pricing h2 {
            font-size: 2.5rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            padding: 40px 30px;
          }

          .pricing-card {
            padding: 50px 30px;
          }
        }
      `}</style>

      <div className="bg-animation"></div>
      
      <header>
        <div className="container">
          <div className="logo">FlashySocialHost</div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Premium Social Media Hosting</h1>
          <p>Lightning-fast, secure, and scalable hosting solutions designed specifically for social media platforms and content creators. Professional infrastructure for serious businesses.</p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Speed</h3>
              <p>99.9% uptime with global CDN and SSD storage. Your content loads instantly worldwide with enterprise-grade performance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Military-Grade Security</h3>
              <p>SSL certificates, DDoS protection, and regular backups keep your data safe and secure at all times.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Scalable Infrastructure</h3>
              <p>Grow from startup to enterprise. Our hosting scales with your success automatically and seamlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Social Media Optimized</h3>
              <p>Specialized hosting for Instagram, TikTok, YouTube, and all major social platforms with optimized configurations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>24/7 Expert Support</h3>
              <p>Our social media hosting experts are available around the clock to help you succeed and grow.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Value Guarantee</h3>
              <p>Premium features at competitive prices. We'll match any competitor's offer with superior service.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing">
        <div className="container">
          <h2>Premium Plan</h2>
          <div className="pricing-container">
            <div className="pricing-card">
              <div className="plan-name">Professional</div>
              <div className="plan-price">$99</div>
              <div className="plan-period">/month</div>
              <ul className="plan-features">
                <li>500GB SSD Storage</li>
                <li>Unlimited Bandwidth</li>
                <li>Unlimited Social Platforms</li>
                <li>Advanced Analytics Dashboard</li>
                <li>Priority 24/7 Support</li>
                <li>Premium SSL Certificate</li>
                <li>Daily Automated Backups</li>
                <li>Global CDN Network</li>
                <li>Custom Domain Support</li>
                <li>White-label Options</li>
              </ul>
              <button 
                className="plan-button" 
                onClick={() => window.open('https://buy.stripe.com/eVq3co8HS2VU2c7blA6EU00', '_blank')}
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Environment Check</h1>
        <p>CLOAKING_AUTH_TOKEN exists: {process.env.CLOAKING_AUTH_TOKEN ? 'YES' : 'NO'}</p>
        <p>CLOAKING_AUTH_TOKEN length: {process.env.CLOAKING_AUTH_TOKEN?.length || 0}</p>
        <p>STRIPE_SECRET_KEY exists: {process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
      </div>
      <footer>
        <div className="container">
          <div className="footer-content">
            <h3>FlashySocialHost</h3>
            <p>Premium social media hosting solutions for creators and businesses who demand the best performance, security, and support.</p>
          </div>
          
          <div className="copyright">
            <p>&copy; 2025 FlashySocialHost. All rights reserved. Built for social media success. </p>
      </div>
    </div>
      </footer>
    </>
  );
}
