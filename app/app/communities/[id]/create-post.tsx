import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { CommunityGroup } from '@/types';
import { Image as ImageIcon, BarChart2, X, ChevronDown, Plus } from 'lucide-react-native';

export default function CreatePostScreen() {
  const { id, groupId: initialGroupId } = useLocalSearchParams<{ id: string, groupId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || '');
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [postType, setPostType] = useState<'text' | 'poll'>('text');

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      if (id) {
        // Get role first
        const comRes = await api.community(id, token || undefined) as any;
        const role = comRes?.memberRole;
        const isAdmin = role === 'admin' || role === 'owner';

        const res = await api.communityGroups(id, token || undefined) as any;

        // Filter groups: Members can join any, but can only post to non-announcement groups
        // Admins can post to any.
        const postableGroups = (res || []).filter((g: any) => {
          if (!g.isMember) return false;
          if (g.isAnnouncementOnly && !isAdmin) return false;
          return true;
        });

        setGroups(postableGroups);
        if (!groupId && postableGroups.length > 0) {
          setGroupId(postableGroups[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && postType === 'text') return;
    if (postType === 'poll' && (!pollQuestion.trim() || pollOptions.some(o => !o.trim()))) {
      Alert.alert('Error', 'Please fill all poll fields');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        groupId,
        type: postType,
        content: content || (postType === 'poll' ? pollQuestion : 'Media'),
      };

      if (postType === 'poll') {
        payload.poll = {
          question: pollQuestion,
          options: pollOptions.map(text => ({ text })),
          allowMultiple: false
        };
      }

      if (id) {
        const res = await api.createCommunityPost(id, payload, token || undefined) as any;
        if (res && res.status === 'success') {
          // Success
        }
      }

      // Navigate back
      if (groupId) {
        try {
          router.replace({
            pathname: '/communities/[id]/groups/[groupId]',
            params: { id: id!, groupId }
          });
        } catch (e) {
          router.back();
        }
      } else {
        router.back();
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroupName = groups.find(g => g._id === groupId)?.name || 'Select Group';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'New Post',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={handlePost}
              disabled={submitting || (postType === 'text' && !content.trim())}
            >
              <Text style={{
                color: colors.primary,
                fontWeight: '600',
                opacity: submitting ? 0.5 : 1
              }}>
                Post
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      {/* Group Selector */}
      <TouchableOpacity
        style={[styles.groupSelector, { borderBottomColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.toText, { color: colors.textSecondary }]}>To:</Text>
        <View style={[styles.groupChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupName, { color: colors.text }]}>{selectedGroupName}</Text>
          <ChevronDown size={14} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        {postType === 'text' ? (
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
          />
        ) : (
          <View style={styles.pollForm}>
            <TextInput
              style={[styles.pollInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="Ask a question..."
              placeholderTextColor={colors.textSecondary}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />
            {pollOptions.map((option, index) => (
              <View key={index} style={styles.pollOptionRow}>
                <TextInput
                  style={[styles.pollOptionInput, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.textSecondary}
                  value={option}
                  onChangeText={(text) => handleOptionChange(text, index)}
                />
                {pollOptions.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(index)} style={{ padding: 8 }}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {pollOptions.length < 5 && (
              <TouchableOpacity
                style={[styles.addOptionButton, { borderColor: colors.primary }]}
                onPress={addOption}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={[styles.addOptionText, { color: colors.primary }]}>Add Option</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Toolbar */}
      <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.toolIcon} onPress={() => setPostType('text')}>
          <Text style={{ color: postType === 'text' ? colors.primary : colors.textSecondary, fontWeight: '600' }}>Aa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolIcon}>
          <ImageIcon size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolIcon} onPress={() => setPostType('poll')}>
          <BarChart2 size={24} color={postType === 'poll' ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Group Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Group</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {groups.map(g => (
              <TouchableOpacity
                key={g._id}
                style={[styles.groupItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setGroupId(g._id);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.groupItemName, { color: colors.text, fontWeight: g._id === groupId ? 'bold' : 'normal' }]}>
                  {g.name}
                </Text>
                {g._id === groupId && <Text style={{ color: colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toText: {
    marginRight: 8,
    fontSize: 16,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  groupName: {
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    fontSize: 18,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  toolIcon: {
    padding: 8,
  },
  pollForm: {
    gap: 12,
    paddingBottom: 40,
  },
  pollInput: {
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollOptionInput: {
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupItemName: {
    fontSize: 16,
  }
});
