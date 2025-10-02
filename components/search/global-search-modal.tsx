"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Package, Users, Briefcase, MapPin, Archive, Box } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/app/management/_libs/companyHook";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SearchResultType = 'articles' | 'contacts' | 'equipments' | 'jobs' | 'locations' | 'cases';

type SearchResult = {
  id: number;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
};

const typeIcons: Record<SearchResultType, LucideIcon> = {
  articles: Package,
  contacts: Users,
  equipments: Box,
  jobs: Briefcase,
  locations: MapPin,
  cases: Archive,
};

const typeLabels: Record<SearchResultType, string> = {
  articles: "Artikel",
  contacts: "Kunden",
  equipments: "Equipments", 
  jobs: "Jobs",
  locations: "Locations",
  cases: "Cases",
};

/**
 * GlobalSearchModal
 * 
 * Apple Spotlight-style floating search modal that searches across all entities.
 * Opens with Cmd+K, updates on every keystroke, closes when clicking outside.
 * 
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback when modal should close
 */
export function GlobalSearchModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { company } = useCompany();

  // Search function that queries all tables
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !company) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const trimmedQuery = searchQuery.trim();
      
      // Search across all tables using ilike (case insensitive LIKE)
      const [
        articlesResponse,
        contactsResponse, 
        equipmentsResponse,
        jobsResponse,
        locationsResponse,
        casesResponse
      ] = await Promise.all([
        // Articles: search name
        supabase
          .from('articles')
          .select('id, name')
          .eq('company_id', company.id)
          .ilike('name', `%${trimmedQuery}%`),
          
        // Contacts: search display_name, forename, surname, company
        supabase
          .from('contacts')
          .select('id, display_name, forename, surname, first_name, last_name, company_name, customer_type, contact_type')
          .eq('company_id', company.id)
          .eq('contact_type', 'customer')
          .or(`display_name.ilike.%${trimmedQuery}%,forename.ilike.%${trimmedQuery}%,surname.ilike.%${trimmedQuery}%,first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%,company_name.ilike.%${trimmedQuery}%`),
          
        // Equipments: search by ID  
        supabase
          .from('equipments')
          .select('id')
          .eq('company_id', company.id)
          .eq('id', isNaN(Number(trimmedQuery)) ? -1 : Number(trimmedQuery)),
          
        // Jobs: search name and type
        supabase
          .from('jobs')
          .select('id, name, type, job_location')
          .eq('company_id', company.id)
          .or(`name.ilike.%${trimmedQuery}%,type.ilike.%${trimmedQuery}%,job_location.ilike.%${trimmedQuery}%`),
          
        // Locations: search name and description
        supabase
          .from('locations')
          .select('id, name, description')
          .eq('company_id', company.id)
          .or(`name.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`),
          
        // Cases: search name and description
        supabase
          .from('cases')
          .select('id, name, description')
          .eq('company_id', company.id)
          .or(`name.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`)
      ]);

      const searchResults: SearchResult[] = [];

      // Process articles
      if (articlesResponse.data) {
        articlesResponse.data.forEach((item) => {
          searchResults.push({
            id: item.id,
            type: 'articles',
            title: item.name || `Artikel #${item.id}`,
            url: `/management/articles/${item.id}`
          });
        });
      }

      // Process contacts
      if (contactsResponse.data) {
        contactsResponse.data.forEach((item) => {
          const baseName = item.display_name || item.company_name || `${item.forename ?? item.first_name ?? ''} ${item.surname ?? item.last_name ?? ''}`.trim();
          searchResults.push({
            id: item.id,
            type: 'contacts',
            title: baseName || `Kontakt #${item.id}`,
            subtitle: item.customer_type ?? item.contact_type ?? undefined,
            url: `/management/customers/${item.id}`
          });
        });
      }

      // Process equipments
      if (equipmentsResponse.data) {
        equipmentsResponse.data.forEach((item) => {
          searchResults.push({
            id: item.id,
            type: 'equipments',
            title: `Equipment #${item.id}`,
            url: `/management/equipments/${item.id}`
          });
        });
      }

      // Process jobs
      if (jobsResponse.data) {
        jobsResponse.data.forEach((item) => {
          searchResults.push({
            id: item.id,
            type: 'jobs',
            title: item.name || `Job #${item.id}`,
            subtitle: item.type,
            description: item.job_location,
            url: `/management/jobs/${item.id}`
          });
        });
      }

      // Process locations
      if (locationsResponse.data) {
        locationsResponse.data.forEach((item) => {
          searchResults.push({
            id: item.id,
            type: 'locations',
            title: item.name || `Location #${item.id}`,
            description: item.description,
            url: `/management/locations/${item.id}`
          });
        });
      }

      // Process cases
      if (casesResponse.data) {
        casesResponse.data.forEach((item) => {
          searchResults.push({
            id: item.id,
            type: 'cases',
            title: item.name || `Case #${item.id}`,
            description: item.description,
            url: `/management/cases/${item.id}`
          });
        });
      }

      setResults(searchResults);
      setActiveIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, company]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(results.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      // Navigate to the selected result
      const result = results[activeIndex];
      window.location.href = result.url;
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, activeIndex, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-16 px-4">
        <div 
          ref={modalRef}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Suche in allem..."
              className="flex-1 bg-transparent text-lg outline-none placeholder-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-gray-500">
                Suche läuft...
              </div>
            )}
            
            {!loading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                Keine Ergebnisse für &quot;{query}&quot;
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = typeIcons[result.type];
                  const isActive = index === activeIndex;
                  
                  return (
                    <Link 
                      key={`${result.type}-${result.id}`}
                      href={result.url}
                      onClick={onClose}
                      className={cn(
                        "flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                        isActive && "bg-gray-50 dark:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded mr-3">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.title}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {typeLabels[result.type]}
                          </span>
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </div>
                        )}
                        {result.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!query && (
              <div className="px-4 py-8 text-center text-gray-500 space-y-2">
                <div className="text-lg">🔍</div>
                <div>Gib etwas ein, um zu suchen</div>
                <div className="text-xs text-gray-400">
                  Durchsucht Artikel, Kunden, Equipment, Jobs, Locations und Cases
                </div>
              </div>
            )}
          </div>

          {/* Footer with keyboard shortcuts */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigation</span>
                <span>↵ Öffnen</span>
                <span>Esc Schließen</span>
              </div>
              <div>{results.length} Ergebnisse</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
