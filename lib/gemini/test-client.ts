/**
 * Manual test script for MiniMaxClient
 * Run with: npx tsx lib/minimax/test-client.ts
 */

import 'dotenv/config';
import { MiniMaxClient } from './client';

async function testMiniMaxClient() {
  console.log('🧪 Testing MiniMaxClient...\n');

  try {
    // Initialize client
    const client = new MiniMaxClient();
    console.log('✅ Client initialized successfully\n');

    // Test 1: Generate Requirements
    console.log('📝 Test 1: Generating requirements...');
    const appIdea = 'A simple todo list app with user authentication';
    const requirements = await client.generateRequirements(appIdea);
    console.log('✅ Requirements generated successfully');
    console.log(`Length: ${requirements.length} characters`);
    console.log(`Preview: ${requirements.substring(0, 200)}...\n`);

    // Test 2: Generate Design
    console.log('🏗️  Test 2: Generating design...');
    const design = await client.generateDesign(appIdea, requirements);
    console.log('✅ Design generated successfully');
    console.log(`Length: ${design.length} characters`);
    console.log(`Preview: ${design.substring(0, 200)}...\n`);

    // Test 3: Generate Tasks
    console.log('📋 Test 3: Generating tasks...');
    const tasks = await client.generateTasks(appIdea, requirements, design);
    console.log('✅ Tasks generated successfully');
    console.log(`Length: ${tasks.length} characters`);
    console.log(`Preview: ${tasks.substring(0, 200)}...\n`);

    console.log('🎉 All tests passed!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testMiniMaxClient();
