import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';

// Declare jest for TypeScript when it might not be available
declare const jest: any;

// Mock messages for testing
const mockMessages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    reset: 'Reset',
    submit: 'Submit',
    send: 'Send',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    share: 'Share',
    copy: 'Copy',
    print: 'Print',
    export: 'Export',
    import: 'Import',
  },
  navigation: {
    home: 'Home',
    about: 'About',
    products: 'Products',
    services: 'Services',
    contact: 'Contact',
    blog: 'Blog',
    news: 'News',
    careers: 'Careers',
    support: 'Support',
  },
  products: {
    title: 'Products',
    description: 'Our product catalog',
    category: 'Category',
    price: 'Price',
    availability: 'Availability',
    specifications: 'Specifications',
    features: 'Features',
    applications: 'Applications',
    downloads: 'Downloads',
    inquiry: 'Send Inquiry',
    quote: 'Request Quote',
  },
  company: {
    name: 'Yanghua Cable',
    description: 'Leading cable manufacturer',
    established: 'Established',
    employees: 'Employees',
    facilities: 'Facilities',
    certifications: 'Certifications',
    awards: 'Awards',
    mission: 'Mission',
    vision: 'Vision',
    values: 'Values',
  },
  contact: {
    title: 'Contact Us',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    hours: 'Business Hours',
    form: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      subject: 'Subject',
      message: 'Message',
      send: 'Send Message',
      success: 'Message sent successfully',
      error: 'Failed to send message',
    },
  },
};

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  locale?: string;
  messages?: any;
  theme?: string;
}

const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  locale = 'en',
  messages = mockMessages,
  theme = 'light',
}) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false}
        disableTransitionOnChange
      >
        {children as any}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
  messages?: any;
  theme?: string;
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { locale, messages, theme, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProviders locale={locale} messages={messages} theme={theme}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data generators
export const mockProduct = {
  id: '1',
  name: 'Test Cable',
  category: 'Power Cable',
  description: 'Test cable description',
  specifications: {
    voltage: '1kV',
    conductor: 'Copper',
    insulation: 'XLPE',
    sheath: 'PVC',
  },
  features: ['Feature 1', 'Feature 2'],
  applications: ['Application 1', 'Application 2'],
  images: ['/test-image.jpg'],
  documents: ['/test-document.pdf'],
  price: {
    currency: 'USD',
    value: 100,
    unit: 'meter',
  },
  availability: 'In Stock',
  leadTime: '2-3 weeks',
  minimumOrder: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCompany = {
  name: 'Yanghua Cable Co., Ltd.',
  description: 'Leading cable manufacturer',
  established: '1995',
  employees: '500+',
  facilities: ['Factory 1', 'Factory 2'],
  certifications: ['ISO 9001', 'ISO 14001'],
  awards: ['Award 1', 'Award 2'],
  contact: {
    address: '123 Test Street, Test City',
    phone: '+86-123-456-7890',
    email: 'info@yanghuacable.com',
    website: 'https://yanghuacable.com',
  },
  socialMedia: {
    linkedin: 'https://linkedin.com/company/yanghua',
    twitter: 'https://twitter.com/yanghua',
    facebook: 'https://facebook.com/yanghua',
  },
};

export const mockNews = {
  id: '1',
  title: 'Test News Article',
  excerpt: 'Test news excerpt',
  content: 'Test news content',
  author: 'Test Author',
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: 'Company News',
  tags: ['tag1', 'tag2'],
  image: '/test-news-image.jpg',
  slug: 'test-news-article',
  featured: false,
  status: 'published',
};

// Test utilities
export const testUtils = {
  // Wait for element to appear
  waitForElement: async (getByTestId: any, testId: string, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const element = getByTestId(testId);
          if (element) {
            resolve(element);
          } else {
            throw new Error('Element not found');
          }
        } catch (error) {
          if (Date.now() - startTime >= timeout) {
            reject(new Error(`Element with testId "${testId}" not found within ${timeout}ms`));
          } else {
            setTimeout(check, 10);
          }
        }
      };
      check();
    });
  },

  // Simulate user interaction delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock API response
  mockApiResponse: (data: any, status = 200, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }, delay);
    });
  },

  // Mock fetch
  mockFetch: (responses: Array<{ url: string; response: any; status?: number }>) => {
    const originalFetch = global.fetch;
    const mockFn = typeof jest !== 'undefined' 
      ? jest.fn().mockImplementation((url: string) => {
          const mockResponse = responses.find(r => url.includes(r.url));
          if (mockResponse) {
            return testUtils.mockApiResponse(mockResponse.response, mockResponse.status);
          }
          return Promise.reject(new Error(`No mock response found for ${url}`));
        })
      : ((url: string) => {
          const mockResponse = responses.find(r => url.includes(r.url));
          if (mockResponse) {
            return testUtils.mockApiResponse(mockResponse.response, mockResponse.status);
          }
          return Promise.reject(new Error(`No mock response found for ${url}`));
        }) as any;
    global.fetch = mockFn;
    return () => {
      global.fetch = originalFetch;
    };
  },

  // Create mock intersection observer entry
  createMockIntersectionObserverEntry: (isIntersecting = true) => ({
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    target: document.createElement('div'),
    boundingClientRect: {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    },
    intersectionRect: {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    },
    rootBounds: null,
    time: Date.now(),
  }),
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };
export { TestProviders, mockMessages };