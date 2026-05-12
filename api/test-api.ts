import 'dotenv/config';
import express from 'express';
import { supabaseAdmin } from '../lib/supabase/server';
import { SupabaseService } from '../lib/supabase/service';
import { GenerationOrchestrator } from '../lib/gemini';
import apiApp from './index';

// Mocking dependencies for testing
const mockUser = { id: 'test-user-123' };
const mockProject = { id: 'test-project-456' };

// We override methods using simple reassignment for testing
supabaseAdmin.auth.getUser = async (token: string) => {
  if (token === 'valid-token') {
    return { data: { user: mockUser }, error: null } as any;
  }
  return { data: { user: null }, error: new Error('Invalid token') } as any;
};

SupabaseService.createProject = async (userId: string, prompt: string) => {
  return mockProject as any;
};

// Mock orchestrator to not actually run LLM
GenerationOrchestrator.prototype.generateAll = async () => {
  console.log('[Mock Orchestrator] generateAll called');
  return mockProject.id;
};

const app = express();
app.use(apiApp);

const PORT = 3001;
const server = app.listen(PORT, async () => {
  console.log(`🧪 API Test Server running on port ${PORT}`);

  try {
    console.log('\n📝 Test 1: Unauthenticated request returns 401');
    const res1 = await fetch(`http://localhost:${PORT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appIdea: 'Test app', userId: mockUser.id })
    });
    console.log('Status:', res1.status);
    console.log('Response:', await res1.json());
    if (res1.status !== 401) throw new Error('Expected 401');

    console.log('\n📝 Test 2: Invalid appIdea returns 400');
    const res2 = await fetch(`http://localhost:${PORT}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({ appIdea: '', userId: mockUser.id })
    });
    console.log('Status:', res2.status);
    console.log('Response:', await res2.json());
    if (res2.status !== 400) throw new Error('Expected 400');

    console.log('\n📝 Test 3: Authenticated request succeeds & returns projectId');
    const res3 = await fetch(`http://localhost:${PORT}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({ appIdea: 'A cool test app', userId: mockUser.id })
    });
    console.log('Status:', res3.status);
    const data3 = await res3.json();
    console.log('Response:', data3);
    if (res3.status !== 200 || !data3.success || data3.projectId !== mockProject.id) {
      throw new Error('Expected 200 and success with correct projectId');
    }

    console.log('\n🎉 All API tests passed!');
  } catch (err: any) {
    console.error('\n❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
