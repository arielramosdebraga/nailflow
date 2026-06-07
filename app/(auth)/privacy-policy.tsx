import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

const sections = [
  {
    title: 'Resumo',
    body: 'A plataforma trata dados pessoais para autenticar sua conta, organizar agenda, clientes e operacao do salao com base em necessidade operacional, seguranca e cumprimento da LGPD.',
  },
  {
    title: 'Dados coletados',
    body: 'Podemos tratar nome, e-mail, credenciais de acesso, informacoes de perfil e registros essenciais para funcionamento da conta e suporte ao uso do aplicativo.',
  },
  {
    title: 'Como usamos seus dados',
    body: 'Usamos os dados para criar e proteger sua conta, permitir acesso aos recursos do app, recuperar senha, prevenir fraude e manter a experiencia segura e funcional.',
  },
  {
    title: 'Compartilhamento e armazenamento',
    body: 'Os dados ficam restritos a infraestrutura necessaria para autenticacao e operacao da plataforma. O compartilhamento ocorre apenas quando indispensavel para prestar o servico ou cumprir obrigacoes legais.',
  },
  {
    title: 'Seus direitos pela LGPD',
    body: 'Voce pode solicitar confirmacao de tratamento, acesso, correcao, exclusao quando cabivel e informacoes sobre consentimento. Tambem pode revogar consentimentos opcionais sem afetar bases legais obrigatorias.',
  },
  {
    title: 'Seguranca e contato',
    body: 'Adotamos controles tecnicos e organizacionais para reduzir riscos de acesso indevido. Para duvidas sobre privacidade ou exercicio de direitos, utilize os canais oficiais de suporte da plataforma.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        <View className="gap-3">
          <Tag label="LGPD" />
          <Text className="text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-100">
            Politica de Privacidade
          </Text>
          <Text className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Esta tela explica, de forma objetiva, como a plataforma trata dados pessoais durante o acesso e o
            uso das funcionalidades de autenticacao.
          </Text>
        </View>

        {sections.map((section) => (
          <Card key={section.title} className="gap-2">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{section.title}</Text>
            <Text className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{section.body}</Text>
          </Card>
        ))}

        <Card className="gap-3">
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Leitura relacionada</Text>
          <Link href="/terms-consent" asChild>
            <Pressable accessibilityRole="link">
              <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                Ver Termos e Consentimento
              </Text>
            </Pressable>
          </Link>
        </Card>
      </View>
    </ScrollView>
  );
}
