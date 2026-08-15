import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Haus of Hafsah',
  description: 'Read the terms and conditions for ordering, shipping, returns, and cash on delivery validation at Haus of Hafsah.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-background text-charcoal min-h-screen py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brown-muted mb-8">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">Terms of Service</span>
        </nav>

        {/* Heading */}
        <div className="border-b border-border/60 pb-10 mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-wide mb-4">
            Terms of Service
          </h1>
          <p className="font-sans text-xs text-brown-muted">
            Last Updated: August 15, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12 font-sans text-sm leading-relaxed text-brown-muted">
          <section className="space-y-4">
            <p>
              Welcome to <strong className="text-charcoal">Haus of Hafsah</strong>. These Terms of Service govern your use of our website, services, and the purchase of our products. By accessing our site or placing an order, you agree to comply with and be bound by these terms. Please read them carefully before finalizing your transactions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              1. General Account & Order Terms
            </h2>
            <p>
              By purchasing from Haus of Hafsah, you represent that you are at least the age of majority in your province of residence. You agree to provide accurate, current, and complete purchase and account information for all orders.
            </p>
            <p>
              We reserve the right to refuse service, limit quantities, or cancel any order at our sole discretion. In the event of a cancellation, we will notify you using the email or phone number provided.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              2. Cash on Delivery (COD) Policy
            </h2>
            <p>
              To accommodate our customers across Pakistan, we offer Cash on Delivery (COD) services. The following rules apply to COD transactions:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Order Verification:</strong> All COD orders require confirmation. Our support team will contact you via mobile call, SMS, or WhatsApp. Orders that remain unverified after three attempts will be automatically cancelled.
              </li>
              <li>
                <strong className="text-charcoal">COD Limits:</strong> Standard COD services are restricted to orders under PKR 50,000. Orders exceeding this amount require a partial advance bank deposit.
              </li>
              <li>
                <strong className="text-charcoal">Refusal of Delivery:</strong> Customers who repeatedly refuse shipments at their doorstep without valid reason will be blacklisted from utilizing the COD service for future purchases.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              3. Pricing, Product Descriptions & Color Disclaimers
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Pricing:</strong> Prices for our products are subject to change without notice. Listed prices include local taxes where applicable. Shipping costs will be added at checkout.
              </li>
              <li>
                <strong className="text-charcoal">Accuracy of Descriptions:</strong> We strive to describe our products, fabrics, and measurements as accurately as possible. However, slight variations may occur.
              </li>
              <li>
                <strong className="text-charcoal">Color Disclaimers:</strong> We make every effort to display product colors accurately. However, due to studio lighting, professional photoshoot editing, and individual monitor/screen calibration, the actual color of the garment may vary slightly from the images shown.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              4. Shipping & Delivery
            </h2>
            <p>
              We dispatch orders via premium domestic courier companies (TCS, Leopards, Trax, etc.).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Delivery Timelines:</strong> Deliveries to major cities (Karachi, Lahore, Islamabad) generally take 2 to 4 working days. Delivery to secondary cities and remote regions takes 3 to 5 working days.
              </li>
              <li>
                <strong className="text-charcoal">Delays:</strong> Delivery times are estimates. Haus of Hafsah is not responsible for courier delays caused by weather conditions, public holidays, political strikes, or other force majeure events.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              5. Exchange & Return Policy
            </h2>
            <p>
              We want you to be completely satisfied with your purchase. If you need to make an exchange, please review our requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-charcoal">Exchange Period:</strong> You may request an exchange for size or defects within <strong className="text-charcoal">7 days</strong> of receiving your parcel.
              </li>
              <li>
                <strong className="text-charcoal">Garment Condition:</strong> Items must be unwashed, unworn, undamaged, and complete with all original product tags and receipt invoices attached.
              </li>
              <li>
                <strong className="text-charcoal">Sale Items:</strong> Products purchased during promotional sales, clearances, or flash campaigns are not eligible for exchanges or refunds unless damaged upon receipt.
              </li>
              <li>
                <strong className="text-charcoal">Shipping Costs:</strong> Unless the exchange is due to a manufacturing defect or wrong item shipped, the customer is responsible for the courier charges to return the item to our warehouse.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              6. Intellectual Property
            </h2>
            <p>
              All website content, product photography, dress designs, logos, text, graphics, and branding are the exclusive property of Haus of Hafsah. You are prohibited from copying, distributing, republishing, or utilizing our assets for commercial purposes without explicit written consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              7. Governing Law
            </h2>
            <p>
              These Terms of Service and any separate agreements shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in Karachi, Pakistan.
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-border/40">
            <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
              8. Customer Support & Inquiry
            </h2>
            <p>
              If you have any questions, complaints, or feedback regarding these Terms of Service, please contact our support team:
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
