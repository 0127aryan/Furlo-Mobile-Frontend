import { Text, View } from 'react-native';

import { CommunityDisclaimerFooter } from '@/components/common/CommunityDisclaimerFooter';
import { InfoPageLayout } from '@/components/common/InfoPageLayout';
import { infoPageStyles as s } from '@/components/common/infoPageStyles';

export default function TermsScreen() {
  return (
    <InfoPageLayout title="Terms of Service">
      <Text style={s.eyebrow}>Legal & Compliance</Text>
      <Text style={s.meta}>Effective Date: June 2026 · Version 1.0</Text>
      <View style={s.intro}>
        <Text style={s.introText}>
          Welcome to <Text style={s.introStrong}>Furlo</Text>! These Terms govern your access to and use of the
          Furlo app, pet profiles, community packs, and associated services. By registering or using Furlo, you
          agree to comply with these Terms.
        </Text>
      </View>

      <Text style={s.sectionTitle}>1. Account Eligibility</Text>
      <Text style={s.body}>
        You must be at least 18 years of age (or have parental/guardian consent) to register. One human account
        may manage up to 5 pet profiles ("Paw Prints").
      </Text>

      <Text style={s.sectionTitle}>2. Pets-as-Actors Model</Text>
      <Text style={s.body}>
        Pet profiles are the public-facing identity on Furlo. You, as the account owner, are responsible for all
        content posted under your pet's profile.
      </Text>

      <Text style={s.sectionTitle}>3. Community Code of Conduct</Text>
      <Text style={s.body}>
        Be respectful, do not post harmful, abusive, or misleading content, and do not impersonate others. Furlo
        reserves the right to remove content and suspend accounts that violate community guidelines.
      </Text>

      <Text style={s.sectionTitle}>4. Veterinary & Medical Disclaimer</Text>
      <Text style={s.body}>
        Content on Furlo is shared by pet lovers and owners and is not a substitute for professional veterinary
        guidance. Always consult a licensed veterinarian for medical decisions about your pet.
      </Text>

      <Text style={s.sectionTitle}>5. Governing Law</Text>
      <Text style={s.body}>
        These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of
        the courts in Bengaluru, Karnataka. Questions? Email{' '}
        <Text style={s.bodyStrong}>support@furlopets.in</Text>.
      </Text>

      <CommunityDisclaimerFooter />
    </InfoPageLayout>
  );
}
