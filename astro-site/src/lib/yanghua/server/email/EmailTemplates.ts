function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function mapContactSubject(locale: string, raw: string): string {
  // 兼容不同前端的 subject value（旧站: product-inquiry，新站: productInquiry）
  const normalized = String(raw || '')
    .trim()
    .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    .toLowerCase();

  const en: Record<string, string> = {
    'product-inquiry': 'Product Inquiry',
    'technical-support': 'Technical Support Request',
    'partnership': 'Partnership Inquiry',
    'custom-solution': 'Custom Solution Request',
    other: 'General Inquiry',
    '': 'General Inquiry',
  };
  const es: Record<string, string> = {
    'product-inquiry': 'Consulta de Producto',
    'technical-support': 'Solicitud de Soporte Técnico',
    'partnership': 'Consulta de Asociación',
    'custom-solution': 'Solicitud de Solución Personalizada',
    other: 'Consulta General',
    '': 'Consulta General',
  };
  const pt: Record<string, string> = {
    'product-inquiry': 'Consulta de Produto',
    'technical-support': 'Solicitação de Suporte Técnico',
    partnership: 'Consulta de Parceria',
    'custom-solution': 'Solicitação de Solução Personalizada',
    other: 'Consulta Geral',
    '': 'Consulta Geral',
  };

  const dict = locale === 'es' ? es : locale === 'pt' ? pt : en;
  return dict[normalized] || raw || dict.other;
}

function renderEmailHtml(params: {
  locale: 'en' | 'es' | 'pt';
  title: string;
  subtitle: string;
  fields: Array<{ label: string; value: string }>;
  message: string;
}): string {
  const rows = params.fields
    .filter((f) => f.label)
    .map(
      (f) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;background:#e9ecef;font-weight:600;width:30%">${escapeHtml(f.label)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;background:#f8f9fa">${escapeHtml(f.value || '')}</td>
        </tr>`
    )
    .join('\n');

  const messageHeading =
    params.locale === 'es' ? 'Contenido del Mensaje' : params.locale === 'pt' ? 'Conteúdo da Mensagem' : 'Message Content';

  return `<!doctype html>
  <html lang="${params.locale}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(params.title)}</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#212529 0%,#343a40 100%);color:#fff;padding:24px 28px;">
          <h1 style="margin:0;font-size:18px;letter-spacing:.02em;">${escapeHtml(params.title)}</h1>
          <p style="margin:8px 0 0;opacity:.9;font-size:14px;">${escapeHtml(params.subtitle)}</p>
        </div>
        <div style="padding:24px 28px;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #dee2e6;border-radius:8px;overflow:hidden">
            <tbody>
              ${rows}
            </tbody>
          </table>
          <h2 style="margin:22px 0 10px;font-size:16px;border-bottom:2px solid #fdb827;padding-bottom:8px;">${messageHeading}</h2>
          <div style="border:1px solid #dee2e6;border-radius:8px;padding:16px;white-space:pre-wrap;line-height:1.7;">${escapeHtml(params.message || '')}</div>
        </div>
        <div style="background:#e9ecef;padding:14px 28px;color:#6c757d;font-size:12px;text-align:center;">
          ${params.locale === 'es'
            ? 'Este correo fue generado automáticamente por el formulario del sitio web.'
            : params.locale === 'pt'
              ? 'Este e-mail foi gerado automaticamente pelo formulário do site.'
              : 'This email was generated automatically by the website form.'}
        </div>
      </div>
    </body>
  </html>`;
}

export async function renderContactFormEmail(
  data: {
    name: string;
    email: string;
    company: string;
    country?: string;
    phone?: string;
    subject?: string;
    message: string;
    clientIP?: string;
  },
  locale: 'en' | 'es' | 'pt'
): Promise<{ subject: string; html: string; text: string }> {
  const subjectLabel = mapContactSubject(locale, data.subject || '');
  const headline =
    locale === 'es' ? 'Nueva Consulta de Contacto' : locale === 'pt' ? 'Nova Solicitação de Contato' : 'New Contact Form Submission';
  const subject = `${headline} - ${subjectLabel} - ${data.company || data.name || 'Website'}`;
  const sentAt = formatDate(new Date(), locale);

  const fields: Array<{ label: string; value: string }> = [
    { label: locale === 'es' ? 'Tipo' : locale === 'pt' ? 'Tipo' : 'Type', value: 'Contact' },
    { label: locale === 'es' ? 'Nombre' : locale === 'pt' ? 'Nome' : 'Name', value: data.name },
    { label: locale === 'es' ? 'Correo' : locale === 'pt' ? 'E-mail' : 'Email', value: data.email },
    { label: locale === 'es' ? 'Empresa' : locale === 'pt' ? 'Empresa' : 'Company', value: data.company },
    { label: locale === 'es' ? 'País' : locale === 'pt' ? 'País' : 'Country', value: data.country || '' },
    { label: locale === 'es' ? 'Teléfono' : locale === 'pt' ? 'Telefone' : 'Phone', value: data.phone || '' },
    { label: locale === 'es' ? 'Asunto' : locale === 'pt' ? 'Assunto' : 'Subject', value: subjectLabel },
    { label: 'IP', value: data.clientIP || '' },
    { label: locale === 'es' ? 'Fecha' : locale === 'pt' ? 'Data' : 'Date', value: sentAt },
  ];

  const html = renderEmailHtml({
    locale,
    title: subject,
    subtitle: 'Yanghua Cable Website',
    fields,
    message: data.message,
  });

  const text = [
    subject,
    '',
    ...fields.filter((f) => f.value).map((f) => `${f.label}: ${f.value}`),
    '',
    locale === 'es' ? 'Mensaje:' : locale === 'pt' ? 'Mensagem:' : 'Message:',
    data.message,
  ].join('\n');

  return { subject, html, text };
}

export async function renderInquiryFormEmail(
  data: {
    name: string;
    email: string;
    company: string;
    productInterest?: string;
    message: string;
    clientIP?: string;
  },
  locale: 'en' | 'es' | 'pt'
): Promise<{ subject: string; html: string; text: string }> {
  const headline = locale === 'es' ? 'Nueva Consulta de Producto' : locale === 'pt' ? 'Nova Consulta de Produto' : 'New Product Inquiry';
  const subject = `${headline} - ${data.company || data.name || 'Website'}${data.productInterest ? ` - ${data.productInterest}` : ''}`;
  const sentAt = formatDate(new Date(), locale);

  const fields: Array<{ label: string; value: string }> = [
    { label: locale === 'es' ? 'Tipo' : locale === 'pt' ? 'Tipo' : 'Type', value: 'Inquiry' },
    { label: locale === 'es' ? 'Nombre' : locale === 'pt' ? 'Nome' : 'Name', value: data.name },
    { label: locale === 'es' ? 'Correo' : locale === 'pt' ? 'E-mail' : 'Email', value: data.email },
    { label: locale === 'es' ? 'Empresa' : locale === 'pt' ? 'Empresa' : 'Company', value: data.company },
    { label: locale === 'es' ? 'Interés' : locale === 'pt' ? 'Interesse do produto' : 'Product interest', value: data.productInterest || '' },
    { label: 'IP', value: data.clientIP || '' },
    { label: locale === 'es' ? 'Fecha' : locale === 'pt' ? 'Data' : 'Date', value: sentAt },
  ];

  const html = renderEmailHtml({
    locale,
    title: subject,
    subtitle: 'Yanghua Cable Website',
    fields,
    message: data.message,
  });

  const text = [
    subject,
    '',
    ...fields.filter((f) => f.value).map((f) => `${f.label}: ${f.value}`),
    '',
    locale === 'es' ? 'Mensaje:' : locale === 'pt' ? 'Mensagem:' : 'Message:',
    data.message,
  ].join('\n');

  return { subject, html, text };
}
