import { Text, View } from 'react-native';

import { CommunityDisclaimerFooter } from '@/components/common/CommunityDisclaimerFooter';
import { InfoPageLayout } from '@/components/common/InfoPageLayout';
import { infoPageStyles as s } from '@/components/common/infoPageStyles';

export default function AboutScreen() {
  return (
    <InfoPageLayout title="About">
      <Text style={s.eyebrow}>Our Story & Vision</Text>
      <Text style={s.sectionTitle}>Where pets are the identity, not their humans.</Text>
      <View style={s.intro}>
        <Text style={s.introText}>
          <Text style={s.introStrong}>Furlo</Text> is India's first community-first social network built
          specifically for your dog, your cat, and every tail in between.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Why We Built This</Text>
      <Text style={s.body}>
        Pet parents in India deserve a home of their own. Today, pet owners are scattered across fragmented
        tools — from generic photo apps to noisy messaging groups. Furlo gives pets their own dedicated voice
        and identity.
      </Text>

      <Text style={s.sectionTitle}>The Pets-as-Actors Model</Text>
      <Text style={s.body}>
        {'\u2022 '}
        <Text style={s.bodyStrong}>Bruno posts photos:</Text> You manage the profile, but Bruno is the star.
        {'\n\u2022 '}
        <Text style={s.bodyStrong}>Mochi joins local packs:</Text> Connect with neighborhood dog and cat groups.
        {'\n\u2022 '}
        <Text style={s.bodyStrong}>Treats & Barks:</Text> Pet-themed interactions replacing generic likes and
        comments.
      </Text>

      <Text style={s.sectionTitle}>Our Core Principles</Text>
      <Text style={s.body}>
        {'\u2022 '}
        <Text style={s.bodyStrong}>Warm & Cozy:</Text> Designed for comfort and belonging, without hyper-stimulating
        algorithms.
        {'\n\u2022 '}
        <Text style={s.bodyStrong}>Pack Community:</Text> Communities built around breeds, locations, and shared
        interests.
        {'\n\u2022 '}
        <Text style={s.bodyStrong}>Privacy First:</Text> DPDPA 2023 compliant. We never sell your data or display
        intrusive ads.
      </Text>

      <CommunityDisclaimerFooter />
    </InfoPageLayout>
  );
}
