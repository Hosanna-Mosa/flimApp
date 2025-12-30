import { UserRole } from '@/types';

export interface RoleData {
  id: UserRole;
  label: string;
  icon: string;
}

export const ROLES: RoleData[] = [
  { id: 'actor', label: 'Actor', icon: '🎭' },
  { id: 'director', label: 'Director', icon: '🎬' },
  { id: 'producer', label: 'Producer', icon: '🎥' },
  { id: 'production_manager', label: 'Production Manager', icon: '📋' },
  { id: 'casting_artists', label: 'Casting / Artists', icon: '👥' },
  { id: 'story_screenplay_writer', label: 'Story / Screenplay Writer', icon: '✍️' },
  { id: 'dialogue_writer', label: 'Dialogue Writer', icon: '📜' },
  { id: 'music_director_composer', label: 'Music Director / Composer', icon: '🎵' },
  { id: 'lyrics_writer', label: 'Lyrics Writer', icon: '✒️' },
  { id: 'cinematographer_dop', label: 'Cinematographer (DOP)', icon: '📹' },
  { id: 'art_director', label: 'Art Director', icon: '🎨' },
  { id: 'makeup_department', label: 'Make-up Department', icon: '💄' },
  { id: 'costume_designer', label: 'Costume Designer', icon: '👗' },
  { id: 'choreographer', label: 'Choreographer', icon: '💃' },
  { id: 'stunt_master_action_director', label: 'Stunt Master / Action Director', icon: '🤺' },
  { id: 'editor', label: 'Editor', icon: '✂️' },
  { id: 'sound_designer_engineer', label: 'Sound Designer / Sound Engineer', icon: '🔊' },
  { id: 'playback_singers', label: 'Playback Singers', icon: '🎤' },
  { id: 'dubbing_artists', label: 'Dubbing Artists', icon: '🎙️' },
  { id: 'vfx_cgi_department', label: 'VFX / CGI Department', icon: '💻' },
  { id: 'lighting_technicians', label: 'Lighting Technicians', icon: '💡' },
  { id: 'camera_assistants_focus_pullers', label: 'Camera Assistants / Focus Pullers', icon: '🎥' },
  { id: 'set_designers_workers', label: 'Set Designers / Set Workers', icon: '🔨' },
  { id: 'production_assistants_ad_team', label: 'Production Assistants / AD Team', icon: '📢' },
  { id: 'publicity_promotion_pro', label: 'Publicity & Promotion / PRO', icon: '📣' },
];
