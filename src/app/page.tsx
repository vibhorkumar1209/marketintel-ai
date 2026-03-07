'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex-1 py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-hero-pattern pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#E8EDF5] leading-tight">
              AI-Powered Market Intelligence
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400 mt-4">
                In 30 Minutes.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#8899BB] max-w-2xl mx-auto leading-relaxed">
              Replace weeks of analyst work with AI agents that research, analyze, and compile comprehensive market reports—complete with source citations and confidence scores.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                variant="primary"
                size="lg"
                href="/signup"
                className="inline-flex"
              >
                Start Free →
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="#sample-report"
                className="inline-flex"
              >
                View Sample Report
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#111827] border-y border-[#2A3A55] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">10K+</p>
              <p className="text-[#8899BB] text-sm mt-1">Reports Generated</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">95%</p>
              <p className="text-[#8899BB] text-sm mt-1">Quality Score</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">30 min</p>
              <p className="text-[#8899BB] text-sm mt-1">Turnaround Time</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">6-Tier</p>
              <p className="text-[#8899BB] text-sm mt-1">Source Verification</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#E8EDF5] mb-4">How It Works</h2>
            <p className="text-[#8899BB] text-lg">Three simple steps to market intelligence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: 'Enter Your Query', desc: 'Describe the market you want to research in natural language' },
              { icon: '🤖', title: 'AI Agents Research', desc: 'Multi-agent system researches across 6 source tiers and analyzes data' },
              { icon: '📥', title: 'Download Report', desc: 'Get a professional, citation-rich report in PDF or Excel format' },
            ].map((step, i) => (
              <div key={i} className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-teal-600 bg-opacity-10 border border-teal-600 border-opacity-30 rounded-lg flex items-center justify-center text-4xl">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#E8EDF5] text-center">{step.title}</h3>
                <p className="text-[#8899BB] text-center">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="bg-[#111827] border-y border-[#2A3A55] py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#E8EDF5] mb-4">Our Products</h2>
            <p className="text-[#8899BB] text-lg">Choose the right report format for your needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: '📋',
                title: 'Industry Report',
                subtitle: '15-Section Deep Research Report',
                features: ['150–200 pages', '8-step agent chain', 'PDF + HTML output', 'Full citations', 'Quality scored'],
                price: 'From $49',
                badge: 'Popular',
              },
              {
                icon: '📊',
                title: 'Market Datapack',
                subtitle: '10-Sheet Excel File',
                features: ['Time-series data', 'Segmentation analysis', '6-step agent chain', 'XLSX output', 'Quick turnaround'],
                price: 'From $30',
                badge: 'New',
              },
            ].map((product, i) => (
              <Card
                key={i}
                variant="highlighted"
                className="hover:shadow-lg hover:shadow-teal-600/20 transition-all"
              >
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-5xl mb-3">{product.icon}</div>
                      <h3 className="text-2xl font-bold text-[#E8EDF5]">{product.title}</h3>
                      <p className="text-[#8899BB] mt-1">{product.subtitle}</p>
                    </div>
                    {product.badge && (
                      <Badge variant="teal">{product.badge}</Badge>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {product.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-[#E8EDF5]">
                        <span className="text-teal-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-[#2A3A55] pt-6">
                    <p className="text-2xl font-bold text-teal-600 mb-4">{product.price}</p>
                    <Button variant="primary" href="/signup" className="w-full">
                      Get Started
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#E8EDF5] mb-4">Key Features</h2>
            <p className="text-[#8899BB] text-lg">Everything you need for market intelligence</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📚', title: 'Source-Cited', desc: 'Every claim backed by verified sources across 6 tiers' },
              { icon: '📈', title: 'Dual-Method Sizing', desc: 'Top-down and bottom-up market sizing for accuracy' },
              { icon: '📱', title: 'Social Intelligence', desc: 'Real-time social signals and sentiment analysis' },
              { icon: '🔍', title: 'Live Web Research', desc: 'Searches billions of pages for fresh data' },
              { icon: '💾', title: 'Export Ready', desc: 'PDF, Excel, and HTML formats instantly' },
              { icon: '⭐', title: 'Quality Scored', desc: 'Confidence scores on every section and data point' },
            ].map((feature, i) => (
              <Card key={i} className="text-center">
                <div className="space-y-3">
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-[#E8EDF5]">{feature.title}</h3>
                  <p className="text-[#8899BB] text-sm">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="bg-[#111827] border-y border-[#2A3A55] py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#E8EDF5] mb-4">Simple Pricing</h2>
            <p className="text-[#8899BB] text-lg">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$49',
                period: 'one-time',
                desc: '2,500 credits',
                features: ['Up to 50 reports', 'Standard depth', 'Email support', '6-month validity'],
                cta: 'Get Started',
              },
              {
                name: 'Pro',
                price: '$199',
                period: '/month',
                desc: 'Unlimited reports',
                features: ['All depths', 'Priority support', 'API access', 'Custom exports', 'Team seats (3)'],
                cta: 'Subscribe',
                highlighted: true,
              },
              {
                name: 'Team',
                price: '$599',
                period: '/month',
                desc: 'Enterprise solution',
                features: ['Unlimited everything', 'Dedicated support', 'Advanced API', 'White-label', 'Unlimited seats'],
                cta: 'Contact Sales',
              },
            ].map((plan, i) => (
              <Card
                key={i}
                variant={plan.highlighted ? 'highlighted' : 'default'}
                className={plan.highlighted ? 'md:scale-105 md:shadow-2xl md:shadow-teal-600/20' : ''}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#E8EDF5]">{plan.name}</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-teal-600">{plan.price}</span>
                      <span className="text-[#8899BB] ml-2">{plan.period}</span>
                    </div>
                    <p className="text-[#8899BB] text-sm mt-2">{plan.desc}</p>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-[#E8EDF5] text-sm">
                        <span className="text-teal-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    href="/signup"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-hero-pattern pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#E8EDF5] mb-6">
            Start generating intelligence reports today
          </h2>
          <p className="text-lg text-[#8899BB] mb-8">
            Join thousands of market researchers using AI to save hundreds of hours annually
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" href="/signup">
              Get Started Free →
            </Button>
            <Button variant="outline" size="lg" href="/contact">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
