"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useGlobalSearch Hook
 * 
 * Manages the global search modal state and keyboard shortcuts.
 * Handles Cmd+K / Ctrl+K to open the search modal.
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  return {
    isOpen,
    openSearch,
    closeSearch
  };
}