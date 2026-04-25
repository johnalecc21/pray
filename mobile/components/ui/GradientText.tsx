import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { prideGradientShort } from '../../lib/theme';

interface GradientTextProps {
  children: string;
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'extrabold';
  style?: object;
}

const SVG_FONT_WEIGHT: Record<string, string> = {
  extrabold: '800',
  bold: '700',
};

export default function GradientText({
  children,
  fontSize = 20,
  fontWeight = '800',
  style,
}: GradientTextProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const svgWeight = SVG_FONT_WEIGHT[fontWeight] ?? fontWeight;

  return (
    <View style={style}>
      {/* Hidden RN Text to measure actual rendered dimensions */}
      <Text
        style={{ fontSize, fontWeight, opacity: 0, position: 'absolute' }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width: Math.ceil(width) + 4, height: Math.ceil(height) + 4 });
        }}
      >
        {children}
      </Text>

      {size && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id="pride-text" x1="0" y1="0" x2="1" y2="0">
              {prideGradientShort.map((color, i) => (
                <Stop
                  key={color}
                  offset={`${(i / (prideGradientShort.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText
            fill="url(#pride-text)"
            fontSize={fontSize}
            fontWeight={svgWeight}
            x={0}
            y={size.height - 4}
          >
            {children}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}
