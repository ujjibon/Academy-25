'use client';

import React from 'react';
import { Card, CardContent } from './card';

interface SimpleVisualProps {
  visualData: {
    type: string;
    url?: string;
    data?: {
      description?: string;
      svgContent?: string;
      mermaidCode?: string;
      cssVisual?: string;
      imageDataUrl?: string;
    };
  };
  title?: string;
}

export function SimpleVisual({ visualData, title }: SimpleVisualProps) {
  const { type, data, url } = visualData;
  const imageSrc = data?.imageDataUrl || (url?.startsWith('data:') || url?.startsWith('http') ? url : undefined);

  const renderVisual = () => {
    if (imageSrc) {
      return (
        <div className="w-full flex items-center justify-center rounded-lg border bg-muted/30 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={data?.description || title || 'Generated visual'}
            className="max-h-80 w-full object-contain"
          />
        </div>
      );
    }

    if (!data) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border p-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm capitalize">{type || 'Visual'} content</p>
          </div>
        </div>
      );
    }

    if (data.svgContent) {
      return (
        <div
          className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border overflow-auto"
          dangerouslySetInnerHTML={{ __html: data.svgContent }}
        />
      );
    }

    if (data.mermaidCode) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border p-4 overflow-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {data.mermaidCode}
          </pre>
        </div>
      );
    }

    if (data.cssVisual) {
      try {
        const styles = JSON.parse(data.cssVisual || '{}') as React.CSSProperties;
        return (
          <div className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border p-4">
            <div className="w-full h-full" style={styles} />
          </div>
        );
      } catch {
        // fall through
      }
    }

    return (
      <div className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {data.description || 'Visual content'}
          </p>
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
        {data?.description && !imageSrc && (
          <p className="text-sm text-muted-foreground mt-3 text-center">
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
    const loadMermaid = async () => {
      try {
        const mermaid = await import('mermaid');
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
        });
        setIsLoaded(true);
      } catch {
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

  return (
    <div className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border p-4">
      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
        {code}
      </pre>
    </div>
  );
}

export function CSSVisual({ cssCode }: { cssCode: string }) {
  const [styles, setStyles] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    try {
      setStyles(JSON.parse(cssCode));
    } catch {
      setStyles({});
    }
  }, [cssCode]);

  return (
    <div
      className="w-full h-64 flex items-center justify-center bg-muted/40 rounded-lg border"
      style={styles}
    >
      <div className="text-center text-muted-foreground">CSS Visual</div>
    </div>
  );
}
