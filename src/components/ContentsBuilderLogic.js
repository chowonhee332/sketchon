/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '../lib/gemini';

export function initContentsBuilder() {

  // --- DOM ELEMENT GETTERS ---
  // Home Screen elements
  const homeScreen = document.getElementById('home-screen');
  const navIconBuilder = document.getElementById('nav-icon-builder');
  const navImageBuilder = document.getElementById('nav-image-builder');
  const navVideoBuilder = document.getElementById('nav-video-builder');
  const homePromptInput = document.getElementById('home-prompt-input');
  const homeRunBtn = document.getElementById('home-run-btn');
  const homeCanvas = document.getElementById('home-canvas-background');


  // Icon Builder Screen elements
  const iconBuilderScreen = document.getElementById('icon-builder-screen');
  const backToHomeBtn = document.getElementById('back-to-home-btn');
  const iconGrid = document.getElementById('icon-grid');
  const searchInput = document.getElementById('search-input');

  // Image Builder Screen elements
  const imageBuilderScreen = document.getElementById('image-builder-screen');
  const imageBuilderBackBtn = document.getElementById('image-builder-back-btn');
  const imagePromptInput = document.getElementById('image-prompt-input');
  const imageNegativePromptInput = document.getElementById('image-negative-prompt-input');
  const generateImageBtn = document.getElementById('generate-image-btn');
  const generatedImageMain = document.getElementById('generated-image-main');
  const imageLoader = document.getElementById('image-loader');
  const imageErrorMessage = document.getElementById('image-error-message');


  // Shared elements
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');


  // Inspector Panel (for Icon Builder)
  const loader = document.getElementById('loader');
  const generatedImage = document.getElementById('generated-image');
  const generatedVideo = document.getElementById('generated-video');
  const errorMessage = document.getElementById('error-message');
  const promptInput = document.getElementById('prompt-input');
  const negativePromptInput = document.getElementById('negative-prompt-input');
  const regenerateBtn = document.getElementById('regenerate-btn');
  const downloadBtn = document.getElementById('download-btn');
  const convertToVideoBtn = document.getElementById('convert-to-video-btn');
  const inspectorPanel = document.getElementById('inspector-panel');
  const inspectorCloseBtn = document.getElementById('inspector-close-btn');
  const inspectorTabs = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const fillToggle = document.getElementById('fill-toggle');
  const weightSlider = document.getElementById('weight-slider');
  const gradeSlider = document.getElementById('grade-slider');
  const opticalSizeSlider = document.getElementById('optical-size-slider');
  const imageTabBtn = document.getElementById('image-tab-btn');
  const videoTabBtn = document.getElementById('video-tab-btn');
  const imageTabContent = document.getElementById('image-tab-content');
  const videoTabContent = document.getElementById('video-tab-content');
  const animationTypeSelect = document.getElementById('animation-type-select');
  const animationSpeedSelect = document.getElementById('animation-speed-select');
  const play3dAnimationBtn = document.getElementById('play-3d-animation-btn');
  const snippetHtmlCode = document.getElementById('snippet-html-code');
  const snippetCssCode = document.getElementById('snippet-css-code');
  const copyHtmlBtn = document.getElementById('copy-html-btn');
  const copyCssBtn = document.getElementById('copy-css-btn');
  const snippet3dSection = document.getElementById('code-snippet-3d-section');
  const snippet3dCode = document.getElementById('snippet-3d-code');
  const copy3dBtn = document.getElementById('copy-3d-btn');
  const previewBoxAnimation = document.getElementById('preview-box-animation');
  const previewAnimationType = document.getElementById('preview-animation-type');
  const previewAnimationRepeat = document.getElementById('preview-animation-repeat');
  const playAnimationBtn = document.getElementById('play-animation-btn');
  const snippetAnimSection = document.getElementById('code-snippet-anim-section');
  const snippetAnimKeyframesCode = document.getElementById('snippet-anim-keyframes-code');
  const snippetAnimClassCode = document.getElementById('snippet-anim-class-code');
  const copyAnimKeyframesBtn = document.getElementById('copy-anim-keyframes-btn');
  const copyAnimClassBtn = document.getElementById('copy-anim-class-btn');

  // --- STATE MANAGEMENT ---

  let currentStyle = {
    family: 'Outlined',
    fill: 0,
    weight: 400,
    grade: 0,
    opticalSize: 24,
  };
  let selectedIconName = null;
  let isLoading = false;
  let currentBase64Image = null;
  let currentIconIndex = 0;
  let observer = null;
  const sentinel = document.createElement('div');
  let filteredIconNames = [];

  // --- CONSTANTS ---
  const API_KEY = getGeminiKey();
  const ICONS_PER_BATCH = 100;
  const CREON_3D_BLUEPRINT = {
    "task": "generate isometric 3D icon",
    "style_lock": true,
    "subject": "[SUBJECT]",
    "guidance": {
      "aspect_ratio": "16:9",
      "instruction_strength": "strict",
      "priority_order": ["subject", "style_consistency", "color_palette", "material_spec"],
      "consistency_reference": "Match Creon 3D icon sheet: smooth glossy plastic, floating subject, uniform lighting."
    },
    "output": { "format": "png", "size": "1024x576", "background": "#FFFFFF", "alpha": true },
    "render": { "engine": "flash-3d", "quality": "ultra-high", "sampling": "deterministic", "postprocess": "clean" },
    "camera": { "type": "isometric", "lens": "orthographic", "tilt": "35deg", "pan": "35deg" },
    "lighting": { "mode": "soft global illumination", "source": "dual top-front softboxes", "highlights": "broad glossy bloom", "shadows": "internal occlusion only", "exposure": "balanced" },
    "materials": { "primary": "smooth high-gloss plastic", "secondary": "matte pastel plastic", "surface_detail": "no noise, no texture" },
    "colors": { "palette_name": "Creon Blue System", "dominant_blue": "#2962ff", "secondary_blue": "#4FC3F7", "neutral_white": "#FFFFFF", "warm_accent": "#FFD45A" },
    "form": { "shapes": "pillowy, inflated, soft-volume forms", "edges": "rounded with 85% fillet", "proportions": "chibi/stylized" }
  };

  const REFERENCE_IMAGES = [
    '/assets/references/creon_ref_1.png',
    '/assets/references/creon_ref_2.png',
    '/assets/references/creon_ref_3.png'
  ];

  const PROMPT_TEMPLATE_3D = `A high-quality 3D render of [SUBJECT], 
minimalist toy-like style, smooth plastic material, 
clean separated geometry parts, 
isometric perspective (25° tilt, 20° rotation), 
soft studio lighting, subtle shadows, 
pastel blue and white color palette, 
placed on a seamless light background.`;
  const PROMPT_TEMPLATE_3D_NEGATIVE = `photographic realism, fabric texture, gritty, noise, grain, metallic reflections, subsurface scattering, wood grain, glass refraction, text, watermark, drop shadow, ground/drop shadows, vignette, cinematic lighting, background gradients, extra props, multiple subjects, poorly defined limbs, messy geometry, 1024x1024 output, square aspect ratio, outline, harsh contrast, oversaturated colors`;
  const DEFAULT_IMAGE_PROMPT = `A 3D render of a friendly robot in Creon style. The robot has a glossy blue and white body, smooth rounded edges, and a simple friendly face. It is floating in the center of a clean white studio background. Soft global illumination, high-quality plastic materials.`;
  const DEFAULT_IMAGE_NEGATIVE_PROMPT = `cartoon, 2D, flat, vector, text, watermark, logo, blurry, grainy, noisy, pixelated, ugly, deformed, distorted proportions, cluttered background, harsh lighting, dark shadows, dull matte surfaces, street, city, people, realistic textures.`;

  // A comprehensive list of Material Symbols
  const ALL_ICON_NAMES = [
    'search', 'home', 'menu', 'close', 'settings', 'favorite', 'add', 'delete', 'arrow_back', 'star', 'chevron_right', 'logout', 'add_circle', 'cancel', 'arrow_forward', 'arrow_drop_down', 'more_vert', 'check', 'check_box', 'open_in_new', 'toggle_on', 'refresh', 'login', 'chevron_left', 'radio_button_unchecked', 'more_horiz', 'download', 'apps', 'filter_alt', 'remove', 'account_circle', 'info', 'visibility', 'visibility_off', 'edit', 'history', 'lightbulb', 'schedule', 'language', 'help', 'error', 'warning', 'cloud', 'attachment', 'camera_alt', 'collections', 'image', 'music_note', 'videocam', 'place', 'phone', 'email', 'send', 'drafts', 'archive', 'unarchive', 'inbox', 'move_to_inbox', 'shopping_cart', 'thumb_up', 'thumb_down', 'notifications', 'person', 'people', 'group', 'share', 'link', 'public', 'lock', 'lock_open', 'verified_user', 'shield', 'leaderboard', 'assessment', 'trending_up', 'timeline', 'dashboard', 'calendar_today', 'forum', 'build', 'bug_report', 'code', 'storage', 'memory', 'dns', 'router', 'httpskey', 'vpn_key', 'fingerprint', 'face', 'support', 'live_help', 'announcement', 'contact_support', 'report_problem', 'sync', 'sync_problem', 'sync_disabled', 'power_settings_new', 'bluetooth', 'wifi', 'signal_cellular_alt', 'battery_full', 'airplanemode_active', 'brightness_high', 'screen_rotation', 'volume_up', 'mic', 'videogame_asset', 'headset', 'mouse', 'keyboard', 'computer', 'desktop_windows', 'laptop', 'phone_android', 'tablet_mac', 'watch', 'devices', 'developer_mode', 'cast', 'speaker_group', 'whatshot', 'mood', 'sentiment_satisfied', 'sentiment_dissatisfied', 'sports_esports', 'fitness_center', 'kitchen', 'restaurant', 'local_cafe', 'local_bar', 'local_dining', 'local_drink', 'local_florist', 'local_gas_station', 'local_grocery_store', 'local_hospital', 'local_hotel', 'local_laundry_service', 'local_library', 'local_mall', 'local_movies', 'local_offer', 'local_parking', 'local_pharmacy', 'local_pizza', 'local_post_office', 'local_shipping', 'local_taxi', 'map', 'directions', 'train', 'tram', 'subway', 'flight', 'local_airport', 'hotel', 'atm', 'beenhere', 'store_mall_directory', 'terrain', 'satellite', 'layers', 'navigation', 'traffic', 'pedal_bike', 'agriculture', 'eco', 'pets', 'compost', 'science', 'biotech', 'architecture', 'construction', 'engineering', 'psychology', 'self_improvement', 'sports_kabaddi', 'surfing', 'volleyball', 'skateboarding', 'snowboarding', 'kayaking', 'hiking', 'downhill_skiing', 'snowshoeing', 'ice_skating', 'camping', 'kitesurfing', 'paragliding', 'climbing', 'golf_course', 'sports_golf', 'sports_tennis', 'sports_basketball', 'sports_football', 'sports_soccer', 'sports_cricket', 'sports_baseball', 'sports_hockey', 'sports_rugby', 'sports_volleyball', 'pool', 'cake', 'celebration', 'deck', 'fireplace', 'house', 'king_bed', 'night_shelter', 'outdoor_grill', 'roofing', 'stairs', 'cottage', 'balcony', 'fence', 'grass', 'wb_sunny', 'bedtime', 'ac_unit', 'blender', 'coffee_maker', 'dining', 'door_front', 'dryer', 'elevator', 'faucet', 'garage', 'light', 'microwave', 'outlet', 'shower', 'soap', 'table_restaurant', 'window', 'yard', 'chair', 'coffee', 'flatware', 'lunch_dining', 'ramen_dining', 'tapas', 'wine_bar', 'liquor', 'icecream', 'fastfood', 'hardware', 'home_repair_service', 'medical_services', 'cleaning_services', 'design_services', 'electrical_services', 'hvac', 'plumbing', 'carpenter', 'pest_control', 'miscellaneous_services', 'theater_comedy', 'festival', 'stadium', 'attractions', 'park', 'zoo', 'forest', 'museum', 'school', 'work', 'corporate_fare', 'business_center', 'child_care', 'child_friendly', 'family_restroom', 'fitness_center', 'free_breakfast', 'golf_course', 'hot_tub', 'kitchen', 'meeting_room', 'no_meeting_room', 'pool', 'room_service', 'rv_hookup', 'smoke_free', 'smoking_rooms', 'spa', 'all_inclusive', 'airport_shuttle', 'apartment', 'bathtub', 'beach_access', 'bento', 'breakfast_dining', 'brunch_dining', 'cabin', 'carpenter', 'casino', 'chair_alt', 'chalet', 'checkroom', 'child_care', 'child_friendly', 'cleaning_services', 'compost', 'corporate_fare', 'cottage', 'countertops', 'crib', 'deck', 'design_services', 'dinner_dining', 'do_not_step', 'do_not_touch', 'door_back', 'door_front', 'door_sliding', 'doorbell', 'dry_cleaning', 'dryer', 'electrical_services', 'elevator', 'emergency', 'escalator', 'escalator_warning', 'euro_symbol', 'family_restroom', 'fence', 'festival', 'fireplace', 'fire_extinguisher', 'fitness_center', 'flatware', 'food_bank', 'foundation', 'free_breakfast', 'gite', 'golf_course', 'grass', 'hardware', 'home_health', 'home_iot_device', 'home_repair_service', 'home_work', 'hot_tub', 'house', 'house_siding', 'hvac', 'icecream', 'king_bed', 'kitesurfing', 'kitchen', 'lan', 'laptop_chromebook', 'laptop_mac', 'laptop_windows', 'light', 'liquor', 'local_activity', 'lunch_dining', 'meeting_room', 'microwave', 'night_shelter', 'no_cell', 'no_drinks', 'no_flash', 'no_food', 'no_meeting_room', 'no_photography', 'no_stroller', 'outdoor_grill', 'outlet', 'pages', 'park', 'pest_control', 'pets', 'phishing', 'plumbing', 'plus_one', 'poll', 'pool', 'public_off', 'ramen_dining', 'real_estate_agent', 'recycling', 'restaurant_menu', 'rice_bowl', 'roofing', 'room_preferences', 'room_service', 'rv_hookup', 'school', 'science', 'self_improvement', 'sentiment_neutral', 'sentiment_very_dissatisfied', 'sentiment_very_satisfied', 'share_location', 'shower', 'single_bed', 'skateboarding', 'smoke_free', 'smoking_rooms', 'soap', 'social_distance', 'south', 'spa', 'sports', 'stairs', 'storefront', 'stroller', 'stadium', 'subway', 'surfing', 'sync_alt', 'tapas', 'tty', 'umbrella', 'vape_free', 'vaping_rooms', 'volcano', 'wallet', 'water_drop', 'waving_hand', 'webhook', 'whatshot', 'wine_bar', 'workspaces', 'yard', 'wrong_location', 'wysiwyg', 'youtube_searched_for', 'zoom_in', 'zoom_out', 'zoom_out_map', '10k', '10mp', '11mp', '123', '12mp', '13mp', '14mp', '15mp', '16mp', '17mp', '18mp', '19mp', '1k', '1k_plus', '1x_mobiledata', '20mp', '21mp', '22mp', '23mp', '24mp', '2k', '2k_plus', '2mp', '30fps', '30fps_select', '360', '3d_rotation', '3g_mobiledata', '3k', '3k_plus', '3mp', '3p', '4g_mobiledata', '4g_plus_mobiledata', '4k', '4k_plus', '4mp', '5g', '5k', '5k_plus', '5mp', '60fps', '60fps_select', '6_ft_apart', '6k', '6k_plus', '6mp', '7k', '7k_plus', '7mp', '8k', '8k_plus', '8mp', '9k', '9k_plus', '9mp', 'abc', 'accessibility', 'accessibility_new', 'accessible', 'accessible_forward', 'account_balance', 'account_balance_wallet', 'account_box', 'account_tree', 'ad_units', 'add_a_photo', 'add_alert', 'add_business', 'add_call', 'add_card', 'add_chart', 'add_comment', 'add_ic_call', 'add_link', 'add_location', 'add_location_alt', 'add_moderator', 'add_photo_alternate', 'add_reaction', 'add_road', 'add_shopping_cart', 'add_task', 'add_to_drive', 'add_to_home_screen', 'add_to_photos', 'add_to_queue', 'adf_scanner', 'admin_panel_settings', 'ads_click', 'agender', 'agriculture', 'air', 'airline_seat_flat', 'airline_seat_flat_angled', 'airline_seat_individual_suite', 'airline_seat_legroom_extra', 'airline_seat_legroom_normal', 'airline_seat_legroom_reduced', 'airline_seat_recline_extra', 'airline_seat_recline_normal', 'airline_stops', 'airlines', 'airplane_ticket', 'airplanemode_inactive', 'airplay', 'airport_shuttle', 'alarm', 'alarm_add', 'alarm_off', 'alarm_on', 'album', 'align_horizontal_center', 'align_horizontal_left', 'align_horizontal_right', 'align_vertical_bottom', 'align_vertical_center', 'align_vertical_top', 'all_inbox', 'all_inclusive', 'all_out', 'alternate_email', 'alt_route', 'analytics', 'anchor', 'android', 'animation', 'aod', 'apartment', 'api', 'app_blocking', 'app_registration', 'app_settings_alt', 'app_shortcut', 'approval', 'architecture', 'arrow_back_ios', 'arrow_back_ios_new', 'arrow_circle_down', 'arrow_circle_left', 'arrow_circle_right', 'arrow_circle_up', 'arrow_downward', 'arrow_drop_down_circle', 'arrow_drop_up', 'arrow_forward_ios', 'arrow_left', 'arrow_right', 'arrow_right_alt', 'arrow_upward', 'art_track', 'article', 'aspect_ratio', 'assistant', 'assistant_direction', 'assistant_photo', 'assured_workload', 'atm', 'attach_email', 'attach_file', 'attach_money', 'attractions', 'attribution', 'audio_file', 'audiotrack', 'auto_awesome', 'auto_awesome_mosaic', 'auto_awesome_motion', 'auto_delete', 'auto_fix_high', 'auto_fix_normal', 'auto_fix_off', 'auto_graph', 'auto_mode', 'auto_stories', 'autofps_select', 'autorenew', 'av_timer', 'baby_changing_station', 'back_hand', 'background_replace', 'backpack', 'backspace', 'backup', 'backup_table', 'badge', 'bakery_dining', 'balance', 'balcony', 'ballot', 'bar_chart', 'batch_prediction', 'bathroom', 'bathtub', 'battery_0_bar', 'battery_1_bar', 'battery_2_bar', 'battery_3_bar', 'battery_4_bar', 'battery_5_bar', 'battery_6_bar', 'battery_alert', 'battery_charging_full', 'battery_saver', 'battery_std', 'battery_unknown', 'beach_access', 'bed', 'bedroom_baby', 'bedroom_child', 'bedroom_parent', 'bedtime_off', 'beenhere', 'bento', 'bike_scooter', 'biotech', 'blinds', 'blinds_closed', 'block', 'bloodtype', 'bluetooth_audio', 'bluetooth_connected', 'bluetooth_disabled', 'bluetooth_drive', 'bluetooth_searching', 'blur_circular', 'blur_linear', 'blur_off', 'blur_on', 'bolt', 'book', 'book_online', 'bookmark', 'bookmark_add', 'bookmark_added', 'bookmark_border', 'bookmark_remove', 'bookmarks', 'border_all', 'border_bottom', 'border_clear', 'border_color', 'border_horizontal', 'border_inner', 'border_left', 'border_outer', 'border_right', 'border_style', 'border_top', 'border_vertical', 'boy', 'branding_watermark', 'breakfast_dining', 'breaking_news_alt_1', 'brightness_1', 'brightness_2', 'brightness_3', 'brightness_4', 'brightness_5', 'brightness_6', 'brightness_7', 'brightness_auto', 'brightness_low', 'broadcast_on_home', 'broadcast_on_personal', 'broken_image', 'browse_gallery', 'browser_not_supported', 'browser_updated', 'brunch_dining', 'brush', 'bubble_chart', 'build_circle', 'bungalow', 'burst_mode', 'bus_alert', 'business', 'business_center', 'cabin', 'cable', 'cached', 'cake', 'calculate', 'calendar_month', 'calendar_view_day', 'calendar_view_month', 'calendar_view_week', 'call', 'call_end', 'call_made', 'call_merge', 'call_missed', 'call_missed_outgoing', 'call_received', 'call_split', 'call_to_action', 'camera', 'camera_enhance', 'camera_front', 'camera_indoor', 'camera_outdoor', 'camera_rear', 'camera_roll', 'cameraswitch', 'campaign', 'cancel_presentation', 'cancel_schedule_send', 'candlestick_chart', 'car_crash', 'car_rental', 'car_repair', 'card_giftcard', 'card_membership', 'card_travel', 'carpenter', 'cases', 'casino', 'cast_connected', 'cast_for_education', 'castle', 'catching_pokemon', 'category', 'celebration', 'cell_tower', 'cell_wifi', 'center_focus_strong', 'center_focus_weak', 'chair', 'chair_alt', 'chalet', 'change_circle', 'change_history', 'charging_station', 'chat', 'chat_bubble', 'chat_bubble_outline', 'check_box_outline_blank', 'check_circle', 'check_circle_outline', 'checklist', 'checklist_rtl', 'checkroom', 'circle', 'circle_notifications', 'class', 'clean_hands', 'cleaning_services', 'clear_all', 'cloud_circle', 'cloud_done', 'cloud_download', 'cloud_off', 'cloud_queue', 'cloud_sync', 'cloud_upload', 'co2', 'co_present', 'code_off', 'coffee', 'coffee_maker', 'collections_bookmark', 'colorize', 'comment', 'comment_bank', 'comments_disabled', 'commit', 'compare', 'compare_arrows', 'compass_calibration', 'compress', 'compare', 'compare_arrows', 'compass_calibration', 'compress', 'computer', 'confirmation_number', 'connect_without_contact', 'connected_tv', 'connecting_airports', 'construction', 'contact_emergency', 'contact_mail', 'contact_page', 'contact_phone', 'contactless', 'content_copy', 'content_cut', 'content_paste', 'content_paste_go', 'content_paste_off', 'content_paste_search', 'contrast', 'control_camera', 'control_point', 'control_point_duplicate', 'conveyor_belt', 'cookie', 'copy_all', 'copyright', 'coronavirus', 'corporate_fare', 'cottage', 'countertops', 'create', 'create_new_folder', 'credit_card', 'credit_card_off', 'credit_score', 'crib', 'crisis_alert', 'crop', 'crop_16_9', 'crop_3_2', 'crop_5_4', 'crop_7_5', 'crop_din', 'crop_free', 'crop_landscape', 'crop_original', 'crop_portrait', 'crop_rotate', 'crop_square', 'cruelty_free', 'css', 'currency_bitcoin', 'currency_exchange', 'currency_franc', 'currency_lira', 'currency_pound', 'currency_ruble', 'currency_rupee', 'currency_yen', 'currency_yuan', 'curtains', 'curtains_closed', 'cut', 'cyclone', 'dangerous', 'dark_mode', 'dashboard_customize', 'data_array', 'data_exploration', 'data_object', 'data_saver_off', 'data_saver_on', 'data_thresholding', 'data_usage', 'dataset', 'dataset_linked', 'date_range', 'deblur', 'deck', 'dehaze', 'delivery_dining', 'density_large', 'density_medium', 'density_small', 'departure_board', 'description', 'deselect', 'design_services', 'desk', 'desktop_access_disabled', 'desktop_mac', 'details', 'developer_board', 'developer_board_off', 'device_hub', 'device_thermostat', 'device_unknown', 'devices_fold', 'devices_other', 'dialer_sip', 'dialpad', 'diamond', 'difference', 'dining', 'dinner_dining', 'directions_bike', 'directions_boat', 'directions_boat_filled', 'directions_bus', 'directions_bus_filled', 'directions_car', 'directions_car_filled', 'directions_off', 'directions_railway', 'directions_railway_filled', 'directions_run', 'directions_subway', 'directions_subway_filled', 'directions_transit', 'directions_transit_filled', 'directions_walk', 'dirty_lens', 'disabled_by_default', 'disabled_visible', 'disc_full', 'discount', 'display_settings', 'diversity_1', 'diversity_2', 'diversity_3', 'dnd_forwardslash', 'do_disturb', 'do_disturb_alt', 'do_disturb_off', 'do_disturb_on', 'do_not_disturb', 'do_not_disturb_alt', 'do_not_disturb_off', 'do_not_disturb_on', 'do_not_disturb_on_total_silence', 'do_not_step', 'do_not_touch', 'dock', 'document_scanner', 'domain', 'domain_add', 'domain_disabled', 'domain_verification', 'done', 'done_all', 'done_outline', 'donut_large', 'donut_small', 'door_back', 'door_front', 'door_sliding', 'doorbell', 'double_arrow', 'downhill_skiing', 'drafts', 'drag_handle', 'drag_indicator', 'draw', 'drive_eta', 'drive_file_move', 'drive_file_move_rtl', 'drive_file_rename_outline', 'drive_folder_upload', 'dry', 'dry_cleaning', 'duo', 'dvr', 'dynamic_feed', 'dynamic_form', 'e_mobiledata', 'earbuds', 'earbuds_battery', 'east', 'edgesensor_high', 'edgesensor_low', 'edit_attributes', 'edit_calendar', 'edit_location', 'edit_location_alt', 'edit_note', 'edit_notifications', 'edit_off', 'edit_road', 'egg', 'egg_alt', 'eject', 'elderly', 'elderly_woman', 'electric_bike', 'electric_bolt', 'electric_car', 'electric_meter', 'electric_moped', 'electric_rickshaw', 'electric_scooter', 'electrical_services', 'elevator', 'emergency_recording', 'emergency_share', 'energy_savings_leaf', 'enhanced_encryption', 'equalizer', 'error_outline', 'escalator', 'escalator_warning', 'euro', 'euro_symbol', 'ev_station', 'event', 'event_available', 'event_busy', 'event_note', 'event_repeat', 'event_seat', 'exit_to_app', 'expand', 'expand_circle_down', 'expand_less', 'expand_more', 'explicit', 'explore', 'explore_off', 'exposure', 'exposure_neg_1', 'exposure_neg_2', 'exposure_plus_1', 'exposure_plus_2', 'exposure_zero', 'extension', 'extension_off', 'f_mobiledata', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'face_retouching_natural', 'face_retouching_off', 'fact_check', 'factory', 'family_restroom', 'fast_forward', 'fast_rewind', 'fastfood', 'favorite_border', 'fax', 'featured_play_list', 'featured_video', 'feed', 'feedback', 'female', 'fence', 'festival', 'fiber_dvr', 'fiber_manual_record', 'fiber_new', 'fiber_pin', 'fiber_smart_record', 'file_copy', 'file_download', 'file_download_done', 'file_download_off', 'file_open', 'file_present', 'file_upload', 'file_upload_off', 'filter', 'filter_1', 'filter_2', 'filter_3', 'filter_4', 'filter_5', 'filter_6', 'filter_7', 'filter_8', 'filter_9', 'filter_9_plus', 'filter_b_and_w', 'filter_center_focus', 'filter_drama', 'filter_frames', 'filter_hdr', 'filter_list', 'filter_list_off', 'filter_none', 'filter_tilt_shift', 'filter_vintage', 'find_in_page', 'find_replace', 'fire_extinguisher', 'fire_hydrant_alt', 'fire_truck', 'fireplace', 'first_page', 'fit_screen', 'fitbit', 'fitness_center', 'flag', 'flag_circle', 'flaky', 'flare', 'flash_auto', 'flash_off', 'flash_on', 'flashlight_off', 'flashlight_on', 'flatware', 'flight_class', 'flight_land', 'flight_takeoff', 'flip', 'flip_camera_android', 'flip_camera_ios', 'flip_to_back', 'flip_to_front', 'flood', 'flourescent', 'flutter_dash', 'fmd_bad', 'fmd_good', 'folder', 'folder_copy', 'folder_delete', 'folder_off', 'folder_open', 'folder_shared', 'folder_special', 'folder_zip', 'follow_the_signs', 'font_download', 'font_download_off', 'food_bank', 'forest', 'fork_left', 'fork_right', 'format_align_center', 'format_align_justify', 'format_align_left', 'format_align_right', 'format_bold', 'format_clear', 'format_color_fill', 'format_color_reset', 'format_color_text', 'format_indent_decrease', 'format_indent_increase', 'format_italic', 'format_line_spacing', 'format_list_bulleted', 'format_list_numbered', 'format_list_numbered_rtl', 'format_overline', 'format_paint', 'format_quote', 'format_shapes', 'format_size', 'format_strikethrough', 'format_textdirection_l_to_r', 'format_textdirection_r_to_l', 'format_underlined', 'fort', 'forward_to_inbox', 'foundation', 'free_breakfast', 'free_cancellation', 'front_hand', 'fullscreen', 'fullscreen_exit', 'functions', 'g_mobiledata', 'g_translate', 'gamepad', 'games', 'garage', 'gas_meter', 'gavel', 'generating_tokens', 'gesture', 'get_app', 'gif', 'gif_box', 'girl', 'gite', 'glyphs', 'golf_course', 'gpp_bad', 'gpp_good', 'gpp_maybe', 'gps_fixed', 'gps_not_fixed',
  ];

  // --- GEMINI API ---
  // MASTER_API_KEY removed for security. Please set API_KEY in your deployment environment.
  const FINAL_API_KEY = API_KEY || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : null);

  let ai;
  if (FINAL_API_KEY) {
    ai = new GoogleGenAI(FINAL_API_KEY); // Using the browser-compatible constructor
  } else {
    console.warn('API_KEY is not set. Some AI features may be limited.');
  }

  // --- API CALLS ---
  async function generate3dIcon() {
    if (!ai || !selectedIconName) return;

    // Show loader and hide previous results
    loader.style.display = 'block';
    generatedImage.style.display = 'none';
    generatedVideo.style.display = 'none';
    errorMessage.style.display = 'none';
    snippet3dSection.classList.add('hidden');
    isLoading = true;
    downloadBtn.disabled = true;
    convertToVideoBtn.disabled = true;
    currentBase64Image = null;

    try {
      const prompt = promptInput.value;
      const negativePrompt = negativePromptInput.value;

      let fullPrompt = prompt;
      if (negativePrompt.trim()) {
        fullPrompt += `\n\nNegative prompt: ${negativePrompt}`;
      }

      let finalModel = 'imagen-4.0-ultra-generate-001';
      let requestConfig = {
        model: finalModel,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9"
        },
      };

      // Use Gemini 3 Pro Image (Nano Banana) for high-end consistency if available
      if (ai && ai.models && (ai.models['gemini-3-pro-image-preview'] || ai.models['gemini-3-pro-image'])) {
        finalModel = 'gemini-3-pro-image-preview';
        requestConfig.model = finalModel;
        requestConfig.prompt = JSON.stringify({
          ...CREON_3D_BLUEPRINT,
          subject: selectedIconName || promptInput.value
        });
      }

      const response = await ai.models.generateImages(requestConfig);

      currentBase64Image = response.generatedImages[0].image.imageBytes;
      generatedImage.src = `data:image/png;base64,${currentBase64Image}`;
      generatedImage.style.display = '';
      downloadBtn.disabled = false;
      convertToVideoBtn.disabled = false;
      updateCodeSnippetsTab();
      switchPreviewTab('image');

      // Send to Sketchon parent for immediate use
      window.parent.postMessage({
        type: 'CREON_ASSET_SELECTED',
        payload: {
          type: 'image',
          value: generatedImage.src,
          base64: currentBase64Image,
          mimeType: 'image/png'
        }
      }, '*');

    } catch (error) {
      console.error('Error generating 3D icon:', error);
      errorMessage.textContent = 'Failed to generate 3D icon. Please try again.';
      errorMessage.style.display = 'block';
    } finally {
      loader.style.display = 'none';
      isLoading = false;
    }
  }

  async function generateVideoFromImage() {
    if (!ai || !currentBase64Image) return;

    loader.style.display = 'block';
    errorMessage.textContent = 'Generating video... This can take a few minutes.';
    errorMessage.style.display = 'block';
    isLoading = true;
    if (regenerateBtn) regenerateBtn.disabled = true;
    downloadBtn.disabled = true;
    convertToVideoBtn.disabled = true;

    try {
      const animationType = animationTypeSelect.value;
      let animationDescription = 'a subtle, slow floating animation';
      if (animationType === 'bounce') animationDescription = 'a fun bouncing animation';
      if (animationType === 'pulse') animationDescription = 'a gentle pulsing animation';
      if (animationType === 'spin') animationDescription = 'a smooth 360-degree spinning animation';

      const prompt = `Create a short, looping video of this icon with ${animationDescription}.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.0-generate-001',
        prompt: prompt,
        image: {
          imageBytes: currentBase64Image,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
        },
      });

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        generatedVideo.src = videoUrl;
        errorMessage.style.display = 'none';
        videoTabBtn.disabled = false;
        switchPreviewTab('video');

        // Send to Sketchon parent
        window.parent.postMessage({
          type: 'CREON_ASSET_SELECTED',
          payload: {
            type: 'video',
            value: videoUrl
          }
        }, '*');
      } else {
        throw new Error('Video generation did not return a valid link.');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      errorMessage.textContent = 'Failed to generate video. Please try again.';
      switchPreviewTab('image'); // Switch back to image on error
    } finally {
      loader.style.display = 'none';
      isLoading = false;
      if (regenerateBtn) regenerateBtn.disabled = false;
      downloadBtn.disabled = true;
      convertToVideoBtn.disabled = false;
    }
  }

  async function generateImage() {
    if (!ai) return;

    imageLoader.style.display = 'block';
    generatedImageMain.style.display = 'none';
    imageErrorMessage.style.display = 'none';
    generateImageBtn.disabled = true;

    try {
      const prompt = imagePromptInput.value;
      const negativePrompt = imageNegativePromptInput.value;

      let fullPrompt = prompt;
      if (negativePrompt.trim()) {
        fullPrompt += `\n\nNegative prompt: ${negativePrompt}`;
      }

      let finalModel = 'imagen-4.0-ultra-generate-001';
      let requestConfig = {
        model: finalModel,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9"
        },
      };

      // Check if specialized model is available and prefer it for high-end image generation
      if (ai && ai.models && (ai.models['gemini-3-pro-image-preview'] || ai.models['gemini-3-pro-image'])) {
        finalModel = 'gemini-3-pro-image-preview';
        requestConfig.model = finalModel;
      }

      const response = await ai.models.generateImages(requestConfig);

      const base64Image = response.generatedImages[0].image.imageBytes;
      generatedImageMain.src = `data:image/png;base64,${base64Image}`;
      generatedImageMain.style.display = 'block';

      // Send to Sketchon parent
      window.parent.postMessage({
        type: 'CREON_ASSET_SELECTED',
        payload: {
          type: 'image',
          value: generatedImageMain.src,
          base64: base64Image,
          mimeType: 'image/png'
        }
      }, '*');

    } catch (error) {
      console.error('Error generating image:', error);
      imageErrorMessage.textContent = 'Failed to generate image. Please try again.';
      imageErrorMessage.style.display = 'block';
    } finally {
      imageLoader.style.display = 'none';
      generateImageBtn.disabled = false;
    }
  }


  // --- UI UPDATE FUNCTIONS ---
  function showHomeScreen() {
    if (homeScreen) homeScreen.classList.remove('hidden');
    if (iconBuilderScreen) iconBuilderScreen.classList.add('hidden');
    if (imageBuilderScreen) imageBuilderScreen.classList.add('hidden');
  }

  function showIconBuilderScreen() {
    if (homeScreen) homeScreen.classList.add('hidden');
    if (iconBuilderScreen) iconBuilderScreen.classList.remove('hidden');
    if (imageBuilderScreen) imageBuilderScreen.classList.add('hidden');
  }

  function showImageBuilderScreen(promptFromHome = null) {
    if (homeScreen) homeScreen.classList.add('hidden');
    if (iconBuilderScreen) iconBuilderScreen.classList.add('hidden');
    if (imageBuilderScreen) imageBuilderScreen.classList.remove('hidden');

    if (imagePromptInput) imagePromptInput.value = promptFromHome || DEFAULT_IMAGE_PROMPT;
    if (imageNegativePromptInput) imageNegativePromptInput.value = DEFAULT_IMAGE_NEGATIVE_PROMPT;

    if (generatedImageMain) {
      generatedImageMain.src = '';
      generatedImageMain.style.display = 'none';
    }
    if (imageErrorMessage) imageErrorMessage.style.display = 'none';

    if (promptFromHome) {
      generateImage();
    }
  }


  function applyIconStyle(element, style) {
    element.style.fontVariationSettings = `'FILL' ${style.fill}, 'wght' ${style.weight}, 'GRAD' ${style.grade}, 'opsz' ${style.opticalSize}`;
  }

  function createIconItem(iconName) {
    const item = document.createElement('div');
    item.className = 'icon-item';
    item.dataset.iconName = iconName;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', iconName);
    item.tabIndex = 0;

    const iconSpan = document.createElement('span');
    iconSpan.className = `material-symbols-${currentStyle.family.toLowerCase()}`;
    iconSpan.textContent = iconName;
    applyIconStyle(iconSpan, currentStyle);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = iconName;

    item.appendChild(iconSpan);
    item.appendChild(nameSpan);

    return item;
  }

  function updateAllIconStyles() {
    if (!iconGrid) return;
    const icons = iconGrid.querySelectorAll(
      '.material-symbols-outlined, .material-symbols-rounded, .material-symbols-sharp',
    );
    icons.forEach((icon) => {
      icon.className = `material-symbols-${currentStyle.family.toLowerCase()}`;
      applyIconStyle(icon, currentStyle);
    });

    if (selectedIconName) {
      updateCodeSnippetsTab();
    }
  }

  function loadIcons(startIndex, count) {
    if (!iconGrid) return;
    const fragment = document.createDocumentFragment();
    const iconsToLoad = filteredIconNames.slice(startIndex, startIndex + count);
    iconsToLoad.forEach((iconName) => {
      const iconItem = createIconItem(iconName);
      fragment.appendChild(iconItem);
    });
    iconGrid.appendChild(fragment);
    currentIconIndex = startIndex + count;
  }

  function handleIconSelection(iconName) {
    if (selectedIconName === iconName) return;

    const prevSelected = iconGrid.querySelector('.icon-item.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }

    const newSelected = iconGrid.querySelector(
      `.icon-item[data-icon-name="${iconName}"]`,
    );
    if (newSelected) {
      newSelected.classList.add('selected');
      selectedIconName = iconName;
      updateInspectorPanel();

      if (!document.body.classList.contains('right-panel-active')) {
        document.body.classList.add('right-panel-active');
      }
    }
  }

  function updateInspectorPanel() {
    if (!selectedIconName) return;
    currentBase64Image = null;
    if (generatedVideo) generatedVideo.src = '';
    switchPreviewTab('image');
    if (videoTabBtn) videoTabBtn.disabled = true;

    updateInspector3dTab();
    updateCodeSnippetsTab();

    const generateTab = document.querySelector('.tab-item[data-tab="generate"]');

    inspectorTabs.forEach((t) =>
      t.classList.toggle('active', t === generateTab),
    );
    tabContents.forEach((content) => {
      content.classList.toggle(
        'hidden',
        content.dataset.tabContent !== 'generate',
      );
    });

    generate3dIcon();
  }

  function updateInspector3dTab() {
    if (!selectedIconName) return;
    if (promptInput) promptInput.value = PROMPT_TEMPLATE_3D.replace(/\[SUBJECT\]/g, selectedIconName);
    if (negativePromptInput) negativePromptInput.value = PROMPT_TEMPLATE_3D_NEGATIVE;
  }

  function filterAndRenderIcons(query) {
    query = query.toLowerCase();
    filteredIconNames = ALL_ICON_NAMES.filter((name) => name.includes(query));

    if (iconGrid) iconGrid.innerHTML = '';
    currentIconIndex = 0;
    if (observer) {
      observer.disconnect();
    }

    loadIcons(0, ICONS_PER_BATCH);
    if (filteredIconNames.length > ICONS_PER_BATCH) {
      if (!sentinel.parentNode) {
        iconGrid?.parentNode?.appendChild(sentinel);
      }
      observer?.observe(sentinel);
    }
  }

  function switchPreviewTab(tab) {
    const isImage = tab === 'image';
    if (imageTabBtn) imageTabBtn.classList.toggle('active', isImage);
    if (videoTabBtn) videoTabBtn.classList.toggle('active', !isImage);
    if (imageTabContent) imageTabContent.classList.toggle('active', isImage);
    if (videoTabContent) videoTabContent.classList.toggle('active', !isImage);
  }


  // --- CODE SNIPPET FUNCTIONS ---

  const handleCopyClick = (button, code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => {
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) {
          const originalIcon = icon.textContent;
          icon.textContent = 'check';
          button.disabled = true;
          setTimeout(() => {
            icon.textContent = originalIcon;
            button.disabled = false;
          }, 2000);
        }
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      },
    );
  };

  function updateCodeSnippetsTab() {
    update2dCodeSnippets();
    update3dCodeSnippet();
    updateAnimationCodeSnippets();
    updateAnimationPreview();
  }

  function update2dCodeSnippets() {
    if (!selectedIconName) return;

    const { family, fill, weight, grade, opticalSize } = currentStyle;
    const familyLower = family.toLowerCase();

    const fontUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+${family}:opsz,wght,FILL,GRAD@${opticalSize},${weight},${fill},${grade}&icon_names=${selectedIconName}`;
    const htmlSnippet =
      `<!-- 1. Add the font stylesheet to your HTML <head> -->\n` +
      `<link rel="stylesheet" href="${fontUrl}" />\n\n` +
      `<!-- 2. Use the icon in your HTML <body> -->\n` +
      `<span class="material-symbols-${familyLower}">${selectedIconName}</span>`;

    const cssSnippet =
      `.material-symbols-${familyLower} {\n` +
      `  font-variation-settings:\n` +
      `  'FILL' ${fill},\n` +
      `  'wght' ${weight},\n` +
      `  'GRAD' ${grade},\n` +
      `  'opsz' ${opticalSize}\n` +
      `}`;

    if (snippetHtmlCode) snippetHtmlCode.textContent = htmlSnippet;
    if (snippetCssCode) snippetCssCode.textContent = cssSnippet;
  }

  function update3dCodeSnippet() {
    if (generatedImage && generatedImage.src && selectedIconName && currentBase64Image) {
      const dataUri = `data:image/png;base64,${currentBase64Image}`;
      const displayedUri = dataUri.substring(0, 60) + '...';
      const displaySnippet =
        `<!-- Use the generated image in your HTML -->\n` +
        `<img src="${displayedUri}"\n` +
        `     alt="A 3D model of ${selectedIconName}" />`;

      const fullSnippet =
        `<!-- Use the generated image in your HTML -->\n` +
        `<img src="${dataUri}"\n` +
        `     alt="A 3D model of ${selectedIconName}" />`;

      if (snippet3dCode) {
        snippet3dCode.textContent = displaySnippet;
        snippet3dCode.dataset.fullCode = fullSnippet;
      }
      if (snippet3dSection) snippet3dSection.classList.remove('hidden');
    } else {
      if (snippet3dSection) snippet3dSection.classList.add('hidden');
      if (snippet3dCode) {
        delete snippet3dCode.dataset.fullCode;
        snippet3dCode.textContent = '';
      }
    }
  }

  function updateAnimationCodeSnippets() {
    const animation = previewAnimationType ? previewAnimationType.value : '';
    const repeat = previewAnimationRepeat ? previewAnimationRepeat.value : '';
    const duration = '1s';

    if (!animation) {
      if (snippetAnimSection) snippetAnimSection.classList.add('hidden');
      return;
    }

    if (snippetAnimSection) snippetAnimSection.classList.remove('hidden');

    let keyframes = '';
    if (animation === 'bounce') {
      keyframes = `@keyframes bounce {\n  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }\n  40% { transform: translateY(-30px); }\n  60% { transform: translateY(-15px); }\n}`;
    } else if (animation === 'pulse') {
      keyframes = `@keyframes pulse {\n  0% { transform: scale(1); }\n  50% { transform: scale(1.1); }\n  100% { transform: scale(1); }\n}`;
    } else if (animation === 'spin') {
      keyframes = `@keyframes spin-preview {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}`;
    }

    const className = `animated-${selectedIconName || 'icon'}`;
    const classCss =
      `.${className} {\n` +
      `  /* Add other icon styles here */\n` +
      `  animation: ${animation} ${duration} ${repeat};\n` +
      `}`;

    if (snippetAnimKeyframesCode) snippetAnimKeyframesCode.textContent = keyframes;
    if (snippetAnimClassCode) snippetAnimClassCode.textContent = classCss;
  }

  function updateAnimationPreview() {
    if (!selectedIconName || !previewBoxAnimation) return;

    const iconSpan = document.createElement('span');
    iconSpan.className = `material-symbols-${currentStyle.family.toLowerCase()}`;
    iconSpan.textContent = selectedIconName;
    applyIconStyle(iconSpan, currentStyle);

    previewBoxAnimation.innerHTML = '';
    previewBoxAnimation.appendChild(iconSpan);
  }

  // --- CANVAS BACKGROUND ANIMATION ---
  function initCanvasAnimation() {
    if (!homeCanvas) return;
    const ctx = homeCanvas.getContext('2d');
    if (!ctx) return;

    let width = (homeCanvas.width = window.innerWidth);
    let height = (homeCanvas.height = window.innerHeight);
    let particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 30 + 20;
        this.color = `hsla(${Math.random() * 60 + 200}, 70%, 50%, 0.1)`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
      }

      draw(context) {
        context.beginPath();
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, `hsla(${Math.random() * 60 + 200}, 70%, 50%, 0)`);

        context.fillStyle = gradient;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
      width = homeCanvas.width = window.innerWidth;
      height = homeCanvas.height = window.innerHeight;
      createParticles();
    });

    createParticles();
    animate();
  }


  // --- INITIALIZATION and EVENT LISTENERS ---
  function init() {
    document.body.dataset.theme = 'dark';

    filterAndRenderIcons('');

    showHomeScreen();

    initCanvasAnimation();

    // --- 드래그 앤 드롭 설정 ---
    const setupDraggableAsset = (element) => {
      if (!element) return;
      element.draggable = true;
      element.style.cursor = 'grab';
      element.addEventListener('dragstart', (e) => {
        if (element.src) {
          // Sketchon 캔버스가 인식할 수 있도록 데이터 설정
          e.dataTransfer.setData('text/plain', element.src);
          e.dataTransfer.setData('text/html', `<img src="${element.src}" alt="Creon Asset" data-creon-asset="true">`);
          element.style.opacity = '0.5';
        }
      });
      element.addEventListener('dragend', () => {
        element.style.opacity = '1';
      });
    };

    setupDraggableAsset(generatedImage);
    setupDraggableAsset(generatedImageMain);


    observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          filteredIconNames &&
          currentIconIndex < filteredIconNames.length
        ) {
          loadIcons(currentIconIndex, ICONS_PER_BATCH);
        }
      },
      { root: null, threshold: 0.1 },
    );
    if (sentinel) observer.observe(sentinel);

    // --- Event Listeners ---
    if (navIconBuilder) navIconBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      showIconBuilderScreen();
    });
    if (navImageBuilder) navImageBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      showImageBuilderScreen();
    });
    if (navVideoBuilder) navVideoBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Video Builder is coming soon!');
    });
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', showHomeScreen);
    if (imageBuilderBackBtn) imageBuilderBackBtn.addEventListener('click', showHomeScreen);

    const runFromHome = () => {
      showImageBuilderScreen(homePromptInput ? homePromptInput.value.trim() : null);
    }

    if (homeRunBtn) homeRunBtn.addEventListener('click', runFromHome);
    if (homePromptInput) homePromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runFromHome();
      }
    });


    if (generateImageBtn) generateImageBtn.addEventListener('click', generateImage);


    if (iconGrid) iconGrid.addEventListener('click', (e) => {
      const target = e.target;
      const iconItem = target.closest('.icon-item');
      if (iconItem) {
        handleIconSelection(iconItem.dataset.iconName);
      }
    });

    if (iconGrid) iconGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target;
        if (target.classList.contains('icon-item')) {
          e.preventDefault();
          handleIconSelection(target.dataset.iconName);
        }
      }
    });

    if (inspectorCloseBtn) inspectorCloseBtn.addEventListener('click', () => {
      document.body.classList.remove('right-panel-active');
      selectedIconName = null;
      const prevSelected = iconGrid.querySelector('.icon-item.selected');
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
    });

    inspectorTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        inspectorTabs.forEach((t) =>
          t.classList.toggle('active', t === tab),
        );
        tabContents.forEach((content) => {
          content.classList.toggle(
            'hidden',
            content.dataset.tabContent !== tabName,
          );
        });
      });
    });

    // Style Controls
    if (fillToggle) fillToggle.addEventListener('change', (e) => {
      currentStyle.fill = e.target.checked ? 1 : 0;
      updateAllIconStyles();
    });
    if (weightSlider) weightSlider.addEventListener('input', (e) => {
      currentStyle.weight = parseInt(e.target.value);
      updateAllIconStyles();
    });
    if (gradeSlider) gradeSlider.addEventListener('input', (e) => {
      currentStyle.grade = parseInt(e.target.value);
      updateAllIconStyles();
    });
    if (opticalSizeSlider) opticalSizeSlider.addEventListener('input', (e) => {
      currentStyle.opticalSize = parseInt(e.target.value);
      updateAllIconStyles();
    });
    document
      .querySelectorAll('input[name="icon-family"]')
      .forEach((radio) => {
        radio.addEventListener('change', (e) => {
          currentStyle.family = e.target.value;
          updateAllIconStyles();
        });
      });

    if (searchInput) searchInput.addEventListener('input', (e) => {
      filterAndRenderIcons(e.target.value);
    });

    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        themeToggleBtns.forEach(b => {
          b.querySelector('.material-symbols-outlined').textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
        });
      });
      // Set initial state for each button icon
      const currentTheme = document.body.dataset.theme;
      const iconSpan = btn.querySelector('.material-symbols-outlined');
      if (iconSpan) iconSpan.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
    });


    if (regenerateBtn) regenerateBtn.addEventListener('click', generate3dIcon);
    if (convertToVideoBtn) convertToVideoBtn.addEventListener('click', generateVideoFromImage);

    if (downloadBtn) downloadBtn.addEventListener('click', () => {
      if (!currentBase64Image || !selectedIconName) return;
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${currentBase64Image}`;
      link.download = `${selectedIconName}_3d.png`;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link);
    });

    // 3D Preview Tabs
    if (imageTabBtn) imageTabBtn.addEventListener('click', () => switchPreviewTab('image'));
    if (videoTabBtn) videoTabBtn.addEventListener('click', () => switchPreviewTab('video'));

    // Copy buttons
    if (copyHtmlBtn) copyHtmlBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget,
        snippetHtmlCode.textContent,
      ),
    );
    if (copyCssBtn) copyCssBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget,
        snippetCssCode.textContent,
      ),
    );
    if (copy3dBtn) copy3dBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget,
        snippet3dCode.dataset.fullCode || snippet3dCode.textContent,
      ),
    );
    if (copyAnimKeyframesBtn) copyAnimKeyframesBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget,
        snippetAnimKeyframesCode.textContent,
      ),
    );
    if (copyAnimClassBtn) copyAnimClassBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget,
        snippetAnimClassCode.textContent,
      ),
    );

    // Animation controls in Code tab
    if (previewAnimationType) previewAnimationType.addEventListener('change', () => {
      updateAnimationCodeSnippets();
      updateAnimationPreview();
    });
    if (previewAnimationRepeat) previewAnimationRepeat.addEventListener('change', updateAnimationCodeSnippets);

    if (playAnimationBtn) playAnimationBtn.addEventListener('click', () => {
      const icon = previewBoxAnimation.querySelector('span');
      if (icon) {
        const animation = previewAnimationType.value;
        const repeat = previewAnimationRepeat.value;
        if (!animation) return;

        // Reset animation
        icon.style.animation = 'none';
        // Trigger a reflow to apply the reset before re-applying the animation
        void icon.offsetWidth;

        // Apply new animation
        icon.style.animation = `${animation} 1s ${repeat}`;
      }
    });

    if (play3dAnimationBtn) play3dAnimationBtn.addEventListener('click', generateVideoFromImage);

    if (animationTypeSelect) animationTypeSelect.addEventListener('change', () => {
      animationSpeedSelect.disabled = animationTypeSelect.value === 'none';
    });

    // Reference Image selection
    document.querySelectorAll('.ref-img').forEach(img => {
      img.addEventListener('click', () => {
        document.querySelectorAll('.ref-img').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        // Optionally update prompt or mood based on selected reference
      });
    });
  }

  // --- RUN ---
  init();

}
