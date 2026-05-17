'use client';

import React from 'react';
import { Card, CardContent } from './card';

interface SimpleVisualProps {
  visualData: {
    type: string;
    data?: {
      description?: string;
      svgContent?: string;
      mermaidCode?: string;
      cssVisual?: string;
    };
  };
  title?: string;
}

export function SimpleVisual({ visualData, title }: SimpleVisualProps) {
  const { type, data } = visualData;

  const renderVisual = () => {
    if (!data) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border p-4">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-700 text-sm">Visual content</p>
          </div>
        </div>
      );
    }

    if (data.svgContent) {
      return (
        <div 
          className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border"
          dangerouslySetInnerHTML={{ __html: data.svgContent }}
        />
      );
    }

    if (data.mermaidCode) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {data.mermaidCode}
          </pre>
        </div>
      );
    }

    if (data.cssVisual) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border p-4">
          <div 
            className="w-full h-full"
            style={{ 
              // Apply the CSS visual styles
              ...JSON.parse(data.cssVisual || '{}')
            }}
          />
        </div>
      );
    }

    // Fallback: show description as text
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-700 text-sm">{data.description || 'Visual content'}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      {title && (
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
      )}
      <CardContent className="p-4">
        {renderVisual()}
        {data?.description && (
          <p className="text-sm text-gray-600 mt-3 text-center">
            {data.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mermaid diagram component (requires mermaid library)
export function MermaidDiagram({ code }: { code: string }) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Dynamically import mermaid if available
    const loadMermaid = async () => {
      try {
        const mermaid = await import('mermaid');
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
        });
        setIsLoaded(true);
      } catch (error) {
        console.log('Mermaid not available, showing code instead');
        setIsLoaded(false);
      }
    };

    loadMermaid();
  }, []);

  if (isLoaded) {
    return (
      <div className="mermaid w-full h-64 flex items-center justify-center">
        {code}
      </div>
    );
  }

  // Fallback to showing the code
  return (
    <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border p-4">
      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
        {code}
      </pre>
    </div>
  );
}

// CSS Visual component
export function CSSVisual({ cssCode }: { cssCode: string }) {
  const [styles, setStyles] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    try {
      // Parse CSS code and convert to inline styles
      const parsedStyles = JSON.parse(cssCode);
      setStyles(parsedStyles);
    } catch (error) {
      console.error('Error parsing CSS visual:', error);
      setStyles({});
    }
  }, [cssCode]);

  return (
    <div 
      className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border"
      style={styles}
    >
      <div className="text-center text-gray-600">
        CSS Visual
      </div>
    </div>
  );
}
