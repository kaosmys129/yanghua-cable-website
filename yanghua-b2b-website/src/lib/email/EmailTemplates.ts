import { getTranslations } from 'next-intl/server';

/**
 * 模板变量接口
 */
export interface TemplateVariables {
  [key: string]: string | number | Date | boolean;
}

/**
 * 邮件模板数据接口
 */
export interface EmailTemplateData {
  // 联系表单数据
  contactForm?: {
    name: string;
    email: string;
    company: string;
    country: string;
    phone?: string;
    subject: string;
    message: string;
  };
  
  // 询盘表单数据
  inquiryForm?: {
    name: string;
    email: string;
    company: string;
    productInterest?: string;
    message: string;
  };
  
  // 通用数据
  common?: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    currentDate: Date;
    locale: string;
  };
}

/**
 * 邮件模板渲染器类
 */
export class EmailTemplateRenderer {
  private locale: string;

  constructor(locale: string = 'en') {
    this.locale = locale;
  }

  /**
   * 渲染联系表单邮件模板
   */
  async renderContactFormTemplate(data: EmailTemplateData['contactForm']): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    if (!data) {
      throw new Error('Contact form data is required');
    }

    const t = await getTranslations({ locale: this.locale, namespace: 'email.templates.contact' });
    const formattedDate = this.formatDate(new Date(), this.locale);

    // 主题翻译映射
    const subjectMap: Record<string, Record<string, string>> = {
      en: {
        'product-inquiry': 'Product Inquiry',
        'technical-support': 'Technical Support Request',
        'partnership': 'Partnership Inquiry',
        'custom-solution': 'Custom Solution Request',
        'other': 'General Inquiry'
      },
      es: {
        'product-inquiry': 'Consulta de Producto',
        'technical-support': 'Solicitud de Soporte Técnico',
        'partnership': 'Consulta de Asociación',
        'custom-solution': 'Solicitud de Solución Personalizada',
        'other': 'Consulta General'
      }
    };

    const translatedSubject = subjectMap[this.locale]?.[data.subject] || data.subject;
    const subject = `${this.locale === 'en' ? 'New Contact Form' : 'Nueva Consulta'} - ${translatedSubject} - ${data.company}`;

    const html = `
      <!DOCTYPE html>
      <html lang="${this.locale}" dir="${this.locale === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #212529 0%, #343a40 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #212529;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #fdb827;
            font-size: 20px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
          }
          .info-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e9ecef;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #495057;
            width: 30%;
            background: #e9ecef;
          }
          .info-table tr:last-child td {
            border-bottom: none;
          }
          .message-content {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            white-space: pre-wrap;
            font-family: Georgia, serif;
            line-height: 1.8;
          }
          .footer {
            background: #e9ecef;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .priority-high {
            background: #dc3545;
            color: white;
          }
          .priority-normal {
            background: #fdb827;
            color: #212529;
          }
          .contact-link {
            color: #007bff;
            text-decoration: none;
          }
          .contact-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${this.locale === 'en' ? 'New Contact Form Submission' : 'Nueva Consulta de Contacto'}</h1>
            <p>${this.locale === 'en' ? 'Yanghua Cable Website' : 'Sitio Web de Yanghua Cable'}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>${this.locale === 'en' ? 'Contact Information' : 'Información de Contacto'}</h2>
              <table class="info-table">
                <tr>
                  <td>${this.locale === 'en' ? 'Name' : 'Nombre'}</td>
                  <td>${data.name}</td>
                </tr>
                <tr>
                  <td>${this.locale === 'en' ? 'Email' : 'Correo Electrónico'}</td>
                  <td><a href="mailto:${data.email}" class="contact-link">${data.email}</a></td>
                </tr>
                <tr>
                  <td>${this.locale === 'en' ? 'Company' : 'Empresa'}</td>
                  <td>${data.company}</td>
                </tr>
                <tr>
                  <td>${this.locale === 'en' ? 'Country' : 'País'}</td>
                  <td>${data.country}</td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td>${this.locale === 'en' ? 'Phone' : 'Teléfono'}</td>
                  <td><a href="tel:${data.phone}" class="contact-link">${data.phone}</a></td>
                </tr>
                ` : ''}
                <tr>
                  <td>${this.locale === 'en' ? 'Subject' : 'Asunto'}</td>
                  <td>
                    ${translatedSubject}
                    <span class="priority-badge priority-normal">${this.locale === 'en' ? 'Normal Priority' : 'Prioridad Normal'}</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h2>${this.locale === 'en' ? 'Message Content' : 'Contenido del Mensaje'}</h2>
              <div class="message-content">${data.message}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>
              ${this.locale === 'en' 
                ? `This email was automatically sent from the Yanghua Cable website contact form on ${formattedDate}`
                : `Este correo fue enviado automáticamente desde el formulario de contacto del sitio web de Yanghua Cable el ${formattedDate}`
              }
            </p>
            <p>
              ${this.locale === 'en' 
                ? 'Please respond within 24 hours for optimal customer service.'
                : 'Por favor responda dentro de 24 horas para un servicio al cliente óptimo.'
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${this.locale === 'en' ? 'NEW CONTACT FORM SUBMISSION' : 'NUEVA CONSULTA DE CONTACTO'}
${this.locale === 'en' ? 'Yanghua Cable Website' : 'Sitio Web de Yanghua Cable'}

${this.locale === 'en' ? 'CONTACT INFORMATION:' : 'INFORMACIÓN DE CONTACTO:'}
${this.locale === 'en' ? 'Name:' : 'Nombre:'} ${data.name}
${this.locale === 'en' ? 'Email:' : 'Correo Electrónico:'} ${data.email}
${this.locale === 'en' ? 'Company:' : 'Empresa:'} ${data.company}
${this.locale === 'en' ? 'Country:' : 'País:'} ${data.country}
${data.phone ? `${this.locale === 'en' ? 'Phone:' : 'Teléfono:'} ${data.phone}` : ''}
${this.locale === 'en' ? 'Subject:' : 'Asunto:'} ${translatedSubject}

${this.locale === 'en' ? 'MESSAGE CONTENT:' : 'CONTENIDO DEL MENSAJE:'}
${data.message}

${this.locale === 'en' 
  ? `Sent on: ${formattedDate}`
  : `Enviado el: ${formattedDate}`
}

${this.locale === 'en' 
  ? 'Please respond within 24 hours for optimal customer service.'
  : 'Por favor responda dentro de 24 horas para un servicio al cliente óptimo.'
}
    `;

    return { subject, html, text };
  }

  /**
   * 渲染询盘表单邮件模板
   */
  async renderInquiryFormTemplate(data: EmailTemplateData['inquiryForm']): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    if (!data) {
      throw new Error('Inquiry form data is required');
    }

    const formattedDate = this.formatDate(new Date(), this.locale);

    // 产品兴趣翻译映射
    const productMap: Record<string, Record<string, string>> = {
      en: {
        'Flexible Busbar': 'Flexible Busbar',
        'Busbar Connector': 'Busbar Connector',
        'Custom Solutions': 'Custom Solutions',
        'Other': 'Other'
      },
      es: {
        'Flexible Busbar': 'Barra Flexible',
        'Busbar Connector': 'Conector de Barra',
        'Custom Solutions': 'Soluciones Personalizadas',
        'Other': 'Otro'
      }
    };

    const translatedProduct = data.productInterest 
      ? (productMap[this.locale]?.[data.productInterest] || data.productInterest)
      : '';

    const subject = `${this.locale === 'en' ? 'New Product Inquiry' : 'Nueva Consulta de Producto'} - ${data.company}${translatedProduct ? ` - ${translatedProduct}` : ''}`;

    const html = `
      <!DOCTYPE html>
      <html lang="${this.locale}" dir="${this.locale === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #212529 0%, #343a40 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #212529;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #fdb827;
            font-size: 20px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
          }
          .info-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e9ecef;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #495057;
            width: 30%;
            background: #e9ecef;
          }
          .info-table tr:last-child td {
            border-bottom: none;
          }
          .message-content {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            white-space: pre-wrap;
            font-family: Georgia, serif;
            line-height: 1.8;
          }
          .footer {
            background: #e9ecef;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
          .product-badge {
            display: inline-block;
            background: #fdb827;
            color: #212529;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .contact-link {
            color: #007bff;
            text-decoration: none;
          }
          .contact-link:hover {
            text-decoration: underline;
          }
          .urgent-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${this.locale === 'en' ? 'New Product Inquiry' : 'Nueva Consulta de Producto'}</h1>
            <p>${this.locale === 'en' ? 'Yanghua Cable Website' : 'Sitio Web de Yanghua Cable'}</p>
          </div>
          
          <div class="content">
            <div class="urgent-notice">
              <strong>${this.locale === 'en' ? '⚡ Priority Inquiry' : '⚡ Consulta Prioritaria'}</strong><br>
              ${this.locale === 'en' 
                ? 'This is a product inquiry that requires prompt attention from the sales team.'
                : 'Esta es una consulta de producto que requiere atención inmediata del equipo de ventas.'
              }
            </div>
            
            <div class="section">
              <h2>${this.locale === 'en' ? 'Customer Information' : 'Información del Cliente'}</h2>
              <table class="info-table">
                <tr>
                  <td>${this.locale === 'en' ? 'Name' : 'Nombre'}</td>
                  <td>${data.name}</td>
                </tr>
                <tr>
                  <td>${this.locale === 'en' ? 'Email' : 'Correo Electrónico'}</td>
                  <td><a href="mailto:${data.email}" class="contact-link">${data.email}</a></td>
                </tr>
                <tr>
                  <td>${this.locale === 'en' ? 'Company' : 'Empresa'}</td>
                  <td>${data.company}</td>
                </tr>
                ${translatedProduct ? `
                <tr>
                  <td>${this.locale === 'en' ? 'Product Interest' : 'Interés en Producto'}</td>
                  <td>
                    <span class="product-badge">${translatedProduct}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div class="section">
              <h2>${this.locale === 'en' ? 'Inquiry Details' : 'Detalles de la Consulta'}</h2>
              <div class="message-content">${data.message}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>
              ${this.locale === 'en' 
                ? `This email was automatically sent from the Yanghua Cable website inquiry form on ${formattedDate}`
                : `Este correo fue enviado automáticamente desde el formulario de consulta del sitio web de Yanghua Cable el ${formattedDate}`
              }
            </p>
            <p>
              ${this.locale === 'en' 
                ? 'Recommended response time: Within 2 hours for product inquiries.'
                : 'Tiempo de respuesta recomendado: Dentro de 2 horas para consultas de productos.'
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${this.locale === 'en' ? 'NEW PRODUCT INQUIRY' : 'NUEVA CONSULTA DE PRODUCTO'}
${this.locale === 'en' ? 'Yanghua Cable Website' : 'Sitio Web de Yanghua Cable'}

⚡ ${this.locale === 'en' ? 'PRIORITY INQUIRY' : 'CONSULTA PRIORITARIA'}
${this.locale === 'en' 
  ? 'This is a product inquiry that requires prompt attention from the sales team.'
  : 'Esta es una consulta de producto que requiere atención inmediata del equipo de ventas.'
}

${this.locale === 'en' ? 'CUSTOMER INFORMATION:' : 'INFORMACIÓN DEL CLIENTE:'}
${this.locale === 'en' ? 'Name:' : 'Nombre:'} ${data.name}
${this.locale === 'en' ? 'Email:' : 'Correo Electrónico:'} ${data.email}
${this.locale === 'en' ? 'Company:' : 'Empresa:'} ${data.company}
${translatedProduct ? `${this.locale === 'en' ? 'Product Interest:' : 'Interés en Producto:'} ${translatedProduct}` : ''}

${this.locale === 'en' ? 'INQUIRY DETAILS:' : 'DETALLES DE LA CONSULTA:'}
${data.message}

${this.locale === 'en' 
  ? `Sent on: ${formattedDate}`
  : `Enviado el: ${formattedDate}`
}

${this.locale === 'en' 
  ? 'Recommended response time: Within 2 hours for product inquiries.'
  : 'Tiempo de respuesta recomendado: Dentro de 2 horas para consultas de productos.'
}
    `;

    return { subject, html, text };
  }

  /**
   * 渲染通知邮件模板
   */
  async renderNotificationTemplate(
    type: 'welcome' | 'confirmation' | 'reminder' | 'alert',
    data: TemplateVariables
  ): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    const formattedDate = this.formatDate(new Date(), this.locale);

    const templates = {
      welcome: {
        subject: this.locale === 'en' ? 'Welcome to Yanghua Cable' : 'Bienvenido a Yanghua Cable',
        title: this.locale === 'en' ? 'Welcome!' : '¡Bienvenido!',
        message: this.locale === 'en' 
          ? 'Thank you for your interest in our cable solutions.'
          : 'Gracias por su interés en nuestras soluciones de cables.'
      },
      confirmation: {
        subject: this.locale === 'en' ? 'Confirmation - Yanghua Cable' : 'Confirmación - Yanghua Cable',
        title: this.locale === 'en' ? 'Confirmed' : 'Confirmado',
        message: this.locale === 'en' 
          ? 'Your request has been confirmed and is being processed.'
          : 'Su solicitud ha sido confirmada y está siendo procesada.'
      },
      reminder: {
        subject: this.locale === 'en' ? 'Reminder - Yanghua Cable' : 'Recordatorio - Yanghua Cable',
        title: this.locale === 'en' ? 'Reminder' : 'Recordatorio',
        message: this.locale === 'en' 
          ? 'This is a friendly reminder about your inquiry.'
          : 'Este es un recordatorio amistoso sobre su consulta.'
      },
      alert: {
        subject: this.locale === 'en' ? 'Important Alert - Yanghua Cable' : 'Alerta Importante - Yanghua Cable',
        title: this.locale === 'en' ? 'Alert' : 'Alerta',
        message: this.locale === 'en' 
          ? 'Important information regarding your account.'
          : 'Información importante sobre su cuenta.'
      }
    };

    const template = templates[type];
    
    const html = `
      <!DOCTYPE html>
      <html lang="${this.locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #212529; color: white; padding: 20px; text-align: center;">
          <h1>${template.title}</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <p>${template.message}</p>
          <p>${this.locale === 'en' ? 'Date:' : 'Fecha:'} ${formattedDate}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
${template.title}

${template.message}

${this.locale === 'en' ? 'Date:' : 'Fecha:'} ${formattedDate}
    `;

    return {
      subject: template.subject,
      html,
      text
    };
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date, locale: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

/**
 * 预定义的邮件模板
 */
export const EMAIL_TEMPLATES = {
  CONTACT_FORM: 'contact_form',
  INQUIRY_FORM: 'inquiry_form',
  WELCOME: 'welcome',
  CONFIRMATION: 'confirmation',
  REMINDER: 'reminder',
  ALERT: 'alert',
} as const;

/**
 * 创建邮件模板渲染器
 */
export function createEmailTemplateRenderer(locale: string = 'en'): EmailTemplateRenderer {
  return new EmailTemplateRenderer(locale);
}

/**
 * 快速渲染联系表单邮件
 */
export async function renderContactFormEmail(
  data: EmailTemplateData['contactForm'],
  locale: string = 'en'
): Promise<{ subject: string; html: string; text: string }> {
  const renderer = new EmailTemplateRenderer(locale);
  return await renderer.renderContactFormTemplate(data);
}

/**
 * 快速渲染询盘表单邮件
 */
export async function renderInquiryFormEmail(
  data: EmailTemplateData['inquiryForm'],
  locale: string = 'en'
): Promise<{ subject: string; html: string; text: string }> {
  const renderer = new EmailTemplateRenderer(locale);
  return await renderer.renderInquiryFormTemplate(data);
}