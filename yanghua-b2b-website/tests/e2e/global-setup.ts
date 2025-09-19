import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`⏳ Waiting for server at ${baseURL}...`);
    
    // Try to connect to the server with retries
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.ok()) {
          console.log('✅ Server is ready!');
          break;
        }
      } catch (error) {
        console.log(`⏳ Server not ready, retrying... (${retries} attempts left)`);
        retries--;
        if (retries === 0) {
          throw new Error(`Server at ${baseURL} is not responding after multiple attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Perform any additional setup tasks
    await setupTestData(page);
    await setupAuthentication(page);
    
    console.log('✅ Global setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');
  
  // Clear any existing test data
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Set up mock data if needed
  await page.evaluate(() => {
    // Add any test data to localStorage/sessionStorage
    localStorage.setItem('test-setup', 'true');
  });
  
  console.log('✅ Test data setup completed');
}

async function setupAuthentication(page: any) {
  console.log('🔐 Setting up authentication...');
  
  // Set up any authentication tokens or cookies for testing
  // This is where you would log in a test user if needed
  
  console.log('✅ Authentication setup completed');
}

export default globalSetup;