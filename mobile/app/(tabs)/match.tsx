import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../features/profile/hooks/useProfile';
import { useMatchCandidates } from '../../features/match/hooks/useMatchCandidates';
import { useMatches } from '../../features/match/hooks/useMatches';
import { SwipeCard, SwipeCardRef, CARD_HEIGHT } from '../../features/match/components/SwipeCard';
import { MatchSuccessModal } from '../../features/match/components/MatchSuccessModal';
import { MatchesList } from '../../features/match/components/MatchesList';
import GradientText from '../../components/ui/GradientText';
import { colors } from '../../lib/theme';

type Tab = 'swipe' | 'matches';

function ScoreBar({ score }: { score: number }) {
  const scoreColor =
    score >= 70 ? colors.pride.green :
    score >= 50 ? colors.pride.orange :
                  colors.pride.pink;
  return (
    <View style={styles.scoreBar}>
      <View style={styles.scoreBarRow}>
        <Text style={styles.scoreBarLabel}>Compatibilidad IA</Text>
        <Text style={[styles.scoreBarValue, { color: scoreColor }]}>{score}%</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <LinearGradient
          colors={[colors.pride.pink, colors.pride.orange, colors.pride.yellow]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.scoreBarFill, { width: `${score}%` as any }]}
        />
      </View>
    </View>
  );
}

export default function MatchScreen() {
  const [tab, setTab] = useState<Tab>('swipe');
  const { user }    = useAuth();
  const { profile } = useProfile();

  const {
    candidates, loading, currentIndex,
    matchedUser, swipeLike, swipePass, dismissMatch, refetch, isEmpty,
  } = useMatchCandidates();

  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const topCardRef = useRef<SwipeCardRef>(null);

  useEffect(() => {
    if (matchedUser) refetchMatches();
  }, [matchedUser, refetchMatches]);

  const visibleStack     = candidates.slice(currentIndex, currentIndex + 3);
  const currentCandidate = candidates[currentIndex];

  const handleSwipeRight = useCallback(() => {
    if (currentCandidate) swipeLike(currentCandidate);
  }, [currentCandidate, swipeLike]);

  const handleSwipeLeft = useCallback(() => {
    if (currentCandidate) swipePass(currentCandidate);
  }, [currentCandidate, swipePass]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <GradientText fontSize={20} fontWeight="800">Match</GradientText>
        <TouchableOpacity
          onPress={tab === 'swipe' ? refetch : refetchMatches}
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['swipe', 'matches'] as Tab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'swipe'
                ? 'Swipe'
                : `Matches${matches.length > 0 ? ` · ${matches.length}` : ''}`}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'swipe' ? (
        <View style={styles.swipeArea}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : isEmpty ? (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>🌈</Text>
              <Text style={styles.emptyTitle}>No hay más perfiles cerca</Text>
              <Text style={styles.emptySubtitle}>
                Vuelve más tarde o amplía tu área de búsqueda
              </Text>
              <TouchableOpacity onPress={refetch} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {currentCandidate && <ScoreBar score={currentCandidate.match_score} />}

              {/* Card stack */}
              <View style={styles.cardStack}>
                {[...visibleStack].reverse().map((candidate, i, arr) => {
                  const stackIndex = arr.length - 1 - i;
                  const isTop      = stackIndex === 0;
                  return (
                    <SwipeCard
                      key={candidate.id}
                      ref={isTop ? topCardRef : undefined}
                      candidate={candidate}
                      isTop={isTop}
                      stackIndex={stackIndex}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                    />
                  );
                })}
              </View>

              {/* Match factor pills */}
              {currentCandidate && currentCandidate.match_factors.length > 0 && (
                <View style={styles.factorsRow}>
                  {currentCandidate.match_factors.map(f => (
                    <View key={f} style={styles.factorChip}>
                      <Ionicons name="sparkles" size={9} color={colors.pride.pink} />
                      <Text style={styles.factorText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => topCardRef.current?.swipeLeft()}
                  style={styles.passBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={26} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
                  <Ionicons name="star" size={20} color={colors.pride.yellow} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => topCardRef.current?.swipeRight()}
                  style={styles.likeBtn}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.pride.orange, colors.pride.pink]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.likeBtnInner}
                  >
                    <Ionicons name="heart" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : (
        <MatchesList
          matches={matches}
          loading={matchesLoading}
          onRefresh={refetchMatches}
        />
      )}

      <MatchSuccessModal
        visible={matchedUser != null}
        matched={matchedUser}
        myName={profile?.name ?? user?.name ?? null}
        myAvatarUrl={profile?.avatar_url ?? null}
        onDismiss={dismissMatch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  refreshBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20 },
  tabItem:        { marginRight: 24, paddingVertical: 10, position: 'relative' },
  tabText:        { fontSize: 14, fontWeight: '600', color: colors.mutedForeground },
  tabTextActive:  { color: colors.foreground, fontWeight: '700' },
  tabUnderline:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: colors.primary },
  swipeArea:      { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '800', color: colors.foreground, marginBottom: 6, textAlign: 'center' },
  emptySubtitle:  { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:       { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  emptyBtnText:   { fontSize: 14, fontWeight: '600', color: colors.foreground },
  scoreBar:       { backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  scoreBarRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scoreBarLabel:  { fontSize: 12, color: colors.mutedForeground, fontWeight: '500' },
  scoreBarValue:  { fontSize: 16, fontWeight: '900' },
  scoreBarTrack:  { height: 6, backgroundColor: colors.secondary, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:   { height: '100%', borderRadius: 3 },
  cardStack:      { height: CARD_HEIGHT, position: 'relative', marginBottom: 10 },
  factorsRow:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  factorChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: `${colors.pride.pink}15`, borderWidth: 1, borderColor: `${colors.pride.pink}30`, marginRight: 6, marginBottom: 4 },
  factorText:     { fontSize: 11, color: colors.pride.pink, fontWeight: '600', marginLeft: 3 },
  actions:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  passBtn:        { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  secondaryBtn:   { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  likeBtn:        { width: 68, height: 68, borderRadius: 20, overflow: 'hidden', marginHorizontal: 8 },
  likeBtnInner:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
