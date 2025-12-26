import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityPost } from '@/types';
import { Heart, MessageCircle, MoreHorizontal, BarChart2 } from 'lucide-react-native';
// import { Heart, MessageCircle, MoreHorizontal, BarChart2 } from 'lucide-react-native';

const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

interface CommunityPostCardProps {
  post: CommunityPost;
  onPress: () => void;
  onLike: () => void;
  onVote: (optionIndex: number) => void;
}

export default function CommunityPostCard({ post, onPress, onLike, onVote }: CommunityPostCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [voting, setVoting] = useState(false);

  const handleVote = async (index: number) => {
    if (voting || post.hasVoted) return;
    setVoting(true);
    await onVote(index);
    setVoting(false);
  };

  const totalVotes = post.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={post.author.avatar}
          style={[styles.avatar, { backgroundColor: colors.background }]}
        />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {post.author.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTimeAgo(post.createdAt)} • {post.group}
          </Text>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <Image
          source={post.media[0].url}
          style={[styles.media, { height: width * 0.6 }]}
          contentFit="cover"
        />
      )}

      {/* Poll */}
      {post.type === 'poll' && post.poll && (
        <View style={[styles.pollContainer, { borderColor: colors.border }]}>
          <Text style={[styles.pollQuestion, { color: colors.text }]}>
            <BarChart2 size={16} color={colors.primary} /> {post.poll.question}
          </Text>
          
          {post.poll.options.map((option, index) => {
            const votes = option.votes.length;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const isSelected = option.votes.includes(post.author.id); // Hack: need current user id to check voting properly

            return (
              <TouchableOpacity
                key={index}
                style={[styles.pollOption, { backgroundColor: colors.background }]}
                onPress={() => handleVote(index)}
                disabled={post.hasVoted}
              >
                <View 
                  style={[
                    styles.pollProgress, 
                    { 
                      width: `${percentage}%`, 
                      backgroundColor: isSelected ? colors.primary + '30' : colors.border 
                    }
                  ]} 
                />
                <View style={styles.pollContent}>
                  <Text style={[styles.pollText, { color: colors.text }]}>{option.text}</Text>
                  <Text style={[styles.pollVotes, { color: colors.textSecondary }]}>
                    {option.votes} votes
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.totalVotes, { color: colors.textSecondary }]}>
            {totalVotes} votes
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Heart 
            size={20} 
            color={post.isLiked ? '#E0245E' : colors.text} 
            fill={post.isLiked ? '#E0245E' : 'transparent'} 
          />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {post.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  media: {
    width: '100%',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  pollContainer: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pollOption: {
    height: 44,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pollProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  pollContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pollText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pollVotes: {
    fontSize: 12,
  },
  totalVotes: {
    fontSize: 12,
    marginTop: 4,
  },
});
