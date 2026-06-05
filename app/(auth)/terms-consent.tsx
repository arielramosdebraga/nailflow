import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';

const sections = [
  {
    title: 'Aceite para cadastro',
    body: 'Ao criar uma conta, você confirma que leu estes termos, entende a Política de Privacidade e concorda com o tratamento dos dados estritamente necessário para autenticação e uso do NailFlow.',
  },
  {
    title: 'Uso adequado da conta',
    body: 'A conta é pessoal e deve ser usada com informações verdadeiras. Você é responsável por manter sua senha protegida e por comunicar uso indevido assim que identificar qualquer risco.',
  },
  {
    title: 'Consentimento e bases legais',
    body: 'O aceite explícito no cadastro registra sua concordância para atividades que dependem de consentimento e complementa outras bases legais necessárias para segurança, prevenção à fraude e execução do serviço.',
  },
  {
    title: 'Revogação e exclusão',
    body: 'Você pode solicitar revisão, atualização ou exclusão de dados quando aplicável. A revogação do consentimento não invalida tratamentos anteriores realizados de forma regular.',
  },
  {
    title: 'Boas práticas de segurança',
    body: 'Recomendamos utilizar senha forte, não compartilhar credenciais e manter seus dados de acesso atualizados para reduzir riscos operacionais e proteger sua conta.',
  },
];

export default function TermsConsentScreen() {
  return (
    <AuthScreenShell
      eyebrow="Consentimento"
      backHref="/login"
      title="Termos e Consentimento"
      subtitle="Veja as condições de uso ligadas ao cadastro e o aceite necessário para o tratamento dos seus dados no contexto de autenticação do NailFlow."
      footer={
        <Link href="/privacy-policy" asChild>
          <Pressable accessibilityRole="link">
            <Text className="text-center text-sm font-semibold text-sky-300 underline">Ver Política de Privacidade</Text>
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
