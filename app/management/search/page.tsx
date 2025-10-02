
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

type SearchResultType = 'articles' | 'contacts' | 'equipments' | 'jobs' | 'locations' | 'cases';

type Base = { id: number } & Record<string, unknown>;
type Result = Base & { type: SearchResultType };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [articles, contacts, equipments, jobs, locations, cases] = await Promise.all([
          supabase.from('articles').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase
            .from('contacts')
            .select('id, display_name, company_name, forename, surname, first_name, last_name, contact_type, customer_type')
            .eq('contact_type', 'customer')
            .textSearch('display_name', query, { type: 'websearch' }),
          supabase.from('equipments').select('*, articles(name)').textSearch('id', query, { type: 'websearch' }),
          supabase.from('jobs').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase.from('locations').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase.from('cases').select('*').textSearch('name', query, { type: 'websearch' }),
        ]);

        const allResults: Result[] = [
          ...((articles.data || []) as Base[]).map((r) => ({ ...r, type: 'articles' as const })),
          ...((contacts.data || []) as Base[]).map((r) => ({ ...r, type: 'contacts' as const })),
          ...((equipments.data || []) as Base[]).map((r) => ({ ...r, type: 'equipments' as const })),
          ...((jobs.data || []) as Base[]).map((r) => ({ ...r, type: 'jobs' as const })),
          ...((locations.data || []) as Base[]).map((r) => ({ ...r, type: 'locations' as const })),
          ...((cases.data || []) as Base[]).map((r) => ({ ...r, type: 'cases' as const })),
        ];

        setResults(allResults);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
        setError(msg);
      }

      setLoading(false);
    };

    performSearch();
  }, [query, supabase]);

  return (
    <div className="p-4">
  <h1 className="text-2xl font-bold mb-4">Search Results for &quot;{query}&quot;</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {results.map((result) => {
          const record = result as Record<string, unknown>;
          let title = String(record.name ?? record.display_name ?? record.company_name ?? record.forename ?? record.first_name ?? `ID: ${result.id}`);
          if (result.type === 'contacts' && typeof record.display_name === 'string' && record.display_name.trim().length > 0) {
            title = record.display_name as string;
          }
          if (!title || title.trim().length === 0) {
            title = `ID: ${result.id}`;
          }
          const href = result.type === 'contacts'
            ? `/management/customers/${result.id}`
            : `/management/${result.type}/${result.id}`;
          const typeLabel = result.type === 'contacts' ? 'Kontakt' : result.type;
          return (
            <Card key={`${result.type}-${result.id}`}>
              <CardHeader>
                <CardTitle>
                  <Link href={href}>{title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{typeLabel}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
