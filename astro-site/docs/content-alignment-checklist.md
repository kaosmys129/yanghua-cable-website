# Astro Content Alignment Checklist

Production source: `https://www.yhflexiblebusbar.com`

| Page group | Production URL | Astro URL | Legacy source | Status |
| --- | --- | --- | --- | --- |
| Home EN | `/en` | `/en` | `content/pages/en/home.json`, `src/messages/en.json` | Core sections restored: hero, strength, applications, comparison, partners, projects, inquiry |
| Home ES | `/es` | `/es` | `content/pages/es/home.json`, `src/messages/es.json` | Core sections restored |
| Products EN | `/en/products` | `/en/products` | `src/messages/en.json` | Categories, images, models, specs restored |
| Products ES | `/es/productos` | `/es/productos` | `src/messages/es.json` | Categories, images, models, specs restored |
| About EN | `/en/about` | `/en/about` | `content/pages/en/about.json` | Video thumbnail, timeline, certifications, team restored |
| About ES | `/es/acerca-de` | `/es/acerca-de` | `content/pages/es/about.json` | Same structure restored |
| Solutions | `/en/solutions`, `/es/soluciones` | same | `src/messages/*.json` | Existing Astro cards use legacy messages and images |
| Projects | `/en/projects`, `/es/proyectos` | same | `src/messages/*.json` | Existing Astro list/detail use legacy messages and images |
| Services | `/en/services`, `/es/servicios` | same | `content/pages/*/services.json` | Service cards, FAQ, support CTA, resource CTA restored |
| Partners | `/en/partners`, `/es/socios` | same | `content/pages/*/partners.json`, `public/images/partners` | Logos restored in both locales; benefit cards added from available legacy context |
| Product category EN | `/en/products/category/*` | same | `src/messages/en.json`, legacy category page constants | Category pages restored with models, applications, structure, specifications, core configurations |
| Product category ES | `/es/productos/categoria/*` | same | `src/messages/es.json`, legacy category page constants | Category pages restored with localized labels and legacy Spanish category content |
| Product detail EN | `/en/products/*` | same | legacy Next product detail data | Typical details restored for 2000A/1500A/2500A/accessories with overview, features, specs, gallery, related products |
| Product detail ES | `/es/productos/*` | same | legacy Next product detail data | Same detail routes restored with localized page labels |
| Contact | `/en/contact`, `/es/contacto` | same | `content/pages/*/contact.json` | Contact form, info cards, global support restored |
| Articles | `/en/articles`, `/es/articulos` | same | `content/articles/**/*.mdx` | Existing Astro MDX routes preserve title, cover, summary, body |

Remaining follow-up candidates:

- Full visual screenshot comparison still needs a local preview server that can bind a port in the current environment.
- Partner benefit cards are conservative derived copy because the current legacy JSON only includes title/subtitle/CTA and the production site could not be reached from this environment.
