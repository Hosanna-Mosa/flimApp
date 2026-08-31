import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import ScreenIntro from '@/components/layout/ScreenIntro';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/Button';
import PortfolioList from '@/components/portfolio/PortfolioList';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import { usePortfolio } from '@/hooks/usePortfolio';

export default function PortfolioScreen() {
  const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();
  const p = usePortfolio(userId);

  if (p.loading) {
    return (
      <Screen title={name ? `${name}'s Portfolio` : 'Portfolio'} scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  return (
    <Screen
      title={p.isOwn ? 'Manage Portfolio' : `${name || 'User'}'s Portfolio`}
      keyboard
      contentStyle={{ paddingBottom: 40 }}
    >
      <ScreenIntro
        icon={Briefcase}
        title={p.isOwn ? 'Showcase Your Work' : `${name || 'User'}'s Portfolio`}
        subtitle={
          p.isOwn
            ? 'Add links to your videos, articles, websites, or social profile pages.'
            : `Check out projects, reels, and works shared by ${name || 'them'}.`
        }
      />

      <PortfolioList
        items={p.items}
        editable={p.isOwn}
        onAdd={p.form.open}
        onRemove={p.removeItem}
        form={
          p.form.visible ? (
            <PortfolioForm value={p.form.draft} onChange={p.form.update} onCancel={p.form.cancel} onAdd={p.form.add} />
          ) : undefined
        }
      />

      {p.isOwn && (
        <Button title="Save Portfolio" onPress={p.save} size="large" loading={p.saving} style={{ marginTop: 10 }} />
      )}
    </Screen>
  );
}
