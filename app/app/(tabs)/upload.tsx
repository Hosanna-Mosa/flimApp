import React from 'react';
import { View } from 'react-native';
import Screen from '@/components/layout/Screen';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ContentTypePicker from '@/components/media/ContentTypePicker';
import UploadFormHeader from '@/components/media/UploadFormHeader';
import MediaUploadBox from '@/components/media/MediaUploadBox';
import CaptionField from '@/components/media/CaptionField';
import UploadProgressBar from '@/components/media/UploadProgressBar';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { UPLOAD_OPTIONS, capitalizeType } from '@/constants/uploadOptions';

export default function UploadScreen() {
  const u = useMediaUpload();
  const isText = u.selectedType === 'text';

  return (
    <Screen title="Create Post">
      {!u.selectedType ? (
        <ContentTypePicker
          title="What are you creating?"
          options={UPLOAD_OPTIONS}
          value={u.selectedType}
          onSelect={u.selectType}
          variant="grid"
        />
      ) : (
        <View style={{ gap: 24 }}>
          <UploadFormHeader
            title={`New ${capitalizeType(u.selectedType)}`}
            onClose={u.resetForm}
            disabled={u.uploading}
          />

          {!isText && (
            <MediaUploadBox
              type={u.selectedType}
              file={u.mediaFile}
              onPick={u.pickMedia}
              disabled={u.uploading}
            />
          )}

          <View style={{ gap: 16 }}>
            <CaptionField
              label={isText ? 'Post Content' : 'Caption'}
              placeholder={isText ? "What's on your mind?" : 'Write a caption...'}
              value={u.caption}
              onChangeText={u.setCaption}
              numberOfLines={isText ? 8 : 4}
              height={isText ? 200 : 100}
              editable={!u.uploading}
            />
            <Input
              label="Roles (comma separated)"
              placeholder="e.g. Actor, Director"
              value={u.roles}
              onChangeText={u.setRoles}
              editable={!u.uploading}
            />
            <Input
              label="Industries (comma separated)"
              placeholder="e.g. Bollywood, Tollywood"
              value={u.industries}
              onChangeText={u.setIndustries}
              editable={!u.uploading}
            />
          </View>

          <Button
            title={u.uploading ? `Uploading ${u.uploadProgress}%` : 'Post'}
            onPress={u.submit}
            loading={u.uploading}
            disabled={(!u.mediaFile && !isText) || !u.caption || u.uploading}
            size="large"
          />

          {u.uploading && <UploadProgressBar progress={u.uploadProgress} />}
        </View>
      )}
    </Screen>
  );
}
