import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  searchAddresses,
} from "@/functions/address";
import type { AddressSuggestion } from "@/functions/address";
import RequiredMark from "@/components/required-mark";

export interface SelectedAddress {
  city: string;
  state: string;
  street: string;
  zip: string;
}

export default function AddressAutocomplete({
  id = "address-search",
  onSelect,
  placeholder = "Start typing your street address...",
  value,
  onChange,
}: {
  id?: string;
  onChange: (value: string) => void;
  onSelect: (address: SelectedAddress) => void;
  placeholder?: string;
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unconfigured, setUnconfigured] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const [debouncedQuery] = useDebouncedValue(value, { wait: 400 });

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    const runSearch = async () => {
      setIsSearching(true);
      try {
        const result = await searchAddresses({ data: { query } });
        if (cancelled) {
          return;
        }
        setUnconfigured(!result.configured);
        setSuggestions(result.suggestions);
        setIsOpen(result.suggestions.length > 0);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };
    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={boxRef} className="relative space-y-2">
      <Label htmlFor={id}>Search Address <RequiredMark /></Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
        <Input
          id={id}
          autoComplete="street-address"
          className="border-gold/10 bg-background pl-9"
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          value={value}
        />
      </div>
      {isSearching && (
        <p className="text-xs text-muted-foreground">Searching addresses…</p>
      )}
      {isOpen && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gold/15 bg-card p-1 shadow-xl shadow-black/40">
          {suggestions.map((suggestion) => (
            <li key={suggestion.label}>
              <button
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-gold/10"
                onClick={() => {
                  onSelect({
                    city: suggestion.city,
                    state: suggestion.state,
                    street: suggestion.street,
                    zip: suggestion.zip,
                  });
                  onChange(suggestion.street);
                  setIsOpen(false);
                }}
                type="button"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                <span>{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {unconfigured && value.trim().length >= 3 && !isSearching && (
        <p className="text-xs text-muted-foreground">
          Address suggestions aren&apos;t configured yet — keep typing, then
          confirm the fields below.
        </p>
      )}
    </div>
  );
}
