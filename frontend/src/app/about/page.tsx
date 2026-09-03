import React from 'react';
import Image from 'next/image';

export const metadata = {
  title: "About Us",
  description: "Learn about the heritage, craftsmanship, and quiet luxury philosophy of Haus of Hafsah.",
};

export default function AboutPage() {
  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      {/* Editorial Header */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
          Our Story
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal tracking-wide max-w-2xl mx-auto leading-tight">
          Crafting a Legacy of <br />
          <span className="italic">Quiet Luxury</span>
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brown-muted max-w-xl mx-auto leading-relaxed pt-2">
          Founded on the philosophy of simplicity, comfort, and longevity, Haus of Hafsah designs modular garments for the modern wardrobe.
        </p>
      </section>

      {/* Hero Image Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border/10">
          <Image
            src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1600"
            alt="Haus of Hafsah textile editorial curation"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
        </div>
      </section>

      {/* Narrative grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-start font-sans text-xs sm:text-sm text-brown-muted leading-relaxed">
        <div className="space-y-6">
          <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal">
            The Aesthetic Language
          </h2>
          <p>
            At Haus of Hafsah, we bypass transient trends to focus on core fabrication. Our design language is rooted in minimal, elegant touches. We favor a warm, tactile ivory and beige palette that feels inviting and soft, rather than stark and clinical.
          </p>
          <p>
            Each piece is custom-tailored with generous proportions, finished with subtle hairline seams, and structured using clean, premium fabrics like virgin wool, natural linen, and soft cashmere knits.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal">
            Conscious Craftsmanship
          </h2>
          <p>
            We believe that a boutique brand should prioritize sustainability and thoughtful production. We work closely with boutique mills that respect ecological limits and utilize ethical labour.
          </p>
          <p>
            By designing modular capsule collections, we help our clients construct long-term wardrobe systems. Every garment is engineered for modular styling, allowing you to combine outerwear, essentials, and knitwear into effortless seasonal edits.
          </p>
        </div>
      </section>
    </div>
  );
}
