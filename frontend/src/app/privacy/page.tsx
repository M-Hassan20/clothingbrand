import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Haus of Hafsah',
  description: 'Learn how Haus of Hafsah collects, uses, and protects your personal information in compliance with e-commerce regulations in Pakistan.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-charcoal min-h-screen py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brown-muted mb-8">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">Privacy Policy</span>
        </nav>

        {/* Heading */}
        <div className="border-b border-border/60 pb-10 mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-wide mb-4">
            Privacy Policy
          </h1>
          <p className="font-sans text-xs text-brown-muted">
            Last Updated: August 15, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12 font-sans text-sm leading-relaxed text-brown-muted">
          <section className="space-y-4">
            <p>
              At <strong className="text-charcoal">Haus of Hafsah</strong>, we appreciate the trust you place in us. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy details how we collect, use, disclose, and safeguard your data when you visit our website, place an order, or engage with our services.
            </p>
            <p>
              This policy complies with standard electronic transaction laws and personal data protection regulations applicable to digital e-commerce operations in Pakistan.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              1. Information We Collect
            </h2>
            <p>
              To fulfill your orders, deliver premium products, and provide a seamless shopping experience, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Personal Identifiers:</strong> Your full name, email address, shipping/billing address, and active mobile phone number.
              </li>
              <li>
                <strong className="text-charcoal">Order & Transaction Details:</strong> Products purchased, cart selections, order history, and payment preferences.
              </li>
              <li>
                <strong className="text-charcoal">Technical & Usage Data:</strong> Your IP address, browser type, device information, and interaction history on our website collected via cookies and tracking pixels (such as Meta Pixel and Google Analytics).
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              2. How We Use Your Information
            </h2>
            <p>
              We utilize your personal information to run our store operations efficiently, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Processing, packaging, and dispatching your orders.</li>
              <li>
                <strong className="text-charcoal">Order Verification:</strong> Contacting you via call, SMS, or WhatsApp to confirm Cash on Delivery (COD) orders or verify shipping coordinates prior to shipment.
              </li>
              <li>Sharing dispatch information and tracking numbers with you.</li>
              <li>Sending newsletters, promotional updates, and seasonal catalogs (you can opt-out at any time).</li>
              <li>Optimizing our website structure, design, and user experience.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              3. Data Sharing with Third Parties
            </h2>
            <p>
              We do not sell, rent, or trade your personal information. We only share essential data with trusted service providers to execute business actions:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Logistics & Delivery Services:</strong> Sharing your name, delivery address, and phone number with third-party logistics firms in Pakistan (such as TCS, Leopards Courier, Trax, or Rider) to ensure successful delivery.
              </li>
              <li>
                <strong className="text-charcoal">Payment Gateways:</strong> Transacting digital payments securely through certified online financial services.
              </li>
              <li>
                <strong className="text-charcoal">Marketing & Analytics Tools:</strong> Working with digital advertising platforms (like Meta and Google) to display relevant collections and run customized catalog ads.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              4. Cookies and Tracking Pixels
            </h2>
            <p>
              Cookies are small files placed on your browser to recognize your preferences and track sessions. We use functional cookies to keep track of items in your shopping cart and analyze visitor traffic. 
            </p>
            <p>
              Third-party tracking tools, including the Meta Pixel, collect data about your interactions to measure ad campaigns and show tailored fashion lookbooks on social media channels. You can adjust your browser settings to reject cookies if you prefer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              5. Data Security & Storage
            </h2>
            <p>
              We implement robust physical and electronic security systems to prevent unauthorized access, loss, or alteration of your personal data. All account credentials, passwords, and sensitive information are encrypted and protected by modern security frameworks.
            </p>
            <p>
              While we make every effort to secure our networks, no internet-based transmission is completely foolproof. We advise you to protect your account password and avoid sharing credentials.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              6. Your Rights
            </h2>
            <p>
              You have the right to request access to the personal data we hold about you, request corrections to outdated details (like phone numbers or shipping addresses), or request the deletion of your account. If you wish to update your details or cease communication, please contact our support team.
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-border/40">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              7. Contact Us
            </h2>
            <p>
              For questions regarding our privacy policy, or to manage your customer data, please reach out to us at:
            </p>
            <div className="bg-beige/10 border border-border/40 p-5 rounded-md text-xs space-y-2 mt-2">
              <p><strong className="text-charcoal">Haus of Hafsah Support:</strong></p>
              <p>Email: <a href="mailto:info@hausofhafsah.com" className="text-accent underline">info@hausofhafsah.com</a></p>
              <p>Phone: +92 314 8730683</p>
              <p>Address: Block 4, Clifton, Karachi, Pakistan</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
