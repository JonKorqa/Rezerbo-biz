import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
  leftElement?: React.ReactNode;
}

export function FormInput({
  label,
  error,
  icon,
  secureToggle,
  leftElement,
  secureTextEntry,
  ...props
}: FormInputProps) {
  const [secure, setSecure] = useState(!!secureToggle);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[styles.inputRow, focused && styles.focused, error ? styles.errorBorder : null]}
      >
        {leftElement}
        {icon && <Ionicons name={icon} size={18} color={focused ? Colors.teal : Light.textMuted} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={Light.textMuted}
          secureTextEntry={secureToggle ? secure : secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setSecure((v) => !v)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Light.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    color: Light.label,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  focused: { borderColor: Colors.teal, backgroundColor: Light.fieldBgFocused },
  errorBorder: { borderColor: Colors.error },
  input: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
});
