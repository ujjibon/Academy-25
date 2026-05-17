import { NextRequest, NextResponse } from 'next/server';
import { ai, getOpenAIApiKey } from '@/ai/genkit';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Genkit configuration...');
    
    // Test basic AI functionality
    const result = await ai.generate({
      prompt: 'Say hello and confirm you are working',
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    
    console.log('Genkit test successful:', result.text);
    
    return NextResponse.json({
      success: true,
      message: 'Genkit is working correctly',
      response: result.text,
      hasApiKey: !!getOpenAIApiKey()
    });
  } catch (error) {
    console.error('Genkit test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      hasApiKey: !!getOpenAIApiKey(),
      apiKeyLength: getOpenAIApiKey()?.length || 0
    }, { status: 500 });
  }
}
