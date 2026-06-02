import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

const sections = [
  {
    title: 'Aceite para cadastro',
    body: 'Ao criar uma conta, voce confirma que leu estes termos, entende a Politica de Privacidade e concorda com o tratamento dos dados estritamente necessario para autenticacao e uso do NailFlow.',
  },
  {
    title: 'Uso adequado da conta',
    body: 'A conta e pessoal e deve ser usada com informacoes verdadeiras. Voce e responsavel por manter sua senha protegida e por comunicar uso indevido assim que identificar qualquer risco.',
  },
  {
    title: 'Consentimento e bases legais',
    body: 'O aceite explicito no cadastro registra sua concordancia para atividades que dependem de consentimento e complementa outras bases legais necessarias para seguranca, prevencao a fraude e execucao do servico.',
  },
  {
    title: 'Revogacao e exclusao',
    body: 'Voce pode solicitar revisao, atualizacao ou exclusao de dados quando aplicavel. A revogacao do consentimento nao invalida tratamentos anteriores realizados de forma regular.',
  },
  {
    title: 'Boas praticas de seguranca',
    body: 'Recomendamos utilizar senha forte, nao compartilhar credenciais e manter seus dados de acesso atualizados para reduzir riscos operacionais e proteger sua conta.',
  },
];

export default function TermsConsentScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        <View className="gap-3">
          <Tag label="Consentimento" />
          <Text className="text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-100">
            Termos e Consentimento
          </Text>
          <Text className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Este resumo apresenta as condicoes de uso ligadas ao cadastro e o aceite necessario para tratar
            seus dados no contexto de autenticacao do NailFlow.
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
          <Link href="/privacy-policy" asChild>
            <Pressable accessibilityRole="link">
              <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                Ver Politica de Privacidade
              </Text>
            </Pressable>
          </Link>
        </Card>
      </View>
    </ScrollView>
  );
}
