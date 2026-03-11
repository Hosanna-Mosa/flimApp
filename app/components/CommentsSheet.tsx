import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'expo-image';
import { Send, X, BadgeCheck, MessageCircle, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { useRouter } from 'expo-router';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Comment {
    _id: string;
    content: string;
    user: {
        _id: string;
        name: string;
        avatar: string;
        isVerified: boolean;
    };
    createdAt: string;
    likesCount?: number;
    repliesCount?: number;
    replies?: Comment[];
}

interface CommentsSheetProps {
    postId: string | null;
    postOwnerId?: string;
    isVisible: boolean;
    onClose: () => void;
    onCommentAdded?: (postId: string) => void;
    onCommentDeleted?: (postId: string, count: number) => void;
}

export default function CommentsSheet({ postId, postOwnerId, isVisible, onClose, onCommentAdded, onCommentDeleted }: CommentsSheetProps) {
    const { colors } = useTheme();
    const { token, user } = useAuth();
    const router = useRouter();

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [totalCommentsCount, setTotalCommentsCount] = useState(0);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Load comments when sheet becomes visible
    useEffect(() => {
        if (isVisible && postId) {
            loadComments();
        }
    }, [isVisible, postId]);

    // Reset local sheet state ONLY when changing to a different post
    useEffect(() => {
        if (!postId) return;

        // Reset state for new post
        setComments([]);
        setCommentText('');
        setReplyTo(null);
        setExpandedComments(new Set());
    }, [postId]);

    const loadComments = async () => {
        if (!postId) return;
        try {
            setLoading(true);
            const result = await api.getComments(postId, 0, 50, 'recent', token || undefined) as any;
            // Handle various response structures defensively
            const commentsArray = Array.isArray(result) ? result :
                (result?.data && Array.isArray(result.data) ? result.data : []);
            setComments(commentsArray);

            // Set total count if the API provides it, otherwise calculate from what we have
            const count = result.totalComments ?? result.total ?? (commentsArray.length + commentsArray.reduce((acc: number, c: any) => acc + (c.repliesCount || 0), 0));
            setTotalCommentsCount(count);
        } catch (error) {
            // console.error('[CommentsSheet] Error loading:', error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !postId) return;

        try {
            setSubmitting(true);
            const parentId = replyTo?._id;
            const result = await api.addComment(postId, commentText.trim(), parentId, token || undefined) as any;
            const newComment = result.data || result;

            if (parentId) {
                // Add as reply to local state
                setComments(prev => prev.map(c => {
                    if (c._id === parentId) {
                        return {
                            ...c,
                            repliesCount: (c.repliesCount || 0) + 1,
                            replies: [newComment, ...(c.replies || [])]
                        };
                    }
                    return c;
                }));
                // Auto-expand the parent comment
                setExpandedComments(prev => new Set([...prev, parentId]));
            } else {
                // Add as top-level comment
                setComments(prev => [newComment, ...prev]);
            }

            setTotalCommentsCount(prev => prev + 1);
            setCommentText('');
            setReplyTo(null);
            Keyboard.dismiss();

            if (onCommentAdded) {
                onCommentAdded(postId);
            }
        } catch (error) {
            // console.error('[CommentsSheet] Error adding:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleReplies = async (commentId: string) => {
        const isExpanded = expandedComments.has(commentId);

        if (!isExpanded) {
            // Check if replies are already loaded
            const parentComment = comments.find(c => c._id === commentId);
            if (parentComment && (!parentComment.replies || parentComment.replies.length === 0)) {
                try {
                    const result = await api.getCommentReplies(commentId, 0, 50, token || undefined) as any;
                    const repliesArray = Array.isArray(result) ? result :
                        (result?.data && Array.isArray(result.data) ? result.data : []);

                    if (repliesArray.length > 0) {
                        setComments(prev => prev.map(c => {
                            if (c._id === commentId) {
                                return { ...c, replies: repliesArray };
                            }
                            return c;
                        }));
                    }
                } catch (error) {
                    // silent err
                }
            }
        }

        setExpandedComments(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

    const handleReplyPress = (comment: Comment) => {
        setReplyTo(comment);
        inputRef.current?.focus();
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!token) return;

        // Find the comment to know if it has replies (for count update)
        let removedCount = 1;
        const findCommentRecursive = (list: Comment[]): Comment | null => {
            for (const c of list) {
                if (c._id === commentId) return c;
                if (c.replies) {
                    const found = findCommentRecursive(c.replies);
                    if (found) return found;
                }
            }
            return null;
        };
        const targetComment = findCommentRecursive(comments);
        if (targetComment && !targetComment.parentComment) {
            // If it's a top-level comment, we assume all its replies are also deleted
            removedCount = 1 + (targetComment.repliesCount || 0);
        }

        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteComment(commentId, token);
                            // Update local state - remove comment or update nested replies
                            setComments(prev => {
                                // Try to find and remove from top level
                                const filtered = prev.filter(c => c._id !== commentId);
                                if (filtered.length !== prev.length) return filtered;

                                // If not at top level, check replies of each comment
                                return prev.map(c => {
                                    if (c.replies) {
                                        return {
                                            ...c,
                                            replies: c.replies.filter(r => r._id !== commentId),
                                            repliesCount: c.replies.some(r => r._id === commentId)
                                                ? (c.repliesCount || 1) - 1
                                                : c.repliesCount
                                        };
                                    }
                                    return c;
                                });
                            });

                            setTotalCommentsCount(prev => Math.max(0, prev - removedCount));
                            if (onCommentDeleted && postId) {
                                onCommentDeleted(postId, removedCount);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete comment');
                        }
                    }
                }
            ]
        );
    };

    const renderCommentItem = useCallback((item: Comment, isReply = false) => {
        if (!item) return null;

        const userName = item.user?.name || 'User';
        const userAvatar = item.user?.avatar || 'https://via.placeholder.com/36';
        const userId = item.user?._id;
        const currentUserId = user?.id || user?._id;
        const commentAuthorId = item.user?._id;

        // Ensure boolean outcome to avoid '0' being rendered in JSX
        const isExpanded = !!expandedComments.has(item._id);
        const hasReplies = !!(item.repliesCount && item.repliesCount > 0);

        // Strict ownership check (compare as strings and ensure neither is empty)
        const isOwner = !!(currentUserId && commentAuthorId && String(currentUserId) === String(commentAuthorId));
        const isPostOwner = !!(currentUserId && postOwnerId && String(currentUserId) === String(postOwnerId));

        return (
            <View key={item._id || `comment-${userName}`} style={[styles.commentContainer, isReply ? styles.replyContainer : null]}>
                <View style={styles.commentItem}>
                    <TouchableOpacity onPress={() => userId && (onClose(), router.push(`/user/${userId}`))}>
                        <Image
                            source={{ uri: userAvatar }}
                            style={isReply ? styles.replyAvatar : styles.commentAvatar}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <View style={styles.commentTitleContainer}>
                                <TouchableOpacity onPress={() => userId && (onClose(), router.push(`/user/${userId}`))}>
                                    <View style={styles.commentNameRow}>
                                        <Text style={[styles.commentUserName, { color: colors.text }]}>{String(userName)}</Text>
                                        {item.user?.isVerified ? (
                                            <BadgeCheck size={12} color="#FFFFFF" fill="#0095F6" />
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                                <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                                    {String(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.commentText, { color: colors.text }]}>{String(item.content || '')}</Text>

                        <View style={styles.commentActions}>
                            <TouchableOpacity onPress={() => handleReplyPress(item)} style={styles.actionButton}>
                                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Reply</Text>
                            </TouchableOpacity>

                            {(isOwner || isPostOwner) && (
                                <TouchableOpacity onPress={() => handleDeleteComment(item._id)} style={styles.actionButton}>
                                    <Trash2 size={14} color={colors.error || '#FF3B30'} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {(!isReply && hasReplies) ? (
                            <TouchableOpacity onPress={() => toggleReplies(item._id)} style={styles.viewRepliesButton}>
                                <View style={[styles.repliesLine, { backgroundColor: colors.border }]} />
                                <Text style={[styles.viewRepliesText, { color: colors.textSecondary }]}>
                                    {isExpanded ? 'Hide replies' : `View ${item.repliesCount} replies`}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {(isExpanded && (item.replies?.length || 0) > 0) ? (
                    <View style={styles.repliesList}>
                        {item.replies?.map(reply => renderCommentItem(reply, true))}
                    </View>
                ) : null}
            </View>
        );
    }, [colors, expandedComments, user, postOwnerId, onClose, router, handleDeleteComment, handleReplyPress, toggleReplies]);

    const renderComment = useCallback(({ item }: { item: Comment }) => renderCommentItem(item), [renderCommentItem]);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                            style={[styles.sheetContainer, { backgroundColor: '#121212', borderTopColor: colors.border }]}
                        >
                            <View style={styles.indicator} />

                            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.headerTitle, { color: colors.text }]}>Comments ({totalCommentsCount})</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : comments.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <MessageCircle size={48} color={colors.textSecondary} opacity={0.3} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No comments yet</Text>
                                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first to share your thoughts!</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={Array.isArray(comments) ? comments : []}
                                    renderItem={renderComment}
                                    keyExtractor={(item, index) => item?._id || `comment-${index}`}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                />
                            )}

                            <View style={[styles.footer, { paddingBottom: isKeyboardVisible ? 12 : 30 }]}>
                                {replyTo && (
                                    <View style={[styles.replyToBar, { backgroundColor: '#262626' }]}>
                                        <Text style={[styles.replyToText, { color: colors.textSecondary }]}>
                                            Replying to <Text style={{ fontWeight: 'bold' }}>{replyTo.user?.name}</Text>
                                        </Text>
                                        <TouchableOpacity onPress={() => setReplyTo(null)}>
                                            <X size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={[styles.inputContainer, {
                                    backgroundColor: '#1A1A1A',
                                    borderTopColor: colors.border,
                                }]}>
                                    <Image
                                        source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
                                        style={styles.userAvatar}
                                        contentFit="cover"
                                    />
                                    <TextInput
                                        ref={inputRef}
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder={replyTo ? `Reply to ${replyTo.user?.name}...` : "Add a comment..."}
                                        placeholderTextColor={colors.textSecondary}
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                        maxLength={500}
                                    />
                                    <TouchableOpacity
                                        onPress={handleAddComment}
                                        disabled={!commentText.trim() || submitting}
                                        style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.5 }]}
                                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    >
                                        <Text style={[styles.sendText, { color: colors.primary }]}>
                                            {submitting ? "..." : "Post"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        height: SCREEN_HEIGHT * 0.75,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
    },
    indicator: {
        width: 40,
        height: 5,
        backgroundColor: '#333',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeBtn: {
        position: 'absolute',
        right: 15,
        top: 12,
    },
    listContent: {
        padding: 15,
        paddingBottom: 20,
    },
    commentContainer: {
        marginBottom: 20,
    },
    commentItem: {
        flexDirection: 'row',
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    commentNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    commentTime: {
        fontSize: 11,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 18,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        marginRight: 10,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    viewRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    repliesLine: {
        width: 30,
        height: 1,
        marginRight: 10,
    },
    viewRepliesText: {
        fontSize: 12,
        fontWeight: '600',
    },
    replyContainer: {
        marginLeft: 40,
        marginTop: 10,
        marginBottom: 10,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 10,
    },
    repliesList: {
        marginTop: 5,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    replyToBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    replyToText: {
        fontSize: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        paddingTop: Platform.OS === 'ios' ? 8 : 0,
    },
    sendBtn: {
        paddingHorizontal: 12,
    },
    sendText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});
