import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import Screen from '@/components/layout/Screen';
import PostHeaderAction from '@/components/communities/poll/PostHeaderAction';
import GroupSelectorRow from '@/components/communities/poll/GroupSelectorRow';
import PollForm from '@/components/communities/poll/PollForm';
import GroupPickerSheet from '@/components/communities/poll/GroupPickerSheet';
import { useNewPoll } from '@/hooks/useNewPoll';

export default function CreatePostScreen() {
  const { id, groupId: initialGroupId } = useLocalSearchParams<{ id: string; groupId?: string }>();
  const p = useNewPoll(id, initialGroupId);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <Screen
      title="New Poll"
      keyboard
      padded={false}
      headerRight={() => <PostHeaderAction onPress={p.submit} disabled={p.submitting || !p.isValid} />}
    >
      <GroupSelectorRow groupName={p.selectedGroupName} onPress={() => setPickerVisible(true)} />

      <PollForm
        question={p.question}
        onChangeQuestion={p.setQuestion}
        options={p.options}
        onChangeOption={p.changeOption}
        onRemoveOption={p.removeOption}
        onAddOption={p.addOption}
      />

      <GroupPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        groups={p.groups}
        selectedGroupId={p.groupId}
        onSelect={(groupId) => {
          p.setGroupId(groupId);
          setPickerVisible(false);
        }}
      />
    </Screen>
  );
}
