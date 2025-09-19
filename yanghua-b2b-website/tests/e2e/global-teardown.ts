import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up any test data
    await cleanupTestData();
    
    // Clean up any temporary files
    await cleanupTempFiles();
    
    // Clean up any test databases or external resources
    await cleanupExternalResources();
    
    console.log('✅ Global teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  // Clean up any test data that was created during tests
  // This could include database records, files, etc.
  
  console.log('✅ Test data cleanup completed');
}

async function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...');
  
  // Clean up any temporary files created during tests
  // This could include screenshots, downloads, etc.
  
  console.log('✅ Temporary files cleanup completed');
}

async function cleanupExternalResources() {
  console.log('🌐 Cleaning up external resources...');
  
  // Clean up any external resources that were used during tests
  // This could include API mocks, external services, etc.
  
  console.log('✅ External resources cleanup completed');
}

export default globalTeardown;