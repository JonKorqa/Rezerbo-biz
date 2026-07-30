import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography } from '../theme';

interface RezervoLogoProps {
  // 'dark' = logo sits on a dark background → white text (default)
  // 'light' = logo sits on a light background → dark navy text
  variant?: 'dark' | 'light';
  size?: number;
}

export function RezervoLogo({ variant = 'dark', size = 24 }: RezervoLogoProps) {
  const textColor = variant === 'light' ? '#111827' : '#FFFFFF';
  const scale = size / 24;
  return (
    <View style={styles.row}>
      <Svg width={18 * scale} height={22 * scale} viewBox="0 0 24 30">
        <Defs>
          <LinearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7DD3FC" />
            <Stop offset="100%" stopColor="#1E3A8A" />
          </LinearGradient>
        </Defs>
        <Path
          fill="url(#rGrad)"
          fillRule="evenodd"
          d="M 0,0 L 12,0 Q 23,0 23,8 Q 23,17 12,17 L 5,20 L 0,20 Z M 4,4 L 10,4 Q 17,4 17,8 Q 17,14 10,14 L 4,14 Z"
        />
        <Path fill="url(#rGrad)" d="M 5,22 L 14,22 L 22,29 L 13,29 Z" />
      </Svg>
      <Text style={[styles.text, { color: textColor, fontSize: size }]}>ezervo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    fontFamily: Typography.fontFamily.heading,
    letterSpacing: -0.5,
  },
});
