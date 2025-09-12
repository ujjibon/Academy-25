#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps set up environment variables for Academy 2025
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Hugging Face Configuration
HUGGINGFACE_API_TOKEN=hf_your_key_here

# DeepSeek AI Service Configuration
NEXT_PUBLIC_DEEPSEEK_SERVICE_URL=http://localhost:5000

# Firebase Configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Other environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env.local');

console.log('🚀 Setting up environment variables for Academy 2025...\n');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('📝 Current content:');
  console.log('─'.repeat(50));
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('─'.repeat(50));
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      writeEnvFile();
    } else {
      console.log('✅ Keeping existing .env.local file');
      console.log('💡 You can manually update it with the new Hugging Face token if needed');
    }
    rl.close();
  });
} else {
  writeEnvFile();
}

function writeEnvFile() {
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Successfully created .env.local file!');
    console.log('🔑 Hugging Face token has been added');
    console.log('📋 Next steps:');
    console.log('   1. Update Firebase configuration with your actual values');
    console.log('   2. Restart your development server (npm run dev)');
    console.log('   3. Test the enhanced AI features');
    console.log('\n🎉 Environment setup complete!');
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
    console.log('\n📝 Please manually create .env.local with the following content:');
    console.log('─'.repeat(50));
    console.log(envContent);
    console.log('─'.repeat(50));
  }
}
