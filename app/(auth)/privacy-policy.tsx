import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';

const sections = [
  {
    title: 'Resumo',
    body: 'O NailFlow trata dados pessoais para autenticar sua conta, organizar agenda, clientes e operação do salão com base em necessidade operacional, segurança e cumprimento da LGPD.',
  },
  {
    title: 'Dados coletados',
    body: 'Podemos tratar nome, e-mail, credenciais de acesso, informações de perfil e registros essenciais para funcionamento da conta e suporte ao uso do aplicativo.',
  },
  {
    title: 'Como usamos seus dados',
    body: 'Usamos os dados para criar e proteger sua conta, permitir acesso aos recursos do app, recuperar senha, prevenir fraude e manter a experiência segura e funcional.',
  },
  {
    title: 'Compartilhamento e armazenamento',
    body: 'Os dados ficam restritos à infraestrutura necessária para autenticação e operação do NailFlow. O compartilhamento ocorre apenas quando indispensável para prestar o serviço ou cumprir obrigações legais.',
  },
  {
    title: 'Seus direitos pela LGPD',
    body: 'Você pode solicitar confirmação de tratamento, acesso, correção, exclusão quando cabível e informações sobre consentimento. Também pode revogar consentimentos opcionais sem afetar bases legais obrigatórias.',
  },
  {
    title: 'Segurança e contato',
    body: 'Adotamos controles técnicos e organizacionais para reduzir riscos de acesso indevido. Para dúvidas sobre privacidade ou exercício de direitos, utilize os canais oficiais de suporte do NailFlow.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <AuthScreenShell
      eyebrow="LGPD"
      backHref="/login"
      title="Política de Privacidade"
      subtitle="Entenda de forma objetiva como o NailFlow trata seus dados durante o acesso e o uso das funcionalidades de autenticação."
      footer={
        <Link href="/terms-consent" asChild>
          <Pressable accessibilityRole="link">
            <Text className="text-center text-sm font-semibold text-sky-300 underline">Ver Termos e Consentimento</Text>
          </Pressable>
        </Link>
      }
    >
      <View className="gap-4">
        {sections.map((section) => (
          <View key={section.title} className="gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="text-lg font-semibold text-zinc-50">{section.title}</Text>
            <Text className="text-sm leading-6 text-zinc-300">{section.body}</Text>
          </View>
        ))}
      </View>
    </AuthScreenShell>
  );
}
