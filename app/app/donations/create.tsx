import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import ContentTypePicker from '@/components/media/ContentTypePicker';
import MediaUploadBox from '@/components/media/MediaUploadBox';
import CaptionField from '@/components/media/CaptionField';
import SubmitFooter from '@/components/media/SubmitFooter';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { DONATION_UPLOAD_OPTIONS, capitalizeType } from '@/constants/uploadOptions';

export default function CreateDonationScreen() {
  const router = useRouter();
  const u = useMediaUpload({ isDonation: true, initialType: 'text' });
  const type = u.selectedType ?? 'text';

  return (
    <Screen
      title="Ask for Crowd Funding"
      headerLeft={() => <HeaderIconButton icon={X} onPress={() => router.back()} style={{ marginLeft: 0 }} />}
      footer={
        <SubmitFooter
          title={u.uploading ? 'Posting...' : 'Post Request'}
          onPress={u.submit}
          disabled={u.uploading}
        />
      }
    >
      <ContentTypePicker
        title="Choose Format"
        options={DONATION_UPLOAD_OPTIONS}
        value={type}
        onSelect={u.selectType}
        variant="row"
      />

      {type !== 'text' && (
        <MediaUploadBox
          type={type}
          file={u.mediaFile}
          onPick={u.pickMedia}
          onRemove={u.removeMedia}
          disabled={u.uploading}
          placeholderLabel={`Upload ${capitalizeType(type)}`}
          height={200}
        />
      )}

      <View style={{ marginTop: 24 }}>
        <CaptionField
          label={type === 'text' ? 'Your Story' : 'Caption'}
          placeholder="Tell people why you need support..."
          value={u.caption}
          onChangeText={u.setCaption}
          height={150}
          editable={!u.uploading}
        />
      </View>
    </Screen>
  );
}
