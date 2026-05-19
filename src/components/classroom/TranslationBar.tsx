'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Languages } from 'lucide-react';
import { translateContent } from '@/ai/flows/translate-content';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ja', label: 'Japanese' },
  { value: 'simple-en', label: 'Simple English' },
] as const;

export function TranslationBar({
  text,
  onTranslated,
}: {
  text: string;
  onTranslated: (translated: string) => void;
}) {
  const [lang, setLang] = useState<string>('en');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (lang === 'en') {
      onTranslated(text);
      return;
    }
    setLoading(true);
    try {
      const result = await translateContent({
        text,
        language:
          lang === 'bn'
            ? 'Bengali'
            : lang === 'ja'
              ? 'Japanese'
              : lang === 'simple-en'
                ? 'Simple English'
                : 'English',
      });
      onTranslated(result.translatedText);
    } catch {
      onTranslated(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={lang} onValueChange={setLang}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={handleTranslate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Translate'}
      </Button>
    </div>
  );
}
