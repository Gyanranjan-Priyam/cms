#!/usr/bin/env node

/**
 * Setup script for CMS environment configuration
 * This script helps users set up their environment variables safely
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 CMS Environment Setup\n');

// Generate secure secrets
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Backend environment setup
const setupBackendEnv = () => {
  const backendEnvPath = path.join(__dirname, '.env');
  const backendExamplePath = path.join(__dirname, '.env.example');
  
  if (fs.existsSync(backendEnvPath)) {
    console.log('⚠️  Backend .env file already exists. Skipping backend setup.');
    return;
  }
  
  if (!fs.existsSync(backendExamplePath)) {
    console.error('❌ Backend .env.example file not found!');
    return;
  }
  
  let envContent = fs.readFileSync(backendExamplePath, 'utf8');
  
  // Replace placeholder secrets with generated ones
  envContent = envContent.replace(
    'your_super_secure_jwt_secret_key_here_minimum_32_characters',
    generateSecret(32)
  );
  envContent = envContent.replace(
    'your_refresh_token_secret_key_here_also_32_plus_characters',
    generateSecret(32)
  );
  envContent = envContent.replace(
    'another_secure_session_secret_key',
    generateSecret(24)
  );
  
  fs.writeFileSync(backendEnvPath, envContent);
  console.log('✅ Backend .env file created with secure secrets generated');
  console.log('📝 Please edit backend/.env and add your actual API keys and database URI');
};

// Frontend environment setup
const setupFrontendEnv = () => {
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  const frontendExamplePath = path.join(__dirname, '../frontend/.env.example');
  
  if (fs.existsSync(frontendEnvPath)) {
    console.log('⚠️  Frontend .env file already exists. Skipping frontend setup.');
    return;
  }
  
  if (!fs.existsSync(frontendExamplePath)) {
    console.error('❌ Frontend .env.example file not found!');
    return;
  }
  
  const envContent = fs.readFileSync(frontendExamplePath, 'utf8');
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log('✅ Frontend .env file created');
  console.log('📝 Please edit frontend/.env and add your actual API URL and public keys');
};

// Security reminders
const showSecurityReminders = () => {
  console.log('\n🔒 SECURITY REMINDERS:');
  console.log('1. Never commit .env files to version control');
  console.log('2. Use different API keys for development/staging/production');
  console.log('3. Rotate your API keys regularly');
  console.log('4. Only use PUBLIC keys in the frontend environment');
  console.log('5. Keep your SECRET keys secure and never expose them');
  console.log('\n📚 Read SECURITY.md for detailed security guidelines');
};

// Required environment variables checklist
const showRequiredVars = () => {
  console.log('\n📋 REQUIRED ENVIRONMENT VARIABLES:');
  console.log('\nBackend (.env):');
  console.log('✓ MONGODB_URI - Your MongoDB connection string');
  console.log('✓ RAZORPAY_KEY_ID - Your Razorpay public key');
  console.log('✓ RAZORPAY_KEY_SECRET - Your Razorpay secret key');
  console.log('✓ JWT_SECRET - Generated automatically ✅');
  
  console.log('\nFrontend (.env):');
  console.log('✓ VITE_API_URL - Your backend API URL');
  console.log('✓ VITE_RAZORPAY_KEY_ID - Your Razorpay public key (same as backend)');
  
  console.log('\nOptional but recommended:');
  console.log('- CASHFREE_APP_ID & CASHFREE_SECRET_KEY');
  console.log('- RAZORPAY_WEBHOOK_SECRET');
  console.log('- SMTP configuration for email notifications');
};

// Main setup function
const main = () => {
  console.log('Setting up environment files...\n');
  
  setupBackendEnv();
  setupFrontendEnv();
  
  showRequiredVars();
  showSecurityReminders();
  
  console.log('\n🚀 Setup complete! Next steps:');
  console.log('1. Fill in your actual API keys in the .env files');
  console.log('2. Start backend: cd backend && npm start');
  console.log('3. Start frontend: cd frontend && npm run dev');
  console.log('\n📖 Check README.md for detailed setup instructions');
};

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  setupBackendEnv,
  setupFrontendEnv,
  generateSecret
};
