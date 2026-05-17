import { openAIConfig } from '@/ai/genkit';

export interface VisualDescription {
  type: 'diagram' | 'chart' | 'infographic' | 'flowchart' | 'mindmap';
  title: string;
  description: string;
  elements: string[];
  layout: string;
  colors: string[];
}

export interface SimpleVisual {
  id: string;
  title: string;
  type: string;
  description: string;
  svgContent?: string;
  mermaidCode?: string;
  cssVisual?: string;
}

export class DeepSeekVisualGenerator {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = openAIConfig.apiKey || '';
    this.apiUrl = openAIConfig.apiUrl;
  }

  async generateSimpleVisual(
    topic: string,
    visualType: 'diagram' | 'chart' | 'infographic' | 'flowchart' | 'mindmap',
    context?: string
  ): Promise<SimpleVisual> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildVisualPrompt(topic, visualType, context);
    
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: openAIConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert visual designer who creates simple, clear educational visuals. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: openAIConfig.config.temperature,
          max_tokens: openAIConfig.config.max_tokens,
          top_p: openAIConfig.config.top_p,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      // Parse the JSON response
      const visualData = JSON.parse(content);
      
      return {
        id: `visual_${Date.now()}`,
        title: visualData.title || topic,
        type: visualType,
        description: visualData.description || '',
        svgContent: visualData.svgContent,
        mermaidCode: visualData.mermaidCode,
        cssVisual: visualData.cssVisual,
      };
    } catch (error) {
      console.error('Error generating visual with DeepSeek:', error);
      throw error;
    }
  }

  private buildVisualPrompt(
    topic: string,
    visualType: string,
    context?: string
  ): string {
    const basePrompt = `Create a simple, educational visual for the topic: "${topic}"

Visual Type: ${visualType}
${context ? `Context: ${context}` : ''}

Please respond with a JSON object containing:
{
  "title": "Clear, engaging title for the visual",
  "description": "Brief description of what the visual shows",
  "svgContent": "Simple SVG code for the visual (if applicable)",
  "mermaidCode": "Mermaid diagram code (if applicable)",
  "cssVisual": "CSS-based visual representation (if applicable)"
}

Guidelines:
- Keep it simple and educational
- Use clear, readable text
- Focus on key concepts
- Make it visually appealing but not cluttered
- Ensure the visual helps explain the topic clearly

Generate a ${visualType} that effectively illustrates "${topic}".`;

    return basePrompt;
  }

  // Generate Mermaid diagram code for flowcharts and diagrams
  async generateMermaidDiagram(
    topic: string,
    elements: string[],
    relationships: string[]
  ): Promise<string> {
    const prompt = `Create a Mermaid diagram for: "${topic}"

Elements: ${elements.join(', ')}
Relationships: ${relationships.join(', ')}

Generate clean, simple Mermaid code that shows the relationships between these elements. Use appropriate Mermaid syntax (flowchart, graph, etc.).`;

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: openAIConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at creating Mermaid diagrams. Always respond with clean, valid Mermaid code.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent code
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating Mermaid diagram:', error);
      throw error;
    }
  }

  // Generate simple CSS-based visual
  async generateCSSVisual(
    topic: string,
    data: any[]
  ): Promise<string> {
    const prompt = `Create a simple CSS-based visual representation for: "${topic}"

Data: ${JSON.stringify(data)}

Generate clean CSS code that creates a visual representation of this data. Use modern CSS features like flexbox, grid, or simple animations. Make it educational and easy to understand.`;

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: openAIConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert CSS developer who creates educational visuals. Always respond with clean, valid CSS code.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating CSS visual:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const deepSeekVisualGenerator = new DeepSeekVisualGenerator();
