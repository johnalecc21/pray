import { useRef, useState } from 'react';
import {
  ActivityIndicator, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface Suggestion {
  id: string;
  label: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressBlur = useRef(false);

  function handleChange(text: string) {
    onChange(text);
    if (timer.current) clearTimeout(timer.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    timer.current = setTimeout(() => fetchSuggestions(text.trim()), 400);
  }

  async function fetchSuggestions(query: string) {
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
        `&format=json&addressdetails=1&limit=7`;
      const res  = await fetch(url, {
        headers: {
          'Accept-Language': 'es,en',
          'User-Agent':      'charco-app/1.0',
        },
      });
      const data: any[] = await res.json();

      const seen  = new Set<string>();
      const items: Suggestion[] = [];

      for (const item of data) {
        const addr    = item.address ?? {};
        const city    = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? '';
        const country = addr.country ?? '';
        const label   = city && country
          ? `${city}, ${country}`
          : item.display_name.split(',').slice(0, 2).join(',').trim();

        if (!seen.has(label)) {
          seen.add(label);
          items.push({ id: String(item.place_id), label });
        }
      }

      setSuggestions(items);
    } catch {
      // silently fail — Nominatim unreachable
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(label: string) {
    onChange(label);
    setSuggestions([]);
  }

  function handleBlur() {
    // give a small window so a tap on a suggestion is processed first
    setTimeout(() => {
      if (!suppressBlur.current) setSuggestions([]);
    }, 150);
  }

  return (
    <View>
      <View>
        <TextInput
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          placeholder="Ej: Bogotá, Colombia"
          placeholderTextColor={colors.mutedForeground}
          autoCorrect={false}
          style={{
            backgroundColor:  colors.secondary,
            borderWidth:      1,
            borderColor:      colors.border,
            borderRadius:     12,
            paddingHorizontal: 14,
            paddingVertical:  12,
            color:            colors.foreground,
            fontSize:         15,
            paddingRight:     loading ? 40 : 14,
          }}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ position: 'absolute', right: 12, top: 13 }}
          />
        )}
      </View>

      {suggestions.length > 0 && (
        <View
          style={{
            marginTop:       4,
            backgroundColor: colors.secondary,
            borderWidth:     1,
            borderColor:     colors.border,
            borderRadius:    12,
            overflow:        'hidden',
          }}
        >
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              onPressIn={() => { suppressBlur.current = true; }}
              onPress={() => {
                suppressBlur.current = false;
                selectSuggestion(item.label);
              }}
              style={{
                flexDirection:   'row',
                alignItems:      'center',
                gap:             8,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderTopWidth:  idx > 0 ? 1 : 0,
                borderTopColor:  colors.border,
              }}
            >
              <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground, fontSize: 14, flex: 1 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
