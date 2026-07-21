import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Send
} from 'lucide-react';

// Reusable Scroll Reveal Animation Wrapper using IntersectionObserver
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Reveal only once
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before entering
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.97]'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingPage: React.FC = () => {
  // Mobile menu open/close state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock form submission state
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  // Ingestion Pipeline scroll progress state
  const [activeStep, setActiveStep] = useState(0); // Starts at 0 so first card can animate in
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate total height of the scroll track minus the viewport height
      const totalScrollableDistance = rect.height - viewportHeight;
      
      // Calculate how far the top of the container has scrolled above the top of the viewport
      const scrolled = -rect.top;
      
      if (scrolled < -50) {
        setActiveStep(0); // Before pinning and before entering range: all cards hidden
      } else if (scrolled > totalScrollableDistance) {
        setActiveStep(5); // Pinned track complete
      } else {
        const progress = Math.max(scrolled, 0) / totalScrollableDistance;
        // Map scroll progress to active steps 1 to 5
        const currentStep = Math.min(Math.max(Math.ceil(progress * 5), 1), 5);
        setActiveStep(currentStep);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  // Typography Constants
  const headingStyle = { fontFamily: "'Outfit', sans-serif" };
  const bodyStyle = { fontFamily: "'Inter', sans-serif" };

  // Ingestion Steps Data
  const steps = [
    { step: 1, title: 'Upload Documents', desc: 'Drag-and-drop PDFs, blueprints, logs, or operation ledger scans.' },
    { step: 2, title: 'OCR & AI Processing', desc: 'Ingestion engine extracts metadata tags, entities, and text chunks.' },
    { step: 3, title: 'Knowledge Graph', desc: 'Entities are automatically linked to create a relational network map.' },
    { step: 4, title: 'Ask AI Questions', desc: 'Staff queries SamiQ for checklists, specifications, or lockout actions.' },
    { step: 5, title: 'Receive Cited Answers', desc: 'Our AI engine formats responses citing the source manual, page, and paragraph.' }
  ];

  return (
    <div 
      className="min-h-screen bg-[#1e4e7c]/3 text-slate-900 antialiased selection:bg-[#1e4e7c]/20 selection:text-[#1e4e7c] flex flex-col justify-between"
      style={bodyStyle}
    >
      
      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 w-full bg-[#ffffff]/90 backdrop-blur-md shadow-sm">
        <div className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="SamiQ Logo" className="w-8.5 h-8.5 object-contain rounded-lg shadow-glow-teal" />
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-[#1e4e7c]" style={headingStyle}>
                SamiQ
              </h1>
              <p className="text-[9px] text-[#1e4e7c] font-bold uppercase tracking-widest -mt-1">
                Industrial Memory
              </p>
            </div>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="hover:text-[#1e4e7c] transition-colors">Home</a>
            <a href="#about" className="hover:text-[#1e4e7c] transition-colors">About</a>
            <a href="#roles" className="hover:text-[#1e4e7c] transition-colors">Roles</a>
            <a href="#features" className="hover:text-[#1e4e7c] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1e4e7c] transition-colors">How It Works</a>
            <a href="#contact" className="hover:text-[#1e4e7c] transition-colors">Contact</a>
          </nav>
          
          {/* Action Buttons & Mobile Hamburger */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-[#1e4e7c] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-lg bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-[#1e4e7c]/10 hover:shadow-[#1e4e7c]/20 hover:scale-[1.02]"
              >
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Hamburger Trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#1e4e7c] focus:outline-none hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Menu Drawer */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#ffffff] border-t border-slate-100 ${
            isMobileMenuOpen ? 'max-h-[500px] py-4 pb-6 shadow-inner' : 'max-h-0'
          }`}
        >
          <nav className="flex flex-col px-8 space-y-3.5 text-sm font-semibold text-slate-600">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">Home</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">About</a>
            <a href="#roles" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">Roles</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">How It Works</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#1e4e7c] py-1 transition-colors">Contact</a>
            
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5 sm:hidden">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-600 hover:text-[#1e4e7c] border border-[#1e4e7c]/10 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#1e4e7c]/10"
              >
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <main 
        id="home"
        className="relative z-10 flex-grow w-full bg-cover bg-center bg-no-repeat flex items-center justify-center py-20 md:py-32 px-4 sm:px-6"
        style={{ backgroundImage: "url('/hero-factory.jpg')" }}
      >
        {/* Soft watermark background */}
        <div className="absolute inset-0 bg-blue-50/30 z-0 pointer-events-none"></div>

        {/* 80% Width Wide Translucent Card with Glass Shine */}
        <div className="relative z-10 w-full sm:w-11/12 md:w-[80%] max-w-5xl rounded-2xl border border-[#1e4e7c]/15 bg-[#ffffff]/85 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:translate-y-[-4px] p-6 sm:p-10 md:p-16 text-center flex flex-col items-center glass-shine">
          {/* Decorative radial gradient */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#1e4e7c]/10 rounded-full blur-xl pointer-events-none"></div>

          {/* Main Heading */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#1e4e7c] leading-tight tracking-tight max-w-4xl" style={headingStyle}>
            Transform <span className="text-[#1e4e7c]">Industrial Documents</span> <br className="hidden sm:inline" />
            into <span className="text-[#1e4e7c]">Actionable Intelligence</span>
          </h2>

          {/* Description */}
          <p className="mt-6 md:mt-8 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl font-medium">
            SamiQ is a secure operational memory layer. It ingests blueprints, SOPs, work orders, maintenance logs, engineering manuals, and inspection records to generate <span className="text-[#1e4e7c] font-bold">Semantic Search</span>, AI-powered answers, and a connected industrial <span className="text-[#1e4e7c] font-bold">Knowledge Graph</span>.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5 w-full justify-center">
            <Link
              to="/signup"
              className="px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] font-extrabold shadow-lg shadow-[#1e4e7c]/20 hover:scale-[1.02] text-center text-sm transition-all duration-300 min-w-[150px] sm:min-w-[170px]"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl bg-[#ffffff] border border-[#1e4e7c]/20 text-slate-700 font-extrabold hover:bg-slate-50 hover:scale-[1.02] text-center text-sm transition-all duration-300 min-w-[150px] sm:min-w-[170px]"
            >
              Login
            </Link>
          </div>
        </div>
      </main>

      {/* ==================== WHY SAMIQ? (ABOUT US SECTION) ==================== */}
      <section id="about" className="py-20 md:py-32 px-6 sm:px-8 md:px-12 bg-[#ffffff] space-y-12 md:space-y-16 w-full">
        {/* Centered Header */}
        <div className="w-full text-center space-y-4">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e4e7c] tracking-tight" style={headingStyle}>
              About SamiQ
            </h2>
          </ScrollReveal>
        </div>

        {/* Split Layout: Left Text, Right 2x2 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full items-stretch">
          
          {/* Left Side: Rich justified paragraphs */}
          <div className="lg:col-span-6 space-y-6 text-slate-650 leading-relaxed text-xs sm:text-sm md:text-base text-left text-justify flex flex-col justify-center">
            <ScrollReveal delay={100}>
              <p>
                In modern industrial environments, operational memory is frequently fragmented across disparate systems, physical folders, and isolated technical records. Crucial knowledge—ranging from equipment operation manuals and Standard Operating Procedures (SOPs) to shift handover notes and safety inspection ledgers—remains disconnected. When mechanical errors or pipeline anomalies occur, technicians and field operators lose valuable hours searching through thousands of pages of unindexed documents, leading to extended plant downtime, safety risks, and operational inefficiencies.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p>
                SamiQ addresses this core challenge by serving as a secure, central operational memory layer. By leveraging advanced optical character recognition (OCR) and high-accuracy document intelligence pipelines, SamiQ ingests blueprint manuals and technical documentation, converting them into a unified knowledge repository. Our advanced semantic search engine maps queries directly to context-specific answers, eliminating the limitations of simple keyword matching and delivering grounded answers that engineers can trust immediately.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <p>
                Furthermore, SamiQ automatically constructs an interactive knowledge graph, mapping the relationships between technical documents, physical assets, and personnel. This relational map breaks down information silos, allowing cross-departmental collaboration and accelerating root-cause diagnostics. By providing instantaneous, cited answers grounded strictly in verified manuals, SamiQ empowers frontline staff to make faster, safer decisions, reducing plant downtime and maximizing overall operational efficiency.
              </p>
            </ScrollReveal>
          </div>

          {/* Right Side: 2x2 Grid of Feature Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            
            {/* Card 1 */}
            <ScrollReveal delay={0} className="w-full h-full">
              <div className="p-6 rounded-[24px] border border-[#1e4e7c]/10 bg-[#ffffff] shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group w-full h-full">
                <div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/ai-copilot-about.webp" alt="AI Copilot Icon" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#1e4e7c]" style={headingStyle}>AI Knowledge Copilot</h4>
                  <p className="text-slate-500 text-[11px] mt-2.5 leading-relaxed">
                    Query complex equipment metrics and failure modes. Generates RAG answers grounded strictly in source manuals.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delay={150} className="w-full h-full">
              <div className="p-6 rounded-[24px] border border-[#1e4e7c]/10 bg-[#ffffff] shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group w-full h-full">
                <div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/knowledge-graph-about.webp" alt="Knowledge Graph Icon" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#1e4e7c]" style={headingStyle}>Knowledge Graph</h4>
                  <p className="text-slate-500 text-[11px] mt-2.5 leading-relaxed">
                    Explore dynamic visual associations. Connects documentation, mechanical assets, and personnel on an edge graph.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delay={300} className="w-full h-full">
              <div className="p-6 rounded-[24px] border border-[#1e4e7c]/10 bg-[#ffffff] shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group w-full h-full">
                <div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/document-ocr-about.webp" alt="OCR Icon" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#1e4e7c]" style={headingStyle}>OCR & Ingestion</h4>
                  <p className="text-slate-500 text-[11px] mt-2.5 leading-relaxed">
                    Extract text from scanned PDFs, maintenance ledger records, and hardware blueprints using our high-accuracy pipeline.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 4 */}
            <ScrollReveal delay={450} className="w-full h-full">
              <div className="p-6 rounded-[24px] border border-[#1e4e7c]/10 bg-[#ffffff] shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group w-full h-full">
                <div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/security-shield-about.webp" alt="Security Icon" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#1e4e7c]" style={headingStyle}>Enterprise Security</h4>
                  <p className="text-slate-500 text-[11px] mt-2.5 leading-relaxed">
                    RBAC permissions keep details protected. Local data-store fallbacks maintain operation without external networks.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* ==================== ROLE DISTRIBUTION ==================== */}
      <section id="roles" className="bg-[#1e4e7c]/3 py-20 md:py-32 w-full px-6 sm:px-8 md:px-12">
        <div className="w-full space-y-12">
          
          <div className="w-full text-center max-w-3xl mx-auto">
            <ScrollReveal>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e4e7c] tracking-tight" style={headingStyle}>Structured Workspace Governance</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium mt-6">
                SamiQ enforces strict role-based access control (RBAC) to safeguard industrial intelligence. Workspace permissions are divided between Knowledge Governors, who index resources and equipment tags, and Operations Consumers, who query the AI Copilot to check instructions and maintenance limit manuals safely.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            
            {/* Admin Role Card */}
            <ScrollReveal delay={0} className="w-full">
              <div className="bg-[#ffffff] p-6 sm:p-8 rounded-[24px] border border-[#1e4e7c]/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between w-full h-full">
                <div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/admin-avatar.webp" alt="Admin Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1e4e7c]" style={headingStyle}>Knowledge Governor (Admin)</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Responsible for indexing documentation, managing asset associations, and monitoring operational audits.
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block">Privileged Capabilities:</span>
                    {[
                      'Upload Documents (PDF, DOCX, OCR images)',
                      'Manage Assets (Add/Edit equipment tags)',
                      'View AI Insights (Operations alarm cards)',
                      'Access & Compile full Knowledge Graph',
                      'Manage Platform settings & audit logs'
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e4e7c]"></span>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <Link 
                  to="/login"
                  className="mt-8 px-4 py-2.5 text-center text-xs font-bold text-[#ffffff] bg-[#1e4e7c] hover:bg-[#153a5c] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  Access Admin Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Employee Role Card */}
            <ScrollReveal delay={200} className="w-full">
              <div className="bg-[#ffffff] p-6 sm:p-8 rounded-[24px] border border-[#1e4e7c]/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between w-full h-full">
                <div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden mb-6 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                    <img src="/employee-avatar.webp" alt="Employee Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1e4e7c]" style={headingStyle}>Operations Consumer (Employee)</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Queries platform intelligence to check failures, lookup checklists, and review operating instructions.
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider block">Consumer Capabilities:</span>
                    {[
                      'Search Knowledge base (Contextual search)',
                      'Chat with AI (Engineering RAG Copilot)',
                      'View Assets & detailed chronological logs',
                      'Access SOPs & operating limit documentation',
                      'View Citations (Clickable source references)'
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e4e7c]"></span>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <Link 
                  to="/login"
                  className="mt-8 px-4 py-2.5 text-center text-xs font-bold text-[#1e4e7c] border border-[#1e4e7c]/20 hover:bg-[#1e4e7c]/5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  Access Operator Deck
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </ScrollReveal>
            
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT FEATURES SECTION ==================== */}
      <section id="features" className="py-20 md:py-32 w-full px-6 sm:px-8 md:px-12 space-y-12 md:space-y-16 bg-[#ffffff]">
        <div className="w-full text-center max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e4e7c] tracking-tight" style={headingStyle}>Engineered for Technical Environments</h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium mt-6">
              Discover the robust suite of tools built specifically for heavy industries, chemical processing, and advanced manufacturing. SamiQ connects vector search, real-time insights, and OCR pipeline extraction directly to your operational safety guidelines.
            </p>
          </ScrollReveal>
        </div>

        {/* 6 Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
          {[
            {
              image: '/ai-copilot-feature.webp',
              title: 'AI Copilot',
              desc: 'Context-locked natural language chat powered by secure operational AI, matching engineering specs and limits.'
            },
            {
              image: '/document-ocr-feature.webp',
              title: 'OCR Processing',
              desc: 'Ingests scans, PDFs, and drawings. Performs entity and tag extraction for immediate catalog integration.'
            },
            {
              image: '/knowledge-graph-feature.webp',
              title: 'Knowledge Graph',
              desc: 'Constructs dynamic physical graph representations linking uploaded resources to asset tags.'
            },
            {
              image: '/smart-search-feature.webp',
              title: 'Smart Search',
              desc: 'Integrates vector cosine embedding searches with automatic local TF-IDF overrides.'
            },
            {
              image: '/citations-feature.webp',
              title: 'Source Citations',
              desc: 'Ensures accountability. Returns specific, clickable manual segments matching AI-suggested actions.'
            },
            {
              image: '/insights-feature.webp',
              title: 'AI Insights',
              desc: 'Generates active warning cards, priority diagnostics alerts, and recommended remediation protocols.'
            }
          ].map((feat, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} className="w-full">
              <div className="p-6 rounded-[20px] border border-[#1e4e7c]/10 bg-[#ffffff] hover:border-[#1e4e7c]/30 hover:shadow-md transition-all duration-300 group h-full">
                <div className="w-10 h-10 rounded-lg overflow-hidden mb-4.5 flex items-center justify-center border border-[#1e4e7c]/10 bg-[#1e4e7c]/5">
                  <img src={feat.image} alt={feat.title} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-base font-extrabold text-[#1e4e7c]" style={headingStyle}>{feat.title}</h4>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{feat.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" ref={containerRef} className="relative w-full h-[450vh] bg-[#1e4e7c]/3">
        {/* Sticky Content Container */}
        <div className="sticky top-0 w-full min-h-screen flex flex-col justify-center py-20 px-6 sm:px-8 md:px-12 overflow-hidden">
          <div className="w-full space-y-12 md:space-y-16">
            
            {/* Section Header */}
            <div className="w-full text-center max-w-3xl mx-auto">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e4e7c] tracking-tight" style={headingStyle}>How SamiQ Processes Knowledge</h2>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium mt-6">
                  Our secure pipeline ingests and indexes documentation step-by-step to compile a dynamic relational graph, bringing cited, reliable answers directly to your operations deck.
                </p>
              </ScrollReveal>
            </div>

            {/* Timeline Flow */}
            <div className="max-w-7xl mx-auto relative w-full py-6 md:py-10">
              
              {/* Desktop Connector Row Layout */}
              <div className="hidden lg:flex flex-row items-center justify-between w-full relative z-10">
                {steps.map((item, idx) => {
                  const isRevealed = activeStep >= item.step;
                  const isLineActive = activeStep > item.step;
                  
                  return (
                    <React.Fragment key={idx}>
                      {/* Step Card */}
                      <div 
                        className={`flex flex-col items-center text-center space-y-3.5 bg-[#ffffff] p-5 rounded-2xl border border-[#1e4e7c]/10 shadow-sm transition-all duration-700 ease-out relative z-10 w-[180px] min-h-[220px] justify-between ${
                          isRevealed 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 translate-y-10 scale-90'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm border-4 border-[#ffffff] shadow-md transition-colors duration-500 ${
                          isRevealed 
                            ? 'bg-[#1e4e7c] text-[#ffffff] shadow-[#1e4e7c]/20' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {item.step}
                        </div>
                        <h4 className="text-sm font-extrabold text-[#1e4e7c] mt-2" style={headingStyle}>{item.title}</h4>
                        <p className="text-slate-500 text-[10px] leading-relaxed max-w-[150px] mx-auto mt-1">{item.desc}</p>
                      </div>

                      {/* Desktop Connector Line (Only between cards, touching card boundaries) */}
                      {idx < steps.length - 1 && (
                        <div className="flex-grow h-[2px] relative min-w-[30px]">
                          <div 
                            className="absolute top-[-1.5px] left-0 h-full border-t-[1.5px] border-dashed border-[#1e4e7c] transition-all duration-500 ease-out"
                            style={{ width: `${isLineActive ? 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              
              {/* Mobile Connector Column Layout */}
              <div className="lg:hidden flex flex-col items-center w-full space-y-0 relative z-10 px-4">
                {steps.map((item, idx) => {
                  const isRevealed = activeStep >= item.step;
                  const isLineActive = activeStep > item.step;
                  
                  return (
                    <React.Fragment key={idx}>
                      {/* Step Card */}
                      <div 
                        className={`flex flex-col items-center text-center space-y-3 bg-[#ffffff] p-5 sm:p-6 rounded-2xl border border-[#1e4e7c]/10 shadow-sm transition-all duration-700 ease-out relative z-10 w-full max-w-sm ${
                          isRevealed 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 translate-y-10 scale-90'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm border-4 border-[#ffffff] shadow-md transition-colors duration-500 ${
                          isRevealed 
                            ? 'bg-[#1e4e7c] text-[#ffffff] shadow-[#1e4e7c]/20' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {item.step}
                        </div>
                        <h4 className="text-sm font-extrabold text-[#1e4e7c]" style={headingStyle}>{item.title}</h4>
                        <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed">{item.desc}</p>
                      </div>

                      {/* Mobile Connector Line (Only between cards, touching card boundaries) */}
                      {idx < steps.length - 1 && (
                        <div className="w-[2px] h-10 relative">
                          <div 
                            className="absolute top-0 left-[-1.5px] w-full border-l-[1.5px] border-dashed border-[#1e4e7c] transition-all duration-500 ease-out"
                            style={{ height: `${isLineActive ? 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==================== CONTACT SECTION ==================== */}
      <section id="contact" className="py-20 md:py-32 w-full px-6 sm:px-8 md:px-12 bg-[#ffffff]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start w-full">
          
          {/* Left panel (info) */}
          <ScrollReveal className="lg:col-span-5 h-full" delay={0}>
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e4e7c] tracking-tight" style={headingStyle}>Let's Secure Your Industrial Intelligence</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md">
                Ready to deploy SamiQ on-premise or in your private cloud? Drop us a line. Our engineering team is ready to assist with custom pipeline integrations.
              </p>
              
              <div className="space-y-4 pt-4 border-t border-[#1e4e7c]/10 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#1e4e7c] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Enterprise Inquiries</p>
                    <p className="font-semibold text-slate-800">contact@samiq.ai</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#1e4e7c] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Technical Support</p>
                    <p className="font-semibold text-slate-800">support@samiq.ai</p>
                  </div>
                </div>
              </div>

              {/* Social Handles */}
              <div className="flex gap-4 pt-4">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 rounded-lg border border-[#1e4e7c]/20 bg-[#ffffff] flex items-center justify-center text-slate-500 hover:text-[#1e4e7c] hover:border-[#1e4e7c]/40 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 rounded-lg border border-[#1e4e7c]/20 bg-[#ffffff] flex items-center justify-center text-slate-500 hover:text-[#1e4e7c] hover:border-[#1e4e7c]/40 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Right panel (form) */}
          <ScrollReveal className="lg:col-span-7" delay={150}>
            <div className="bg-[#1e4e7c]/5 p-6 sm:p-8 md:p-10 rounded-[24px] border border-[#1e4e7c]/15 w-full">
              <h3 className="text-base font-extrabold text-[#1e4e7c] mb-6" style={headingStyle}>Send a Message</h3>
              
              {submitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 animate-bounce" />
                  <span className="font-bold">Thank you for your message!</span>
                  <span>Our engineering team will get back to you within 24 hours.</span>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Your Name</label>
                      <input 
                        type="text" 
                        placeholder="Jane Doe" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-[#1e4e7c]/15 bg-[#ffffff] text-xs text-slate-950 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="jane@company.com" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-[#1e4e7c]/15 bg-[#ffffff] text-xs text-slate-950 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Message Description</label>
                    <textarea 
                      rows={4} 
                      placeholder="Tell us about your pipeline scale, document sizes..." 
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#1e4e7c]/15 bg-[#ffffff] text-xs text-slate-950 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3.5 rounded-lg bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] font-extrabold shadow-md shadow-[#1e4e7c]/10 hover:shadow-[#1e4e7c]/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>
          
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#1e4e7c]/3 py-16 text-xs text-slate-500 w-full px-6 sm:px-8 md:px-12">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Logo & Intro */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="SamiQ Logo" className="w-7 h-7 object-contain rounded-md" />
              <span className="font-extrabold text-base text-[#1e4e7c] tracking-tight" style={headingStyle}>SamiQ</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              SamiQ is a private-first enterprise operational memory layer. We transform engineering manuals, work logs, and blueprint logs into cited semantic intelligence answers.
            </p>
            <p className="text-[10px] text-slate-400 font-semibold font-mono">
              v1.2.0 • Active Grounding Enabled
            </p>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider">Product</h4>
            <div className="flex flex-col gap-2 font-semibold">
              <a href="#home" className="hover:text-[#1e4e7c] transition-colors">Home</a>
              <a href="#about" className="hover:text-[#1e4e7c] transition-colors">About Us</a>
              <a href="#features" className="hover:text-[#1e4e7c] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#1e4e7c] transition-colors">How it works</a>
            </div>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider">Platform</h4>
            <div className="flex flex-col gap-2 font-semibold">
              <Link to="/login" className="hover:text-[#1e4e7c] transition-colors">Console Log</Link>
              <Link to="/login" className="hover:text-[#1e4e7c] transition-colors">Privacy Policy</Link>
              <Link to="/login" className="hover:text-[#1e4e7c] transition-colors">Terms of Service</Link>
              <Link to="/login" className="hover:text-[#1e4e7c] transition-colors">System Status</Link>
            </div>
          </div>

          {/* Links 3 */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] uppercase font-bold text-[#1e4e7c] tracking-wider">Join Workspace</h4>
            <p className="text-slate-400 leading-relaxed">
              Login to access database indexes and chat with the RAG copilot.
            </p>
            <div className="pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg border border-[#1e4e7c]/20 hover:border-[#1e4e7c] text-slate-700 font-extrabold hover:text-[#1e4e7c] transition-all text-xs bg-[#ffffff] shadow-sm"
              >
                Authenticate Deck
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="w-full mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-[10px]">
          <p>© 2026 SamiQ Inc. All rights reserved. Secure RAG Platform.</p>
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#1e4e7c] transition-colors">GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#1e4e7c] transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
