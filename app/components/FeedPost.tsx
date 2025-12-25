import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  Heart,
  MessageSquare,
  Share2,
  Play,
  Pause,
  FileText,
  BadgeCheck,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Post } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface FeedPostProps {
  post: Post;
  isFollowing: boolean;
  onFollow: (userId: string) => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  primaryColor: string;
  borderColor: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const formatTime = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

export default function FeedPost({
  post,
  isFollowing,
  onFollow,
  onLike,
  onComment,
  onShare,
  primaryColor,
  borderColor,
}: FeedPostProps) {
  const router = useRouter();
  const { colors } = useTheme();
  
  // Media State
  const videoRef = useRef<Video>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>(null); 
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync(); 
      }
    };
  }, [sound]);

  const toggleAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        setLoadingAudio(true);
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: post.mediaUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setAudioPosition(status.positionMillis);
              setAudioDuration(status.durationMillis || 0);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setAudioPosition(0);
                newSound.setPositionAsync(0);
              }
            }
          }
        );
        setSound(newSound);
        setLoadingAudio(false);
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error playing audio', error);
      setLoadingAudio(false);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const toggleVideo = async () => {
    if (!videoRef.current) return;
    if (videoStatus?.isPlaying) {
        await videoRef.current.pauseAsync();
    } else {
        await videoRef.current.playAsync();
    }
  };
  
  const handleScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / SCREEN_WIDTH) + 1;
      setCurrentPage(page);
  };

  const renderMedia = () => {
    const defaultRatio = post.type === 'video' ? 16/9 : 1; 
    const aspectRatio = (post.media?.width && post.media?.height) 
      ? post.media.width / post.media.height 
      : defaultRatio;

    if (post.type === 'video') {
      return (
        <View style={[styles.mediaContainer, { aspectRatio }]}>
          <Video
            ref={videoRef}
            style={styles.media}
            source={{ uri: post.mediaUrl }}
            useNativeControls={false} 
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            posterSource={{ uri: post.thumbnailUrl }}
            usePoster
            onPlaybackStatusUpdate={status => setVideoStatus(status)}
          />
          {(!videoStatus?.isPlaying || videoStatus?.didJustFinish) && (
              <TouchableOpacity style={styles.centerOverlay} onPress={toggleVideo}>
                  <View style={[styles.playButtonCircle, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                      <Play size={32} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                  </View>
              </TouchableOpacity>
          )}
          {videoStatus?.isPlaying && (
              <TouchableOpacity style={styles.fullOverlay} onPress={toggleVideo} />
          )}
        </View>
      );
    }

    if (post.type === 'audio') {
      return (
        <View style={[styles.audioCard, { backgroundColor: colors.surface }]}>
           <View style={styles.audioRow}>
              <TouchableOpacity onPress={toggleAudio} disabled={loadingAudio}>
                  {loadingAudio ? (
                      <ActivityIndicator color={primaryColor} />
                  ) : isPlaying ? (
                      <Pause size={32} color={primaryColor} fill={primaryColor} />
                  ) : (
                      <Play size={32} color={primaryColor} fill={primaryColor} />
                  )}
              </TouchableOpacity>
              
              <View style={styles.audioProgress}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(audioPosition)}</Text>
                  <Slider
                      style={{ flex: 1, marginHorizontal: 8 }}
                      minimumValue={0}
                      maximumValue={audioDuration || 100}
                      value={audioPosition}
                      minimumTrackTintColor={primaryColor}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={primaryColor}
                      onSlidingComplete={handleSeek}
                      disabled={!sound}
                  />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                      {audioDuration ? formatTime(audioDuration) : '--:--'}
                  </Text>
              </View>
           </View>
        </View>
      );
    }

    if (post.type === 'script') {
        const isPdf = post.mediaUrl.toLowerCase().endsWith('.pdf') || (post.media?.format === 'pdf');
        
        // Unified LinkedIn Style Carousel: Always attempt to show slides
        if (isPdf) {
            // Default to 3 pages if metadata missing, to enable sliding for legacy/unknown PDFs
            const pages = post.media?.pages || 3; 
            
            const pageUrls = [];
            const baseUrl = post.mediaUrl.replace(/\.pdf$/i, '.jpg'); 
            const uploadIndex = baseUrl.indexOf('/upload/');
            const hasUpload = uploadIndex > -1;

            if (hasUpload) {
                const prefix = baseUrl.substring(0, uploadIndex + 8); 
                const suffix = baseUrl.substring(uploadIndex + 8);
                // Limit to 20 pages max for performance
                for (let i = 1; i <= Math.min(pages, 20); i++) {
                     pageUrls.push(`${prefix}pg_${i}/${suffix}`);
                }
                
                return (
                    <View style={styles.pdfCarouselContainer}>
                        <FlatList
                            data={pageUrls}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item}
                            onScroll={handleScroll}
                            renderItem={({ item }) => (
                                <View style={{ width: SCREEN_WIDTH, height: 500, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                                    <Image 
                                        source={{ uri: item }} 
                                        style={{ width: '100%', height: '100%' }} 
                                        contentFit="contain"
                                        transition={200}
                                    />
                                </View>
                            )}
                        />
                         <View style={styles.pdfOverlayBottom}>
                            <View style={styles.pageBadge}>
                                <Text style={styles.pageBadgeText}>{currentPage} {pages > 1 ? `/ ${pages}` : ''}</Text>
                            </View>
                        </View>
                    </View>
                );
            }
        }
        
        // Fallback for non-PDF scripts (generic doc)
        return (
            <TouchableOpacity 
                style={[styles.scriptCard, { backgroundColor: colors.surface }]}
                onPress={() => WebBrowser.openBrowserAsync(post.mediaUrl)}
            >
                <View style={styles.genericScriptCard}>
                    <View style={styles.scriptIcon}>
                        <FileText size={48} color={primaryColor} />
                    </View>
                    <Text style={[styles.scriptTitle, { color: colors.text }]}>Document</Text>
                    <Text style={[styles.scriptSubtitle, { color: primaryColor }]}>Tap to Open</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Image
    return (
      <View style={[styles.mediaContainer, { aspectRatio }]}>
        <Image
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            contentFit="cover"
            transition={200}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
           <Image source={{ uri: post.user.avatar }} style={styles.avatar} contentFit="cover" />
           <View style={{ marginLeft: 12, flex: 1 }}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.user.id } })}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>{post.user.name}</Text>
                    {post.user.isVerified && <BadgeCheck size={16} color={primaryColor} fill="transparent" />}
                 </View>
              </TouchableOpacity>
              <Text style={[styles.role, { color: colors.textSecondary }]}>{post.user.roles?.[0] || 'Member'}</Text>
           </View>
           
            <TouchableOpacity 
                style={[styles.followBtn, { backgroundColor: isFollowing ? 'transparent' : primaryColor, borderColor: isFollowing ? borderColor : primaryColor, borderWidth: 1 }]}
                onPress={() => onFollow(post.user.id)}
            >
                <Text style={{ color: isFollowing ? colors.text : '#fff', fontSize: 12, fontWeight: '600' }}>
                    {isFollowing ? 'Following' : 'Follow'}
                </Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ width: '100%', minHeight: 200, backgroundColor: '#000' }}>
          {renderMedia()}
      </View>

      <View style={styles.content}>
         <Text style={[styles.caption, { color: colors.text }]}>{post.caption}</Text>
         <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{post.createdAt}</Text>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: borderColor }]}>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)}>
             <Heart size={24} color={post.isLiked ? colors.error : colors.textSecondary} fill={post.isLiked ? colors.error : 'transparent'} />
             <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.likes}</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(post.id)}>
             <MessageSquare size={24} color={colors.textSecondary} />
             <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.comments}</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(post.id)}>
             <Share2 size={24} color={colors.textSecondary} />
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  header: {
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mediaContainer: {
    width: '100%',
    maxHeight: 600, // Prevent ultra-tall images
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Audio Styles
  audioCard: {
      padding: 16,
      width: '100%',
      minHeight: 120,
      justifyContent: 'center',
  },
  audioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  audioProgress: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
  },
  timeText: {
      fontSize: 12,
      fontVariant: ['tabular-nums'],
  },
  
  // Script Styles
  scriptContainer: {
     width: '100%',
     backgroundColor: '#f5f5f5',
  },
  scriptCard: {
      width: '100%',
      minHeight: 250,
      backgroundColor: '#f5f5f5',
  },
  genericScriptCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      height: 250,
  },
  scriptIcon: {
      padding: 16,
      borderRadius: 40,
      backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scriptTitle: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  scriptSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
  },
  
  // PDF Carousel (LinkedIn Style)
  pdfCarouselContainer: {
      width: '100%',
      height: 500,
      position: 'relative',
      backgroundColor: '#333',
  },
  pdfOverlayBottom: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
  },
  pageBadge: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  pageBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
  },
  readButtonSmall: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
  },
  readButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
  },
  pdfChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 24,
  },
  pdfChipText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
  },

  // Video Custom Controls
  centerOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
  },
  fullOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 5,
  },
  playButtonCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
  }
});
