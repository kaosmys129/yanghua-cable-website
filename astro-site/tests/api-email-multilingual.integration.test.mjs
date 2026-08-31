import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { after, before, test } from 'node:test';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const appPort = 4322;
const baseURL = `http://127.0.0.1:${appPort}`;
const csrfSecret = 'local-multilingual-email-test-secret-32-chars';

const locales = [
  {
    locale: 'en',
    page: '/en/contact',
    responseMessage: 'Email sent successfully',
    inquiryHeadline: 'New Product Inquiry',
  },
  {
    locale: 'es',
    page: '/es/contacto',
    responseMessage: 'Correo enviado exitosamente',
    inquiryHeadline: 'Nueva Consulta de Producto',
  },
  {
    locale: 'pt',
    page: '/pt/contato',
    responseMessage: 'E-mail enviado com sucesso',
    inquiryHeadline: 'Nova Consulta de Produto',
  },
];

let appProcess;
let smtpServer;
let smtpPort;
const appLogs = [];
const smtpTrace = [];
const smtpMessages = [];
let requestIndex = 0;

function createSmtpServer() {
  return net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    let message = '';

    socket.setEncoding('utf8');
    socket.write('220 local-test-smtp ESMTP\r\n');
    smtpTrace.push('S: 220');

    socket.on('data', (chunk) => {
      smtpTrace.push(`C: ${String(chunk).replace(/\r?\n/g, '|').slice(0, 500)}`);
      buffer += chunk;

      while (buffer) {
        if (inData) {
          const terminator = buffer.match(/\r?\n\.\r?\n/);
          if (!terminator || terminator.index === undefined) {
            const safeLength = Math.max(0, buffer.length - 4);
            message += buffer.slice(0, safeLength);
            buffer = buffer.slice(safeLength);
            break;
          }

          message += buffer.slice(0, terminator.index);
          buffer = buffer.slice(terminator.index + terminator[0].length);
          smtpMessages.push(message);
          message = '';
          inData = false;
          socket.write('250 2.0.0 queued\r\n');
          smtpTrace.push('S: 250 queued');
          continue;
        }

        const lineEnd = buffer.indexOf('\r\n');
        if (lineEnd === -1) break;

        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        const command = line.toUpperCase();

        if (command.startsWith('EHLO')) {
          socket.write('250-local-test-smtp\r\n250-PIPELINING\r\n250 8BITMIME\r\n');
          smtpTrace.push('S: 250 EHLO');
        } else if (command.startsWith('HELO')) {
          socket.write('250 local-test-smtp\r\n');
          smtpTrace.push('S: 250 HELO');
        } else if (command.startsWith('MAIL FROM') || command.startsWith('RCPT TO')) {
          socket.write('250 2.1.0 OK\r\n');
          smtpTrace.push('S: 250 envelope');
        } else if (command === 'DATA') {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
          smtpTrace.push('S: 354 DATA');
        } else if (command === 'QUIT') {
          socket.write('221 2.0.0 Bye\r\n');
          smtpTrace.push('S: 221 QUIT');
          socket.end();
        } else {
          socket.write('250 OK\r\n');
        }
      }
    });
  });
}

async function waitForApp() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/api/csrf`);
      if (response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Local Astro server did not start in time');
}

async function getCsrfCookie() {
  const response = await fetch(`${baseURL}/api/csrf`, { signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie, 'CSRF endpoint must set a cookie');
  return setCookie.split(';', 1)[0];
}

async function sendInquiry({ locale, type }) {
  const cookie = await getCsrfCookie();
  requestIndex += 1;
  let response;
  try {
    response = await fetch(`${baseURL}/api/email/send`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
        'X-Forwarded-For': `198.51.100.${requestIndex}`,
        Cookie: cookie,
      },
      body: JSON.stringify(
        type === 'inquiry'
          ? {
              type,
              locale,
              name: `TDD ${locale} inquiry`,
              email: 'tdd@example.com',
              company: '',
              productInterest: 'Flexible Busbar',
              message: `Multilingual ${locale} inquiry test.`,
            }
          : {
              type,
              locale,
              name: `TDD ${locale} contact`,
              email: 'tdd@example.com',
              company: '',
              country: 'CN',
              phone: '+86 13800000000',
              subject: 'productInquiry',
              message: `Multilingual ${locale} contact test.`,
            },
      ),
    });
  } catch (error) {
    throw new Error(
      `${locale} ${type}: ${error instanceof Error ? error.message : String(error)}\nSMTP: ${smtpTrace.join(' || ')}\nApp: ${appLogs.join('')}`,
    );
  }

  const body = await response.json();
  return { response, body };
}

async function sendSubscription({ locale }) {
  const cookie = await getCsrfCookie();
  requestIndex += 1;
  const response = await fetch(`${baseURL}/api/email/send`, {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      'X-Forwarded-For': `198.51.100.${requestIndex}`,
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: 'subscribe',
      locale,
      email: `newsletter-${locale}@example.com`,
    }),
  });
  const body = await response.json();
  return { response, body };
}

async function waitForMessages(count) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (smtpMessages.length >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Expected ${count} SMTP messages, received ${smtpMessages.length}`);
}

before(async () => {
  smtpServer = createSmtpServer();
  smtpServer.listen(0, '127.0.0.1');
  await once(smtpServer, 'listening');
  smtpPort = smtpServer.address().port;

  appProcess = spawn('pnpm', ['run', 'dev', '--host', '127.0.0.1', '--port', String(appPort)], {
    cwd: siteRoot,
    env: {
      ...process.env,
      CSRF_SECRET: csrfSecret,
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(smtpPort),
      SMTP_SECURE: 'false',
      SMTP_USER: '',
      SMTP_PASS: '',
      EMAIL_FROM: 'noreply@example.com',
      EMAIL_FROM_NAME: 'Yanghua TDD Test',
      CONTACT_EMAIL: 'contact-test@example.com',
      INQUIRY_EMAIL: 'inquiry-test@example.com',
      EMAIL_RETRY_ATTEMPTS: '1',
      EMAIL_RETRY_DELAY_MS: '10',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  appProcess.stdout.on('data', (chunk) => appLogs.push(String(chunk)));
  appProcess.stderr.on('data', (chunk) => appLogs.push(String(chunk)));

  await waitForApp();
});

after(async () => {
  if (appProcess && !appProcess.killed) {
    appProcess.kill('SIGTERM');
    await once(appProcess, 'exit').catch(() => {});
  }
  if (smtpServer) {
    smtpServer.close();
    await once(smtpServer, 'close').catch(() => {});
  }
});

test('all supported contact pages expose a localized form', async () => {
  for (const item of locales) {
    const response = await fetch(`${baseURL}${item.page}`);
    const html = await response.text();
    assert.equal(response.status, 200, item.page);
    assert.match(html, /id="contact-form"/);
    assert.match(html, new RegExp(`<html lang="${item.locale}"`));
  }
});

test('contact and product inquiry send successfully in every supported locale', async () => {
  for (const item of locales) {
    const contact = await sendInquiry({ locale: item.locale, type: 'contact' });
    assert.equal(contact.response.status, 200, `${item.locale} contact status`);
    assert.equal(contact.body.success, true, `${item.locale} contact success`);
    assert.equal(contact.body.message, item.responseMessage, `${item.locale} contact message`);

    const inquiry = await sendInquiry({ locale: item.locale, type: 'inquiry' });
    assert.equal(inquiry.response.status, 200, `${item.locale} inquiry status`);
    assert.equal(inquiry.body.success, true, `${item.locale} inquiry success`);
    assert.equal(inquiry.body.message, item.responseMessage, `${item.locale} inquiry message`);
  }

  await waitForMessages(locales.length * 2);
  const latestMessages = smtpMessages.slice(-locales.length * 2);
  assert.ok(latestMessages.some((message) => message.includes('New Product Inquiry')));
  assert.ok(latestMessages.some((message) => message.includes('Nueva Consulta de Producto')));
  assert.ok(latestMessages.some((message) => message.includes('Nova Consulta de Produto')));
});

test('newsletter subscriptions send successfully in every supported locale', async () => {
  for (const item of locales) {
    const subscription = await sendSubscription({ locale: item.locale });
    assert.equal(subscription.response.status, 200, `${item.locale} subscription status`);
    assert.equal(subscription.body.success, true, `${item.locale} subscription success`);
    assert.equal(subscription.body.message, item.responseMessage, `${item.locale} subscription message`);
  }

  await waitForMessages(locales.length * 3);
  const latestMessages = smtpMessages.slice(-locales.length * 3);
  assert.ok(latestMessages.some((message) => message.includes('New Newsletter Subscription')));
  assert.ok(latestMessages.some((message) => message.includes('newsletter-es@example.com') && message.includes('Nueva')));
  assert.ok(latestMessages.some((message) => message.includes('newsletter-pt@example.com') && message.includes('Nova')));
});
