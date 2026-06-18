import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useEffect } from 'react';
import { MessageSquare, Brain, KeyRound, BookOpen, Map, BarChart3, CreditCard, Rocket, Lock, Zap, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: <Brain size={28} color="#6366f1" />,
    title: 'AI-Powered Chat',
    desc: 'Deploy intelligent chatbots powered by LLMs that understand your business and answer customer questions in real time.',
  },
  {
    icon: <KeyRound size={28} color="#6366f1" />,
    title: 'API Key Auth',
    desc: 'Secure per-tenant API key authentication with fine-grained access control and usage tracking.',
  },
  {
    icon: <BookOpen size={28} color="#6366f1" />,
    title: 'Knowledge Base',
    desc: 'Train your bot on your content — web pages, documentation, and structured data — so it always knows the right answer.',
  },
  {
    icon: <Map size={28} color="#6366f1" />,
    title: 'Smart Routing',
    desc: 'Define custom routes with role-based access to guide conversations and expose exactly the right endpoints.',
  },
  {
    icon: <BarChart3 size={28} color="#6366f1" />,
    title: 'Analytics & Insights',
    desc: 'Track message volume, token usage, costs, and daily trends with beautiful dashboards and exportable data.',
  },
  {
    icon: <CreditCard size={28} color="#6366f1" />,
    title: 'Usage-Based Billing',
    desc: 'Transparent per-message pricing with free tier, monthly quotas, automated Stripe billing, and seamless upgrades.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up in seconds. Your tenant is provisioned automatically with a secure API key and free monthly quota.',
  },
  {
    step: '02',
    title: 'Configure Your Bot',
    desc: 'Upload knowledge, define routes, set roles, and customize the system prompt — all from the dashboard.',
  },
  {
    step: '03',
    title: 'Embed & Scale',
    desc: 'Add the chatbot widget to your site with a single script tag. Monitor usage and upgrade as you grow.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    messages: '1,000',
    features: ['1,000 messages/month', '1 API key', 'Knowledge base', 'Basic analytics'],
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    messages: '10,000',
    popular: false,
    features: ['10,000 messages/month', '5 API keys', 'Knowledge base', 'Advanced analytics', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    messages: '100,000',
    popular: true,
    features: ['100,000 messages/month', 'Unlimited API keys', 'Knowledge base', 'Advanced analytics', 'Priority support', 'Custom branding'],
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/mo',
    messages: '1,000,000',
    features: ['1,000,000 messages/month', 'Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { tenant, loading } = useAuth();

  useEffect(() => {
    if (!loading && tenant) {
      navigate('/dashboard', { replace: true });
    }
  }, [tenant, loading, navigate]);

  if (loading || tenant) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="landing">
      {/* ── Navigation ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon"><MessageSquare size={20} /></span>
            <span className="landing-logo-text">Chatbot SaaS</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
          </div>
          <div className="landing-nav-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login?register=1')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </div>
        <div className="landing-hero-content">
          <div className="hero-badge"><Rocket size={14} /> Launch your AI chatbot in minutes</div>
          <h1 className="hero-title">
            Smart Chatbots{' '}
            <span className="hero-gradient">for Your Business</span>
          </h1>
          <p className="hero-subtitle">
            Deploy intelligent, customizable chatbot agents powered by LLMs.
            Train on your content, control with roles and routes, and scale
            with transparent usage-based pricing.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-hero"
              onClick={() => navigate('/login?register=1')}
            >
              Start Free Trial →
            </button>
            <button
              className="btn btn-secondary btn-hero"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
          <p className="hero-trust">
            <span><Lock size={14} /> No credit card required</span>
            <span><Zap size={14} /> 1,000 free messages/month</span>
            <span><Clock size={14} /> 60-second setup</span>
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything you need to deploy at scale</h2>
          <p className="section-desc">
            From knowledge training to usage analytics — a complete toolkit
            for production-ready chatbots.
          </p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Get live in three simple steps</h2>
          <p className="section-desc">
            No complex setup. No DevOps headache. Just pure chatbot magic.
          </p>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="landing-section">
        <div className="landing-section-inner">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-desc">
            Pay only for what you use. Upgrade or downgrade anytime.
          </p>
          <div className="pricing-grid">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`pricing-card ${p.popular ? 'pricing-card-popular' : ''}`}
              >
                {p.popular && <div className="pricing-badge">Most Popular</div>}
                <div className="pricing-card-header">
                  <h3 className="pricing-name">{p.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{p.price}</span>
                    <span className="pricing-period">{p.period}</span>
                  </div>
                  <p className="pricing-messages">{p.messages} messages/mo</p>
                </div>
                <ul className="pricing-features">
                  {p.features.map((f) => (
                    <li key={f} className="pricing-feature">
                      <span className="feature-check"><CheckCircle size={14} color="#10b981" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'} btn-block`}
                  onClick={() => navigate('/login?register=1')}
                >
                  {p.name === 'Free' ? 'Get Started' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2 className="cta-title">Ready to build your chatbot?</h2>
          <p className="cta-desc">
            Join thousands of businesses using Chatbot SaaS to deliver
            instant, intelligent customer support.
          </p>
          <button
            className="btn btn-primary btn-hero"
            onClick={() => navigate('/login?register=1')}
          >
            Get Started Free →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="landing-logo-icon"><MessageSquare size={20} /></span>
              <span className="landing-logo-text">Chatbot SaaS</span>
            </div>
            <p className="footer-text">
              Intelligent chatbot infrastructure for modern businesses.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Chatbot SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
