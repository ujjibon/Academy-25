'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CODE_LANGUAGE_LABELS,
  type CodeLanguage,
} from '@/lib/programming-course';
import { cn } from '@/lib/utils';
import { Copy, RotateCcw, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CodeWorkspaceProps = {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  starterCode?: string;
  enablePreview?: boolean;
  enableConsole?: boolean;
  readOnly?: boolean;
  className?: string;
};

export function CodeWorkspace({
  value,
  onChange,
  language,
  starterCode = '',
  enablePreview = false,
  enableConsole = false,
  readOnly = false,
  className,
}: CodeWorkspaceProps) {
  const { toast } = useToast();
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const seeded = useRef(false);
  const lineCount = useMemo(
    () => Math.max(1, value.split('\n').length),
    [value]
  );

  useEffect(() => {
    if (!seeded.current && !value && starterCode) {
      seeded.current = true;
      onChange(starterCode);
    }
  }, [starterCode, value, onChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }, [value, toast]);

  const handleReset = useCallback(() => {
    onChange(starterCode);
    setConsoleLines([]);
    toast({ title: 'Reset to starter code' });
  }, [onChange, starterCode, toast]);

  const handleRunPreview = useCallback(() => {
    if (language === 'html') {
      setConsoleLines(['Preview updated in the Preview tab.']);
      return;
    }
    if (language === 'css') {
      setConsoleLines(['CSS applied in the Preview tab.']);
      return;
    }
    setConsoleLines([
      '▶ Run',
      language === 'python'
        ? '(Python execution requires a backend runner — submit your code for AI review.)'
        : '(Live execution is not available in the browser — submit for AI feedback.)',
    ]);
  }, [language]);

  const previewSrcDoc = useMemo(() => {
    if (language === 'html') return value;
    if (language === 'css') {
      return `<!DOCTYPE html><html><head><style>${value}</style></head><body><div class="demo"><h1>Preview</h1><p>Sample paragraph for your styles.</p><button type="button">Button</button></div></body></html>`;
    }
    if (language === 'javascript' || language === 'jsx') {
      return `<!DOCTYPE html><html><body><div id="root"></div><pre id="out" style="font:13px/1.5 monospace;padding:12px;white-space:pre-wrap;"></pre><script>
try {
  const code = ${JSON.stringify(value)};
  document.getElementById('out').textContent = 'Code loaded (' + code.split('\\n').length + ' lines). Full JSX/React preview runs after you submit or deploy.';
} catch (e) { document.getElementById('out').textContent = String(e); }
</script></body></html>`;
    }
    return `<!DOCTYPE html><html><body><pre style="padding:12px;font:13px monospace;">Preview not available for ${language}. Submit your code for feedback.</pre></body></html>`;
  }, [language, value]);

  const showPreviewTab = enablePreview && ['html', 'css', 'javascript', 'jsx'].includes(language);

  return (
    <div className={cn('overflow-hidden rounded-lg border border-midnight/20', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-midnight/15 bg-midnight px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/10 text-chalk-soft border-0 font-mono text-xs">
            {CODE_LANGUAGE_LABELS[language]}
          </Badge>
          <span className="text-xs text-chalk-soft/70">Online code editor</span>
        </div>
        <div className="flex items-center gap-1">
          {enableConsole && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-chalk-soft hover:bg-white/10 hover:text-white"
              onClick={handleRunPreview}
              disabled={readOnly}
            >
              <Terminal className="mr-1 h-3.5 w-3.5" />
              Run
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-chalk-soft hover:bg-white/10 hover:text-white"
            onClick={handleCopy}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-chalk-soft hover:bg-white/10 hover:text-white"
            onClick={handleReset}
            disabled={readOnly}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-midnight/15 bg-midnight-light/80 h-9 px-2">
          <TabsTrigger
            value="editor"
            className="text-xs data-[state=active]:bg-white/15 data-[state=active]:text-white text-chalk-soft/80"
          >
            Editor
          </TabsTrigger>
          {showPreviewTab && (
            <TabsTrigger
              value="preview"
              className="text-xs data-[state=active]:bg-white/15 data-[state=active]:text-white text-chalk-soft/80"
            >
              Preview
            </TabsTrigger>
          )}
          {enableConsole && (
            <TabsTrigger
              value="console"
              className="text-xs data-[state=active]:bg-white/15 data-[state=active]:text-white text-chalk-soft/80"
            >
              Console
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="editor" className="m-0">
          <div className="flex min-h-[280px] max-h-[420px] overflow-auto bg-midnight">
            <div
              className="select-none shrink-0 border-r border-white/10 bg-midnight-light/50 px-3 py-3 text-right font-mono text-xs leading-[1.6] text-chalk-soft/40"
              aria-hidden
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={readOnly}
              spellCheck={false}
              className="min-h-[280px] w-full flex-1 resize-y bg-transparent p-3 font-mono text-sm leading-[1.6] text-chalk-soft caret-chalk-soft outline-none"
              placeholder="Write your code here..."
            />
          </div>
        </TabsContent>

        {showPreviewTab && (
          <TabsContent value="preview" className="m-0">
            <iframe
              title="Code preview"
              sandbox="allow-scripts"
              srcDoc={previewSrcDoc}
              className="h-[280px] w-full border-0 bg-white"
            />
          </TabsContent>
        )}

        {enableConsole && (
          <TabsContent value="console" className="m-0">
            <div className="min-h-[120px] max-h-[200px] overflow-auto bg-[#0a0f2e] p-3 font-mono text-xs leading-relaxed text-emerald-300/90">
              {consoleLines.length === 0 ? (
                <span className="text-chalk-soft/50">Click Run to see output notes.</span>
              ) : (
                consoleLines.map((line, i) => <div key={i}>{line}</div>)
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
