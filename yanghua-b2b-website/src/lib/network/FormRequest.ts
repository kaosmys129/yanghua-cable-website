/**
 * 通用表单请求工具，统一处理：
 * - Headers（含 CSRF 与语言）
 * - credentials: 'include' 以携带同源 Cookie
 * - 防御性错误解析（非 JSON 响应时返回统一错误对象）
 * - 开发环境调试日志
 */

export interface FormRequestOptions {
  csrfToken?: string;
  locale?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
}

export interface FormRequestError {
  code?: string;
  message: string;
  errors?: any;
  debug?: any;
  raw?: string; // 非 JSON 响应的原始文本
}

export interface FormRequestResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: FormRequestError;
}

export async function sendForm<T = any>(
  url: string,
  body: any,
  options: FormRequestOptions = {}
): Promise<FormRequestResult<T>> {
  const method = options.method || 'POST';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.locale) {
    headers['Accept-Language'] = options.locale;
  }
  if (options.csrfToken) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  // 调试日志（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('[FormRequest] sending:', { url, method, headers, body });
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || '';
    let payload: any = null;

    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (jsonErr) {
        // JSON 解析失败，作为语法错误处理
        if (process.env.NODE_ENV === 'development') {
          console.error('[FormRequest] JSON parse error:', jsonErr);
        }
        return {
          ok: false,
          status: response.status,
          error: {
            code: 'JSON_PARSE_ERROR',
            message: options.locale === 'en'
              ? 'Failed to parse server response.'
              : 'No se pudo analizar la respuesta del servidor.',
          },
        };
      }
    } else {
      // 非 JSON 响应，读取文本并返回统一错误对象
      const text = await response.text();
      if (process.env.NODE_ENV === 'development') {
        console.error('[FormRequest] Non-JSON response:', text);
      }
      return {
        ok: false,
        status: response.status,
        error: {
          code: 'UNEXPECTED_RESPONSE_FORMAT',
          message: options.locale === 'en'
            ? 'Server returned an unexpected response. Please try again later.'
            : 'El servidor devolvió una respuesta inesperada. Por favor, inténtalo de nuevo más tarde.',
          raw: text,
        },
      };
    }

    // 根据 payload 的 success 字段判断
    if (response.ok && payload?.success) {
      return {
        ok: true,
        status: response.status,
        data: payload,
      };
    }

    // 失败：提取错误信息
    const error: FormRequestError = {
      code: payload?.code,
      message: payload?.error || (options.locale === 'en'
        ? 'Request failed.'
        : 'La solicitud falló.'),
      errors: payload?.errors,
      debug: payload?.debug,
    };

    // 调试日志（开发环境）
    if (process.env.NODE_ENV === 'development' && error.debug) {
      console.error('[FormRequest] API debug:', error.debug);
    }

    return {
      ok: false,
      status: response.status,
      error,
    };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[FormRequest] network error:', err);
    }
    const isFetchTypeError = err instanceof TypeError && err.message?.includes('fetch');
    const message = isFetchTypeError
      ? (options.locale === 'en'
          ? 'Unable to connect to server. Please check your internet connection.'
          : 'No se puede conectar al servidor. Por favor verifique su conexión a internet.')
      : (options.locale === 'en'
          ? 'Network error. Please try again.'
          : 'Error de red. Por favor, inténtelo de nuevo.');

    return {
      ok: false,
      status: 0,
      error: {
        code: 'NETWORK_ERROR',
        message,
      },
    };
  }
}