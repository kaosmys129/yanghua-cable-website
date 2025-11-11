"use client";

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/lib/i18n";
import ProductComparison from "@/components/ui/FlexibleBusbarComparison";
import CertificationsGallery from "@/components/business/CertificationsGallery";
import Hero from "@/components/business/Hero";
import VideoPlayer from "@/components/business/VideoPlayer";
import ProjectGallery from "@/components/business/ProjectGallery";
import Partners from "@/components/business/Partners";
import ProductCardGrid from "@/components/business/ProductCardGrid";
import InquiryForm from "@/components/features/InquiryForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import Quote from "@/components/blocks/quote";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import type { QuoteBlock } from "@/lib/types";

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  scale: string;
  year: string;
  description: string;
}

interface Props {
  projects: Project[];
  csrfToken: string;
}

export default function CustomBusbarHubClient({ projects, csrfToken }: Props) {
  const locale = useLocale() as Locale;
  const tAbout = useTranslations("about");
  const { isScrolling, scrollToId } = useSmoothScroll();
  const scrollToQuote = useCallback(() => {
    if (isScrolling) return; // 避免滚动过程中重复触发
    scrollToId("quote-section", { offset: 16, duration: 500 });
  }, [isScrolling, scrollToId]);
  const pageTitle = locale === "es" ? "Sistemas de Barra Flexible Personalizados" : "Custom Flexible Busbar Systems";

  const companyStats = [
    { number: "40+", label: "Patents" },
    { number: "2", label: "Production Lines" },
    { number: "3", label: "Laboratories" },
    { number: "11", label: "Enterprise Standards" },
  ];

  const quoteData: QuoteBlock = {
    __component: "shared.quote",
    id: 0,
    title: locale === "es" ? "Solicitar Cotización" : "Get Quote",
    body:
      locale === "es"
        ? "Por favor, deje sus requisitos y nuestro equipo se comunicará con usted pronto."
        : "Please leave your requirements and our team will contact you shortly.",
  };

  return (
    <>
      <Hero onScrollToQuote={scrollToQuote} />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Breadcrumbs locale={locale} currentTitle={pageTitle} currentSlug="custom-busbar-systems" />

        {/* About: Company Overview metrics + Company Video */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#212529] mb-6">{tAbout("overview.title")}</h2>
              <p className="text-lg text-[#6c757d] mb-6">{tAbout("overview.description")}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {companyStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-[#f8f9fa] rounded-lg">
                    <div className="text-2xl md:text-3xl font-bold text-[#fdb827] mb-1">{stat.number}</div>
                    <div className="text-sm md:text-base text-[#6c757d]">{tAbout(`overview.stats.${stat.label.toLowerCase().replace(" ", "")}`)}</div>
                  </div>
                ))}
              </div>
            </div>
            <VideoPlayer
              videoSources={{
                en: [
                  { src: "/videos/company-intro-en.mp4", type: "video/mp4" },
                  { src: "/videos/company-intro-en.webm", type: "video/webm" },
                ],
                es: [
                  { src: "/videos/company-intro-es.mp4", type: "video/mp4" },
                  { src: "/videos/company-intro-es.webm", type: "video/webm" },
                ],
              }}
              thumbnailUrl="/images/company-intro.webp"
              title={tAbout("video.companyIntro")}
              className="shadow-lg"
            />
          </div>
        </section>

        {/* Product Comparison (kept) */}
        <ProductComparison />

        {/* Products Grid: show top 4 products from product list */}
        <ProductCardGrid locale={locale} onScrollToQuote={scrollToQuote} />

        {/* Certifications Gallery (kept) */}
        <CertificationsGallery locale={locale} />

        {/* Replace Engineering Case Studies with Home Featured Projects */}
        <ProjectGallery projects={projects} onScrollToQuote={scrollToQuote} />

        {/* Partners section (added below Featured Projects) */}
        <Partners onScrollToQuote={scrollToQuote} />

        {/* Quote 组件作为滚动目标（在询价表单之前） */}
        <section id="quote-section" className="mt-12">
          <Quote data={quoteData} />
        </section>

        {/* Add Query (RFQ) component at bottom */}
        <div className="mt-12">
          <InquiryForm csrfToken={csrfToken} />
        </div>
      </main>
    </>
  );
}