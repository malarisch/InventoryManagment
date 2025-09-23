
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
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
        const [articles, customers, equipments, jobs, locations, cases] = await Promise.all([
          supabase.from('articles').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase.from('customers').select('*').textSearch('forename', query, { type: 'websearch' }),
          supabase.from('equipments').select('*, articles(name)').textSearch('id', query, { type: 'websearch' }),
          supabase.from('jobs').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase.from('locations').select('*').textSearch('name', query, { type: 'websearch' }),
          supabase.from('cases').select('*').textSearch('name', query, { type: 'websearch' }),
        ]);

        const allResults = [
          ...(articles.data || []).map((r) => ({ ...r, type: 'articles' })),
          ...(customers.data || []).map((r) => ({ ...r, type: 'customers' })),
          ...(equipments.data || []).map((r) => ({ ...r, type: 'equipments' })),
          ...(jobs.data || []).map((r) => ({ ...r, type: 'jobs' })),
          ...(locations.data || []).map((r) => ({ ...r, type: 'locations' })),
          ...(cases.data || []).map((r) => ({ ...r, type: 'cases' })),
        ];

        setResults(allResults);
      } catch (e: any) {
        setError(e.message);
      }

      setLoading(false);
    };

    performSearch();
  }, [query, supabase]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={`${result.type}-${result.id}`}>
            <CardHeader>
              <CardTitle>
                <Link href={`/management/${result.type}/${result.id}`}>
                  {result.name || result.forename || `ID: ${result.id}`}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.type}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
