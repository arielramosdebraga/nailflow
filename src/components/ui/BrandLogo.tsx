import { Text, View } from 'react-native';

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  tone?: 'dark' | 'light';
  /** Variante de uso: 'inline' (login, à esquerda) ou 'splash' (centralizado, maior) */
  variant?: 'inline' | 'splash';
  /** Proporção da fonte em relação à altura. Sobrescreve o padrão da variante. */
  fontScale?: number;
  /** Alinhamento horizontal do texto. Sobrescreve o padrão da variante. */
  align?: 'left' | 'center' | 'right';
}

export const BRAND_LOGO_FONT_FAMILY = 'NotoSerifDisplay_400Regular';
export const BRAND_LOGO_ITALIC_FONT_FAMILY = 'NotoSerifDisplay_400Regular_Italic';

// Configuração padrão de cada cenário
const VARIANT_PRESETS = {
  inline: { fontScale: 0.5, align: 'left' as const },   // Imagem 1 — Login
  splash: { fontScale: 0.9, align: 'center' as const }, // Imagem 2 — Boas-vindas
};

export function BrandLogo({
  width = 210,
  height = 54,
  className,
  tone = 'dark',
  variant = 'inline',
  fontScale,
  align,
}: BrandLogoProps) {
  const mainColor = tone === 'dark' ? '#E9DBD8' : '#6C5352';
  const accentColor = tone === 'dark' ? '#DDA197' : '#C68478';

  // Resolve os valores: props explícitas têm prioridade sobre o preset da variante
  const preset = VARIANT_PRESETS[variant];
  const resolvedScale = fontScale ?? preset.fontScale;
  const resolvedAlign = align ?? preset.align;

  const fontSize = Math.round(height * resolvedScale);
  const lineHeight = Math.round(height * 1.02);

  // Alinha o conteúdo do View conforme o alinhamento do texto
  const alignItems =
    resolvedAlign === 'center'
      ? 'center'
      : resolvedAlign === 'right'
        ? 'flex-end'
        : 'flex-start';

  return (
    <View
      className={className}
      style={{
        width,
        height,
        justifyContent: 'center',
        alignItems,
      }}
      accessibilityLabel="Logo Nailflow"
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit={false}
        style={{
          fontFamily: BRAND_LOGO_FONT_FAMILY,
          fontSize,
          lineHeight,
          color: mainColor,
          letterSpacing: -1.8,
          textAlign: resolvedAlign,
        }}
      >
        <Text style={{ color: mainColor }}>Nail</Text>
        <Text
          style={{
            color: accentColor,
            fontFamily: BRAND_LOGO_ITALIC_FONT_FAMILY,
          }}
        >
          flow
        </Text>
      </Text>
    </View>
  );
}
