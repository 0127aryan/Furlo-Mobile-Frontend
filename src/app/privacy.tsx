import { Text, View } from 'react-native';

import { CommunityDisclaimerFooter } from '@/components/common/CommunityDisclaimerFooter';
import { InfoPageLayout } from '@/components/common/InfoPageLayout';
import { infoPageStyles as s } from '@/components/common/infoPageStyles';

export default function PrivacyScreen() {
  return (
    <InfoPageLayout title="Privacy Policy">
      <Text style={s.eyebrow}>Legal & Data Protection</Text>
      <Text style={s.meta}>Last Updated: June 2026 · DPDPA 2023 Compliant</Text>
      <View style={s.intro}>
        <Text style={s.introText}>
          At <Text style={s.introStrong}>Furlo</Text>, we value your trust and are committed to protecting the
          privacy of our community members and their furry companions. This policy explains how we collect, use,
          and safeguard your information in compliance with India's{' '}
          <Text style={s.introStrong}>Digital Personal Data Protection Act (DPDPA), 2023</Text>.
        </Text>
      </View>

      <Text style={s.sectionTitle}>1. What Data We Collect</Text>
      <Text style={s.body}>
        Account data (email, credentials), pet profile data (name, breed, bio, photos), community interactions
        (posts, comments, treats), and technical data (device type, IP address, usage logs).
      </Text>

      <Text style={s.sectionTitle}>2. What We Do NOT Collect</Text>
      <Text style={s.body}>
        We do not collect precise GPS location, financial or payment card data, or sensitive health records unless
        you voluntarily share them in posts.
      </Text>

      <Text style={s.sectionTitle}>3. How We Use Your Data</Text>
      <Text style={s.body}>
        To operate your account and pet profiles, deliver the feed and pack features, improve platform safety,
        and send essential service notifications. We do not sell personal data to third parties.
      </Text>

      <Text style={s.sectionTitle}>4. Your DPDPA Rights</Text>
      <Text style={s.body}>
        You may request access, correction, or deletion of your personal data. Contact our Grievance Officer at{' '}
        <Text style={s.bodyStrong}>support@furlopets.in</Text> for any privacy-related requests.
      </Text>

      <CommunityDisclaimerFooter />
    </InfoPageLayout>
  );
}
