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
    <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
      <Text className="text-base font-semibold text-zinc-50">Filtros básicos</Text>
      <Input
        label="Usuário (ID)"
        value={values.userId}
        onChangeText={(text) => onChange('userId', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: uid_123"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Alvo (ID)"
        value={values.targetId}
        onChangeText={(text) => onChange('targetId', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: global"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Ação"
        value={values.action}
        onChangeText={(text) => onChange('action', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: admin.dashboard.global.read"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Tipo do alvo"
        value={values.targetType}
        onChangeText={(text) => onChange('targetType', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ex.: dashboard"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Data inicial (ISO)"
        value={values.dateFrom}
        onChangeText={(text) => onChange('dateFrom', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="2026-05-01T00:00:00.000Z"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Data final (ISO)"
        value={values.dateTo}
        onChangeText={(text) => onChange('dateTo', text)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="2026-05-31T23:59:59.999Z"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <Input
        label="Limite"
        value={values.limit}
        onChangeText={(text) => onChange('limit', text)}
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="25"
        labelClassName="text-zinc-200"
        inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
        className="text-zinc-50"
      />
      <View className="gap-2">
        <Button
          label={isApplying ? 'Aplicando filtros...' : 'Aplicar filtros'}
          className="h-12 rounded-2xl"
          onPress={onApply}
          disabled={isApplying}
        />
        <Button
          label="Limpar filtros"
          variant="ghost"
          className="h-12 rounded-2xl border-white/10 bg-white/5"
          onPress={onReset}
          disabled={isApplying}
        />
      </View>
    </Card>
  );
}
