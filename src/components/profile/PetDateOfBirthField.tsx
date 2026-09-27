import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppFonts, palette } from '@/constants/theme';
import { formatPetDateOfBirth, isValidPetDateOfBirth } from '@/lib/formatPetDateOfBirth';

type Props = {
  value: string | null | undefined;
  onChange: (isoDate: string | undefined) => void;
  label?: string;
};

/** ISO date field without native modules (works in Expo Go). */
export function PetDateOfBirthField({
  value,
  onChange,
  label = 'Date of birth (optional)',
}: Props) {
  const [draft, setDraft] = useState(value || '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setDraft(value || '');
    setTouched(false);
  }, [value]);

  const showError = touched && draft.length > 0 && !isValidPetDateOfBirth(draft);

  function commitDraft(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      onChange(undefined);
      return;
    }
    if (isValidPetDateOfBirth(trimmed)) {
      onChange(trimmed);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, showError && styles.rowError]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={() => {
            setTouched(true);
            commitDraft(draft);
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.faded}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
          style={styles.input}
        />
        <Ionicons name="calendar-outline" size={18} color={palette.faded} />
      </View>
      {value && isValidPetDateOfBirth(value) ? (
        <Text style={styles.hint}>{formatPetDateOfBirth(value)}</Text>
      ) : (
        <Text style={styles.hint}>Example: 2020-03-15</Text>
      )}
      {showError ? <Text style={styles.error}>Enter a valid date that is not in the future.</Text> : null}
      {value ? (
        <Pressable
          onPress={() => {
            setDraft('');
            setTouched(false);
            onChange(undefined);
          }}
          hitSlop={8}>
          <Text style={styles.clear}>Clear date</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#424844' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowError: { borderColor: '#ba1a1a' },
  input: {
    flex: 1,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: '#011E14',
    paddingVertical: 8,
  },
  hint: { fontFamily: AppFonts.body, fontSize: 11, color: palette.faded },
  error: { fontFamily: AppFonts.body, fontSize: 11, color: '#ba1a1a' },
  clear: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.amber },
});
