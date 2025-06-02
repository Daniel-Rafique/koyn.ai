import { useState, useEffect } from 'react'

/**
 * Hook to detect if a media query matches
 * @param query The media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)
    
    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add listener
    media.addEventListener('change', listener)
    
    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
} 