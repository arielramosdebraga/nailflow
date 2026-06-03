import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export interface AuditLogFilterValues {
  userId: string;
  targetId: string;
  action: string;
  targetType: string;
  dateFrom: string;
  dateTo: string;
  limit: string;
}

interface AuditLogFiltersProps {
  values: AuditLogFilterValues;
  isApplying: boolean;
  onChange: (field: keyof AuditLogFilterValues, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function AuditLogFilters({
  values,
  isApplying,
  onChange,
  onApply,
  onReset,
}: AuditLogFiltersProps) {
  return (
    <Card className="gap-3">
      <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Filtros basicos</Text>
      <Input
        label="Usuario (ID)"
        value={values.userId}
        onChangeText={(text) => onChange('userId', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: uid_123"
      />
      <Input
        label="Alvo (ID)"
        value={values.targetId}
        onChangeText={(text) => onChange('targetId', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: global"
      />
      <Input
        label="Acao"
        value={values.action}
        onChangeText={(text) => onChange('action', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: admin.dashboard.global.read"
      />
      <Input
        label="Tipo do alvo"
        value={values.targetType}
        onChangeText={(text) => onChange('targetType', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: dashboard"
      />
      <Input
        label="Data inicial (ISO)"
        value={values.dateFrom}
        onChangeText={(text) => onChange('dateFrom', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="2026-05-01T00:00:00.000Z"
      />
      <Input
        label="Data final (ISO)"
        value={values.dateTo}
        onChangeText={(text) => onChange('dateTo', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="2026-05-31T23:59:59.999Z"
      />
      <Input
        label="Limite"
        value={values.limit}
        onChangeText={(text) => onChange('limit', text)}
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="25"
      />
      <View className="gap-2">
        <Button
          label={isApplying ? 'Aplicando filtros...' : 'Aplicar filtros'}
          onPress={onApply}
          disabled={isApplying}
        />
        <Button label="Limpar filtros" variant="ghost" onPress={onReset} disabled={isApplying} />
      </View>
    </Card>
  );
}
