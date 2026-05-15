import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faShieldAlt,
  faChartLine,
  faClock,
  faBolt,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';

const About = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: faSearch,
      title: 'Comprehensive Analysis',
      description: 'Instant crawl in 30 seconds. We check your website for everything that matters including OWASP Top 10 vulnerabilities, SSL/TLS certificates, and security headers.'
    },
    {
      icon: faShieldAlt,
      title: 'Security Scanning',
      description: 'Deep security analysis detecting XSS, SQL injection, CSRF vulnerabilities, clickjacking risks, and missing security configurations to keep your site protected.'
    },
    {
      icon: faChartLine,
      title: 'Performance Metrics',
      description: 'Measure your website\'s speed, UX quality, and overall performance. Get actionable insights to optimize loading times and user experience.'
    },
    {
      icon: faClock,
      title: 'Scan History',
      description: 'Track your website\'s security posture over time. Save every report and see how your website improves with detailed historical data and trends.'
    }
  ];

  const faqs = [
    {
      question: 'What exactly does WebSecura do?',
      answer: 'WebSecura is a comprehensive security scanning platform that analyzes your website for vulnerabilities, security misconfigurations, and performance issues. We check for OWASP Top 10 vulnerabilities, SSL/TLS certificates, security headers, and provide detailed recommendations to improve your website\'s security posture.'
    },
    {
      question: 'How many free scans do I get?',
      answer: 'With our free plan, you get 5 scans per month. This includes basic security analysis and 7-day scan history. For unlimited scans and advanced features, upgrade to our Premium plan for just $9/month.'
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No! You can perform basic scans without creating an account. However, creating a free account allows you to save your scan history, track improvements over time, and access more detailed reports.'
    },
    {
      question: 'What plans are available right now?',
      answer: 'We offer three plans: Free (5 scans/month with basic features), Monthly Premium ($9/month for unlimited scans and advanced features), and Lifetime ($35 one-time payment for lifetime access to all premium features).'
    },
    {
      question: 'What\'s included in Premium access?',
      answer: 'Premium includes unlimited website scans, OWASP Top 10 vulnerability detection, SSL/TLS analysis, security headers verification, performance metrics, unlimited scan history, exportable reports, real-time threat alerts, priority support, and API access.'
    },
    {
      question: 'How is this different from Google PageSpeed Insights?',
      answer: 'While PageSpeed focuses primarily on performance metrics, WebSecura provides comprehensive security analysis including vulnerability scanning, security headers, SSL/TLS verification, and OWASP Top 10 checks. We combine security scanning with performance analysis for a complete website health check.'
    },
    {
      question: 'How often are scans updated?',
      answer: 'You can run scans anytime you want. Premium users with automated monitoring can schedule scans to run automatically at intervals of your choice. Our scanning engine is continuously updated to detect the latest security threats and vulnerabilities.'
    }
  ];

  return (
    <>
      {/* Header */}
      

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Features of <span className="logo-shield">WebSecura</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              From comprehensive analysis to automated monitoring and trust badges
            </p>
            <div className="about-divider mt-6"></div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="about-section group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <FontAwesomeIcon icon={feature.icon} className="text-2xl text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <a 
              href="/"
              className="cta-button inline-block"
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Start Free Analysis
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Get your website to <span className="logo-shield">the next level</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Features List */}
            <div className="lg:col-span-1">
              <div className="about-section sticky top-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-6 tracking-wider uppercase">
                  Everything You'll Get
                </h3>
                <div className="space-y-4">
                  {[
                    'Unlimited website scans',
                    'OWASP Top 10 vulnerability detection',
                    'SSL/TLS certificate analysis',
                    'Security headers verification',
                    'Performance & UX metrics',
                    'Detailed scan history',
                    'Exportable security reports',
                    'Real-time threat alerts'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-gray-300 text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <div className="about-section">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Monthly</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-white">$5</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                  <button className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all mb-4">
                    Subscribe Monthly
                  </button>
                  <p className="text-sm text-gray-400">Cancel anytime</p>
                </div>
              </div>

              {/* Lifetime Plan */}
              <div className="about-section border-2 border-green-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Lifetime</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-white">$35</span>
                    <span className="text-gray-400 ml-2">One time</span>
                  </div>
                  <button className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all mb-4 shadow-lg shadow-green-500/30">
                    Get Lifetime Access
                  </button>
                  <p className="text-sm text-gray-400">No subscription • One time payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to <span className="logo-shield">understand</span>
            </h2>
            <p className="text-gray-300 text-lg">
              Get answers to the most common questions about our website security platform
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="about-section">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-lg font-semibold text-white pr-8">
                    {faq.question}
                  </span>
                  <FontAwesomeIcon 
                    icon={openFaq === index ? faChevronUp : faChevronDown} 
                    className="text-green-400 flex-shrink-0"
                  />
                </button>
                
                {openFaq === index && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA after FAQ */}
          <div className="text-center mt-16">
            <p className="text-gray-300 mb-6 text-lg">
              Still have questions? We're here to help!
            </p>
            <a 
              href="/contact"
              className="cta-button inline-block"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;