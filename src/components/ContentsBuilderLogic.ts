/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '../lib/gemini';

// ... (other comments)

export function initContentsBuilder() {

  // --- DOM ELEMENT GETTERS ---
  // Home Screen elements
  const homeScreen = document.getElementById('home-screen') as HTMLDivElement;
  const navIconBuilder = document.getElementById('nav-icon-builder') as HTMLAnchorElement;
  const navImageBuilder = document.getElementById('nav-image-builder') as HTMLAnchorElement;
  const navVideoBuilder = document.getElementById('nav-video-builder') as HTMLAnchorElement;
  const homePromptInput = document.getElementById('home-prompt-input') as HTMLTextAreaElement;
  const homeRunBtn = document.getElementById('home-run-btn') as HTMLButtonElement;
  const homeCanvas = document.getElementById('home-canvas-background') as HTMLCanvasElement;


  // Icon Builder Screen elements
  const iconBuilderScreen = document.getElementById('icon-builder-screen') as HTMLDivElement;
  const backToHomeBtn = document.getElementById('back-to-home-btn') as HTMLButtonElement;
  const iconGrid = document.getElementById('icon-grid') as HTMLDivElement;
  const searchInput = document.getElementById('search-input') as HTMLInputElement;

  // Image Builder Screen elements
  const imageBuilderScreen = document.getElementById('image-builder-screen') as HTMLDivElement;
  const imageBuilderBackBtn = document.getElementById('image-builder-back-btn') as HTMLButtonElement;
  const imagePromptInput = document.getElementById('image-prompt-input') as HTMLTextAreaElement;
  const imageNegativePromptInput = document.getElementById('image-negative-prompt-input') as HTMLTextAreaElement;
  const generateImageBtn = document.getElementById('generate-image-btn') as HTMLButtonElement;
  const generatedImageMain = document.getElementById('generated-image-main') as HTMLImageElement;
  const imageLoader = document.getElementById('image-loader') as HTMLDivElement;
  const imageErrorMessage = document.getElementById('image-error-message') as HTMLParagraphElement;


  // Shared elements
  const themeToggleBtns = document.querySelectorAll(
    '.theme-toggle-btn',
  ) as NodeListOf<HTMLButtonElement>;


  // Inspector Panel (for Icon Builder)
  const loader = document.getElementById('loader') as HTMLDivElement;
  const generatedImage = document.getElementById(
    'generated-image',
  ) as HTMLImageElement;
  const generatedVideo = document.getElementById(
    'generated-video',
  ) as HTMLVideoElement;
  const errorMessage = document.getElementById(
    'error-message',
  ) as HTMLParagraphElement;
  const promptInput = document.getElementById(
    'prompt-input',
  ) as HTMLTextAreaElement;
  const negativePromptInput = document.getElementById(
    'negative-prompt-input',
  ) as HTMLTextAreaElement;
  const regenerateBtn = document.getElementById(
    'regenerate-btn',
  ) as HTMLButtonElement;
  const downloadBtn = document.getElementById(
    'download-btn',
  ) as HTMLButtonElement;
  const convertToVideoBtn = document.getElementById(
    'convert-to-video-btn',
  ) as HTMLButtonElement;
  const inspectorPanel = document.getElementById(
    'inspector-panel',
  ) as HTMLElement;
  const inspectorCloseBtn = document.getElementById(
    'inspector-close-btn',
  ) as HTMLButtonElement;
  const inspectorTabs = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const fillToggle = document.getElementById('fill-toggle') as HTMLInputElement;
  const weightSlider = document.getElementById(
    'weight-slider',
  ) as HTMLInputElement;
  const gradeSlider = document.getElementById('grade-slider') as HTMLInputElement;
  const opticalSizeSlider = document.getElementById(
    'optical-size-slider',
  ) as HTMLInputElement;
  const imageTabBtn = document.getElementById('image-tab-btn') as HTMLButtonElement;
  const videoTabBtn = document.getElementById('video-tab-btn') as HTMLButtonElement;
  const imageTabContent = document.getElementById('image-tab-content') as HTMLDivElement;
  const videoTabContent = document.getElementById('video-tab-content') as HTMLDivElement;
  const animationTypeSelect = document.getElementById(
    'animation-type-select',
  ) as HTMLSelectElement;
  const animationSpeedSelect = document.getElementById(
    'animation-speed-select',
  ) as HTMLSelectElement;
  const play3dAnimationBtn = document.getElementById(
    'play-3d-animation-btn',
  ) as HTMLButtonElement;
  const snippetHtmlCode = document.getElementById(
    'snippet-html-code',
  ) as HTMLElement;
  const snippetCssCode = document.getElementById(
    'snippet-css-code',
  ) as HTMLElement;
  const copyHtmlBtn = document.getElementById('copy-html-btn') as HTMLButtonElement;
  const copyCssBtn = document.getElementById('copy-css-btn') as HTMLButtonElement;
  const snippet3dSection = document.getElementById(
    'code-snippet-3d-section',
  ) as HTMLDivElement;
  const snippet3dCode = document.getElementById('snippet-3d-code') as HTMLElement;
  const copy3dBtn = document.getElementById('copy-3d-btn') as HTMLButtonElement;
  const previewBoxAnimation = document.getElementById(
    'preview-box-animation',
  ) as HTMLDivElement;
  const previewAnimationType = document.getElementById(
    'preview-animation-type',
  ) as HTMLSelectElement;
  const previewAnimationRepeat = document.getElementById(
    'preview-animation-repeat',
  ) as HTMLSelectElement;
  const playAnimationBtn = document.getElementById(
    'play-animation-btn',
  ) as HTMLButtonElement;
  const snippetAnimSection = document.getElementById(
    'code-snippet-anim-section',
  ) as HTMLDivElement;
  const snippetAnimKeyframesCode = document.getElementById(
    'snippet-anim-keyframes-code',
  ) as HTMLElement;
  const snippetAnimClassCode = document.getElementById(
    'snippet-anim-class-code',
  ) as HTMLElement;
  const copyAnimKeyframesBtn = document.getElementById(
    'copy-anim-keyframes-btn',
  ) as HTMLButtonElement;
  const copyAnimClassBtn = document.getElementById(
    'copy-anim-class-btn',
  ) as HTMLButtonElement;

  // --- STATE MANAGEMENT ---
  interface IconStyle {
    family: 'Outlined' | 'Rounded' | 'Sharp';
    fill: 0 | 1;
    weight: number;
    grade: number;
    opticalSize: number;
  }

  let currentStyle: IconStyle = {
    family: 'Outlined',
    fill: 0,
    weight: 400,
    grade: 0,
    opticalSize: 24,
  };
  let selectedIconName: string | null = null;
  let isLoading = false;
  let currentBase64Image: string | null = null;
  let currentIconIndex = 0;
  let observer: IntersectionObserver | null = null;
  const sentinel = document.createElement('div');
  let filteredIconNames: string[] = [];

  // --- CONSTANTS ---
  const API_KEY = getGeminiKey();
  const ICONS_PER_BATCH = 100;
  const PROMPT_TEMPLATE_3D = `A high-quality 3D render of [SUBJECT], 
minimalist toy-like style, smooth plastic material, 
clean separated geometry parts, 
isometric perspective (25° tilt, 20° rotation), 
soft studio lighting, subtle shadows, 
pastel blue and white color palette, 
placed on a seamless light background.`;
  const PROMPT_TEMPLATE_3D_NEGATIVE = `no photorealistic textures, no dirt, no scratches, 
no excessive details, no complex background, 
no text, no watermark, no 2D flat illustration, 
no abstract art, no low-poly jagged edges, 
no noisy artifacts, no blurred render, 
no metallic reflections, no realistic human skin`;
  const DEFAULT_IMAGE_PROMPT = `A 3D render of a minimalist futuristic concept car, a station wagon with a toy-like aesthetic. The car has a glossy white body, a sleek black panoramic glass roof, smooth rounded edges, and a glowing white light bar for a headlight. The car is set against a clean, minimal studio background with a light pastel lavender color. The lighting is soft and diffused, creating subtle reflections and soft shadows. The image is captured from a high-angle isometric perspective. Ultra-detailed, high quality, photorealistic.`;
  const DEFAULT_IMAGE_NEGATIVE_PROMPT = `cartoon, 2D, flat, vector, text, watermark, logo, blurry, grainy, noisy, pixelated, ugly, deformed, distorted proportions, cluttered background, harsh lighting, dark shadows, dull matte surfaces, street, city, people, multiple cars.`;

  // A comprehensive list of Material Symbols
  const ALL_ICON_NAMES: string[] = [
    'search', 'home', 'menu', 'close', 'settings', 'favorite', 'add', 'delete', 'arrow_back', 'star', 'chevron_right', 'logout', 'add_circle', 'cancel', 'arrow_forward', 'arrow_drop_down', 'more_vert', 'check', 'check_box', 'open_in_new', 'toggle_on', 'refresh', 'login', 'chevron_left', 'radio_button_unchecked', 'more_horiz', 'download', 'apps', 'filter_alt', 'remove', 'account_circle', 'info', 'visibility', 'visibility_off', 'edit', 'history', 'lightbulb', 'schedule', 'language', 'help', 'error', 'warning', 'cloud', 'attachment', 'camera_alt', 'collections', 'image', 'music_note', 'videocam', 'place', 'phone', 'email', 'send', 'drafts', 'archive', 'unarchive', 'inbox', 'move_to_inbox', 'shopping_cart', 'thumb_up', 'thumb_down', 'notifications', 'person', 'people', 'group', 'share', 'link', 'public', 'lock', 'lock_open', 'verified_user', 'shield', 'leaderboard', 'assessment', 'trending_up', 'timeline', 'dashboard', 'calendar_today', 'forum', 'build', 'bug_report', 'code', 'storage', 'memory', 'dns', 'router', 'httpskey', 'vpn_key', 'fingerprint', 'face', 'support', 'live_help', 'announcement', 'contact_support', 'report_problem', 'sync', 'sync_problem', 'sync_disabled', 'power_settings_new', 'bluetooth', 'wifi', 'signal_cellular_alt', 'battery_full', 'airplanemode_active', 'brightness_high', 'screen_rotation', 'volume_up', 'mic', 'videogame_asset', 'headset', 'mouse', 'keyboard', 'computer', 'desktop_windows', 'laptop', 'phone_android', 'tablet_mac', 'watch', 'devices', 'developer_mode', 'cast', 'speaker_group', 'whatshot', 'mood', 'sentiment_satisfied', 'sentiment_dissatisfied', 'sports_esports', 'fitness_center', 'kitchen', 'restaurant', 'local_cafe', 'local_bar', 'local_dining', 'local_drink', 'local_florist', 'local_gas_station', 'local_grocery_store', 'local_hospital', 'local_hotel', 'local_laundry_service', 'local_library', 'local_mall', 'local_movies', 'local_offer', 'local_parking', 'local_pharmacy', 'local_pizza', 'local_post_office', 'local_shipping', 'local_taxi', 'map', 'directions', 'train', 'tram', 'subway', 'flight', 'local_airport', 'hotel', 'atm', 'beenhere', 'store_mall_directory', 'terrain', 'satellite', 'layers', 'navigation', 'traffic', 'pedal_bike', 'agriculture', 'eco', 'pets', 'compost', 'science', 'biotech', 'architecture', 'construction', 'engineering', 'psychology', 'self_improvement', 'sports_kabaddi', 'surfing', 'volleyball', 'skateboarding', 'snowboarding', 'kayaking', 'hiking', 'downhill_skiing', 'snowshoeing', 'ice_skating', 'camping', 'kitesurfing', 'paragliding', 'climbing', 'golf_course', 'sports_golf', 'sports_tennis', 'sports_basketball', 'sports_football', 'sports_soccer', 'sports_cricket', 'sports_baseball', 'sports_hockey', 'sports_rugby', 'sports_volleyball', 'pool', 'cake', 'celebration', 'deck', 'fireplace', 'house', 'king_bed', 'night_shelter', 'outdoor_grill', 'roofing', 'stairs', 'cottage', 'balcony', 'fence', 'grass', 'wb_sunny', 'bedtime', 'ac_unit', 'blender', 'coffee_maker', 'dining', 'door_front', 'dryer', 'elevator', 'faucet', 'garage', 'light', 'microwave', 'outlet', 'shower', 'soap', 'table_restaurant', 'window', 'yard', 'chair', 'coffee', 'flatware', 'lunch_dining', 'ramen_dining', 'tapas', 'wine_bar', 'liquor', 'icecream', 'fastfood', 'hardware', 'home_repair_service', 'medical_services', 'cleaning_services', 'design_services', 'electrical_services', 'hvac', 'plumbing', 'carpenter', 'pest_control', 'miscellaneous_services', 'theater_comedy', 'festival', 'stadium', 'attractions', 'park', 'zoo', 'forest', 'museum', 'school', 'work', 'corporate_fare', 'business_center', 'child_care', 'child_friendly', 'family_restroom', 'fitness_center', 'free_breakfast', 'golf_course', 'hot_tub', 'kitchen', 'meeting_room', 'no_meeting_room', 'pool', 'room_service', 'rv_hookup', 'smoke_free', 'smoking_rooms', 'spa', 'all_inclusive', 'airport_shuttle', 'apartment', 'bathtub', 'beach_access', 'bento', 'breakfast_dining', 'brunch_dining', 'cabin', 'carpenter', 'casino', 'chair_alt', 'chalet', 'checkroom', 'child_care', 'child_friendly', 'cleaning_services', 'compost', 'corporate_fare', 'cottage', 'countertops', 'crib', 'deck', 'design_services', 'dinner_dining', 'do_not_step', 'do_not_touch', 'door_back', 'door_front', 'door_sliding', 'doorbell', 'dry_cleaning', 'dryer', 'electrical_services', 'elevator', 'emergency', 'escalator', 'escalator_warning', 'euro_symbol', 'family_restroom', 'fence', 'festival', 'fireplace', 'fire_extinguisher', 'fitness_center', 'flatware', 'food_bank', 'foundation', 'free_breakfast', 'gite', 'golf_course', 'grass', 'hardware', 'home_health', 'home_iot_device', 'home_repair_service', 'home_work', 'hot_tub', 'house', 'house_siding', 'hvac', 'icecream', 'king_bed', 'kitesurfing', 'kitchen', 'lan', 'laptop_chromebook', 'laptop_mac', 'laptop_windows', 'light', 'liquor', 'local_activity', 'lunch_dining', 'meeting_room', 'microwave', 'night_shelter', 'no_cell', 'no_drinks', 'no_flash', 'no_food', 'no_meeting_room', 'no_photography', 'no_stroller', 'outdoor_grill', 'outlet', 'pages', 'park', 'pest_control', 'pets', 'phishing', 'plumbing', 'plus_one', 'poll', 'pool', 'public_off', 'ramen_dining', 'real_estate_agent', 'recycling', 'restaurant_menu', 'rice_bowl', 'roofing', 'room_preferences', 'room_service', 'rv_hookup', 'school', 'science', 'self_improvement', 'sentiment_neutral', 'sentiment_very_dissatisfied', 'sentiment_very_satisfied', 'share_location', 'shower', 'single_bed', 'skateboarding', 'smoke_free', 'smoking_rooms', 'soap', 'social_distance', 'south', 'spa', 'sports', 'stairs', 'storefront', 'stroller', 'stadium', 'subway', 'surfing', 'sync_alt', 'tapas', 'tty', 'umbrella', 'vape_free', 'vaping_rooms', 'volcano', 'wallet', 'water_drop', 'waving_hand', 'webhook', 'whatshot', 'wine_bar', 'workspaces', 'yard', 'wrong_location', 'wysiwyg', 'youtube_searched_for', 'zoom_in', 'zoom_out', 'zoom_out_map', '10k', '10mp', '11mp', '123', '12mp', '13mp', '14mp', '15mp', '16mp', '17mp', '18mp', '19mp', '1k', '1k_plus', '1x_mobiledata', '20mp', '21mp', '22mp', '23mp', '24mp', '2k', '2k_plus', '2mp', '30fps', '30fps_select', '360', '3d_rotation', '3g_mobiledata', '3k', '3k_plus', '3mp', '3p', '4g_mobiledata', '4g_plus_mobiledata', '4k', '4k_plus', '4mp', '5g', '5k', '5k_plus', '5mp', '60fps', '60fps_select', '6_ft_apart', '6k', '6k_plus', '6mp', '7k', '7k_plus', '7mp', '8k', '8k_plus', '8mp', '9k', '9k_plus', '9mp', 'abc', 'accessibility', 'accessibility_new', 'accessible', 'accessible_forward', 'account_balance', 'account_balance_wallet', 'account_box', 'account_tree', 'ad_units', 'add_a_photo', 'add_alert', 'add_business', 'add_call', 'add_card', 'add_chart', 'add_comment', 'add_ic_call', 'add_link', 'add_location', 'add_location_alt', 'add_moderator', 'add_photo_alternate', 'add_reaction', 'add_road', 'add_shopping_cart', 'add_task', 'add_to_drive', 'add_to_home_screen', 'add_to_photos', 'add_to_queue', 'adf_scanner', 'admin_panel_settings', 'ads_click', 'agender', 'agriculture', 'air', 'airline_seat_flat', 'airline_seat_flat_angled', 'airline_seat_individual_suite', 'airline_seat_legroom_extra', 'airline_seat_legroom_normal', 'airline_seat_legroom_reduced', 'airline_seat_recline_extra', 'airline_seat_recline_normal', 'airline_stops', 'airlines', 'airplane_ticket', 'airplanemode_inactive', 'airplay', 'airport_shuttle', 'alarm', 'alarm_add', 'alarm_off', 'alarm_on', 'album', 'align_horizontal_center', 'align_horizontal_left', 'align_horizontal_right', 'align_vertical_bottom', 'align_vertical_center', 'align_vertical_top', 'all_inbox', 'all_inclusive', 'all_out', 'alternate_email', 'alt_route', 'analytics', 'anchor', 'android', 'animation', 'aod', 'apartment', 'api', 'app_blocking', 'app_registration', 'app_settings_alt', 'app_shortcut', 'approval', 'architecture', 'arrow_back_ios', 'arrow_back_ios_new', 'arrow_circle_down', 'arrow_circle_left', 'arrow_circle_right', 'arrow_circle_up', 'arrow_downward', 'arrow_drop_down_circle', 'arrow_drop_up', 'arrow_forward_ios', 'arrow_left', 'arrow_right', 'arrow_right_alt', 'arrow_upward', 'art_track', 'article', 'aspect_ratio', 'assistant', 'assistant_direction', 'assistant_photo', 'assured_workload', 'atm', 'attach_email', 'attach_file', 'attach_money', 'attractions', 'attribution', 'audio_file', 'audiotrack', 'auto_awesome', 'auto_awesome_mosaic', 'auto_awesome_motion', 'auto_delete', 'auto_fix_high', 'auto_fix_normal', 'auto_fix_off', 'auto_graph', 'auto_mode', 'auto_stories', 'autofps_select', 'autorenew', 'av_timer', 'baby_changing_station', 'back_hand', 'background_replace', 'backpack', 'backspace', 'backup', 'backup_table', 'badge', 'bakery_dining', 'balance', 'balcony', 'ballot', 'bar_chart', 'batch_prediction', 'bathroom', 'bathtub', 'battery_0_bar', 'battery_1_bar', 'battery_2_bar', 'battery_3_bar', 'battery_4_bar', 'battery_5_bar', 'battery_6_bar', 'battery_alert', 'battery_charging_full', 'battery_saver', 'battery_std', 'battery_unknown', 'beach_access', 'bed', 'bedroom_baby', 'bedroom_child', 'bedroom_parent', 'bedtime_off', 'beenhere', 'bento', 'bike_scooter', 'biotech', 'blinds', 'blinds_closed', 'block', 'bloodtype', 'bluetooth_audio', 'bluetooth_connected', 'bluetooth_disabled', 'bluetooth_drive', 'bluetooth_searching', 'blur_circular', 'blur_linear', 'blur_off', 'blur_on', 'bolt', 'book', 'book_online', 'bookmark', 'bookmark_add', 'bookmark_added', 'bookmark_border', 'bookmark_remove', 'bookmarks', 'border_all', 'border_bottom', 'border_clear', 'border_color', 'border_horizontal', 'border_inner', 'border_left', 'border_outer', 'border_right', 'border_style', 'border_top', 'border_vertical', 'boy', 'branding_watermark', 'breakfast_dining', 'breaking_news_alt_1', 'brightness_1', 'brightness_2', 'brightness_3', 'brightness_4', 'brightness_5', 'brightness_6', 'brightness_7', 'brightness_auto', 'brightness_low', 'broadcast_on_home', 'broadcast_on_personal', 'broken_image', 'browse_gallery', 'browser_not_supported', 'browser_updated', 'brunch_dining', 'brush', 'bubble_chart', 'build_circle', 'bungalow', 'burst_mode', 'bus_alert', 'business', 'business_center', 'cabin', 'cable', 'cached', 'cake', 'calculate', 'calendar_month', 'calendar_view_day', 'calendar_view_month', 'calendar_view_week', 'call', 'call_end', 'call_made', 'call_merge', 'call_missed', 'call_missed_outgoing', 'call_received', 'call_split', 'call_to_action', 'camera', 'camera_enhance', 'camera_front', 'camera_indoor', 'camera_outdoor', 'camera_rear', 'camera_roll', 'cameraswitch', 'campaign', 'cancel_presentation', 'cancel_schedule_send', 'candlestick_chart', 'car_crash', 'car_rental', 'car_repair', 'card_giftcard', 'card_membership', 'card_travel', 'carpenter', 'cases', 'casino', 'cast_connected', 'cast_for_education', 'castle', 'catching_pokemon', 'category', 'celebration', 'cell_tower', 'cell_wifi', 'center_focus_strong', 'center_focus_weak', 'chair', 'chair_alt', 'chalet', 'change_circle', 'change_history', 'charging_station', 'chat', 'chat_bubble', 'chat_bubble_outline', 'check_box_outline_blank', 'check_circle', 'check_circle_outline', 'checklist', 'checklist_rtl', 'checkroom', 'circle', 'circle_notifications', 'class', 'clean_hands', 'cleaning_services', 'clear_all', 'cloud_circle', 'cloud_done', 'cloud_download', 'cloud_off', 'cloud_queue', 'cloud_sync', 'cloud_upload', 'co2', 'co_present', 'code_off', 'coffee', 'coffee_maker', 'collections_bookmark', 'colorize', 'comment', 'comment_bank', 'comments_disabled', 'commit', 'compare', 'compare_arrows', 'compass_calibration', 'compress', 'computer', 'confirmation_number', 'connect_without_contact', 'connected_tv', 'connecting_airports', 'construction', 'contact_emergency', 'contact_mail', 'contact_page', 'contact_phone', 'contactless', 'content_copy', 'content_cut', 'content_paste', 'content_paste_go', 'content_paste_off', 'content_paste_search', 'contrast', 'control_camera', 'control_point', 'control_point_duplicate', 'conveyor_belt', 'cookie', 'copy_all', 'copyright', 'coronavirus', 'corporate_fare', 'cottage', 'countertops', 'create', 'create_new_folder', 'credit_card', 'credit_card_off', 'credit_score', 'crib', 'crisis_alert', 'crop', 'crop_16_9', 'crop_3_2', 'crop_5_4', 'crop_7_5', 'crop_din', 'crop_free', 'crop_landscape', 'crop_original', 'crop_portrait', 'crop_rotate', 'crop_square', 'cruelty_free', 'css', 'currency_bitcoin', 'currency_exchange', 'currency_franc', 'currency_lira', 'currency_pound', 'currency_ruble', 'currency_rupee', 'currency_yen', 'currency_yuan', 'curtains', 'curtains_closed', 'cut', 'cyclone', 'dangerous', 'dark_mode', 'dashboard_customize', 'data_array', 'data_exploration', 'data_object', 'data_saver_off', 'data_saver_on', 'data_thresholding', 'data_usage', 'dataset', 'dataset_linked', 'date_range', 'deblur', 'deck', 'dehaze', 'delivery_dining', 'density_large', 'density_medium', 'density_small', 'departure_board', 'description', 'deselect', 'design_services', 'desk', 'desktop_access_disabled', 'desktop_mac', 'details', 'developer_board', 'developer_board_off', 'device_hub', 'device_thermostat', 'device_unknown', 'devices_fold', 'devices_other', 'dialer_sip', 'dialpad', 'diamond', 'difference', 'dining', 'dinner_dining', 'directions_bike', 'directions_boat', 'directions_boat_filled', 'directions_bus', 'directions_bus_filled', 'directions_car', 'directions_car_filled', 'directions_off', 'directions_railway', 'directions_railway_filled', 'directions_run', 'directions_subway', 'directions_subway_filled', 'directions_transit', 'directions_transit_filled', 'directions_walk', 'dirty_lens', 'disabled_by_default', 'disabled_visible', 'disc_full', 'discount', 'display_settings', 'diversity_1', 'diversity_2', 'diversity_3', 'dnd_forwardslash', 'do_disturb', 'do_disturb_alt', 'do_disturb_off', 'do_disturb_on', 'do_not_disturb', 'do_not_disturb_alt', 'do_not_disturb_off', 'do_not_disturb_on', 'do_not_disturb_on_total_silence', 'do_not_step', 'do_not_touch', 'dock', 'document_scanner', 'domain', 'domain_add', 'domain_disabled', 'domain_verification', 'done', 'done_all', 'done_outline', 'donut_large', 'donut_small', 'door_back', 'door_front', 'door_sliding', 'doorbell', 'double_arrow', 'downhill_skiing', 'drafts', 'drag_handle', 'drag_indicator', 'draw', 'drive_eta', 'drive_file_move', 'drive_file_move_rtl', 'drive_file_rename_outline', 'drive_folder_upload', 'dry', 'dry_cleaning', 'duo', 'dvr', 'dynamic_feed', 'dynamic_form', 'e_mobiledata', 'earbuds', 'earbuds_battery', 'east', 'edgesensor_high', 'edgesensor_low', 'edit_attributes', 'edit_calendar', 'edit_location', 'edit_location_alt', 'edit_note', 'edit_notifications', 'edit_off', 'edit_road', 'egg', 'egg_alt', 'eject', 'elderly', 'elderly_woman', 'electric_bike', 'electric_bolt', 'electric_car', 'electric_meter', 'electric_moped', 'electric_rickshaw', 'electric_scooter', 'electrical_services', 'elevator', 'emergency_recording', 'emergency_share', 'energy_savings_leaf', 'enhanced_encryption', 'equalizer', 'error_outline', 'escalator', 'escalator_warning', 'euro', 'euro_symbol', 'ev_station', 'event', 'event_available', 'event_busy', 'event_note', 'event_repeat', 'event_seat', 'exit_to_app', 'expand', 'expand_circle_down', 'expand_less', 'expand_more', 'explicit', 'explore', 'explore_off', 'exposure', 'exposure_neg_1', 'exposure_neg_2', 'exposure_plus_1', 'exposure_plus_2', 'exposure_zero', 'extension', 'extension_off', 'f_mobiledata', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6', 'face_retouching_natural', 'face_retouching_off', 'fact_check', 'factory', 'family_restroom', 'fast_forward', 'fast_rewind', 'fastfood', 'favorite_border', 'fax', 'featured_play_list', 'featured_video', 'feed', 'feedback', 'female', 'fence', 'festival', 'fiber_dvr', 'fiber_manual_record', 'fiber_new', 'fiber_pin', 'fiber_smart_record', 'file_copy', 'file_download', 'file_download_done', 'file_download_off', 'file_open', 'file_present', 'file_upload', 'file_upload_off', 'filter', 'filter_1', 'filter_2', 'filter_3', 'filter_4', 'filter_5', 'filter_6', 'filter_7', 'filter_8', 'filter_9', 'filter_9_plus', 'filter_b_and_w', 'filter_center_focus', 'filter_drama', 'filter_frames', 'filter_hdr', 'filter_list', 'filter_list_off', 'filter_none', 'filter_tilt_shift', 'filter_vintage', 'find_in_page', 'find_replace', 'fire_extinguisher', 'fire_hydrant_alt', 'fire_truck', 'fireplace', 'first_page', 'fit_screen', 'fitbit', 'fitness_center', 'flag', 'flag_circle', 'flaky', 'flare', 'flash_auto', 'flash_off', 'flash_on', 'flashlight_off', 'flashlight_on', 'flatware', 'flight_class', 'flight_land', 'flight_takeoff', 'flip', 'flip_camera_android', 'flip_camera_ios', 'flip_to_back', 'flip_to_front', 'flood', 'flourescent', 'flutter_dash', 'fmd_bad', 'fmd_good', 'folder', 'folder_copy', 'folder_delete', 'folder_off', 'folder_open', 'folder_shared', 'folder_special', 'folder_zip', 'follow_the_signs', 'font_download', 'font_download_off', 'food_bank', 'forest', 'fork_left', 'fork_right', 'format_align_center', 'format_align_justify', 'format_align_left', 'format_align_right', 'format_bold', 'format_clear', 'format_color_fill', 'format_color_reset', 'format_color_text', 'format_indent_decrease', 'format_indent_increase', 'format_italic', 'format_line_spacing', 'format_list_bulleted', 'format_list_numbered', 'format_list_numbered_rtl', 'format_overline', 'format_paint', 'format_quote', 'format_shapes', 'format_size', 'format_strikethrough', 'format_textdirection_l_to_r', 'format_textdirection_r_to_l', 'format_underlined', 'fort', 'forward_to_inbox', 'foundation', 'free_breakfast', 'free_cancellation', 'front_hand', 'fullscreen', 'fullscreen_exit', 'functions', 'g_mobiledata', 'g_translate', 'gamepad', 'games', 'garage', 'gas_meter', 'gavel', 'generating_tokens', 'gesture', 'get_app', 'gif', 'gif_box', 'girl', 'gite', 'glyphs', 'golf_course', 'gpp_bad', 'gpp_good', 'gpp_maybe', 'gps_fixed', 'gps_not_fixed',
    'grade',
    'gradient',
    'grading',
    'grain',
    'graphic_eq',
    'grass',
    'grid_3x3',
    'grid_4x4',
    'grid_goldenratio',
    'grid_off',
    'grid_on',
    'grid_view',
    'group_add',
    'group_off',
    'group_remove',
    'group_work',
    'groups',
    'groups_2',
    'groups_3',
    'h_mobiledata',
    'h_plus_mobiledata',
    'hail',
    'handshake',
    'handyman',
    'hardware',
    'hd',
    'hdr_auto',
    'hdr_auto_select',
    'hdr_enhanced_select',
    'hdr_off',
    'hdr_off_select',
    'hdr_on',
    'hdr_on_select',
    'hdr_plus',
    'hdr_strong',
    'hdr_weak',
    'headphones',
    'headphones_battery',
    'headset_mic',
    'headset_off',
    'healing',
    'health_and_safety',
    'hearing',
    'hearing_disabled',
    'heart_broken',
    'heat_pump',
    'height',
    'help_center',
    'help_outline',
    'hevc',
    'hexagon',
    'hide_image',
    'hide_source',
    'high_quality',
    'highlight',
    'highlight_alt',
    'highlight_off',
    'hiking',
    'history_edu',
    'history_toggle_off',
    'hive',
    'hls',
    'hls_off',
    'holiday_village',
    'home_iot_device',
    'home_max',
    'home_mini',
    'home_repair_service',
    'home_work',
    'horizontal_distribute',
    'horizontal_rule',
    'horizontal_split',
    'hot_tub',
    'hotel_class',
    'hourglass_bottom',
    'hourglass_disabled',
    'hourglass_empty',
    'hourglass_full',
    'hourglass_top',
    'house_siding',
    'houseboat',
    'how_to_reg',
    'how_to_vote',
    'html',
    'http',
    'hub',
    'hvac',
    'ice_skating',
    'icecream',
    'image_aspect_ratio',
    'image_not_supported',
    'image_search',
    'imagesearch_roller',
    'import_contacts',
    'import_export',
    'important_devices',
    'incomplete_circle',
    'indeterminate_check_box',
    'install_desktop',
    'install_mobile',
    'integration_instructions',
    'interests',
    'interpreter_mode',
    'inventory',
    'inventory_2',
    'invert_colors',
    'invert_colors_off',
    'ios_share',
    'iron',
    'iso',
    'javascript',
    'join_full',
    'join_inner',
    'join_left',
    'join_right',
    'kayaking',
    'kebab_dining',
    'key',
    'key_off',
    'keyboard_alt',
    'keyboard_arrow_down',
    'keyboard_arrow_left',
    'keyboard_arrow_right',
    'keyboard_arrow_up',
    'keyboard_backspace',
    'keyboard_capslock',
    'keyboard_command_key',
    'keyboard_control_key',
    'keyboard_double_arrow_down',
    'keyboard_double_arrow_left',
    'keyboard_double_arrow_right',
    'keyboard_double_arrow_up',
    'keyboard_hide',
    'keyboard_option_key',
    'keyboard_return',
    'keyboard_tab',
    'keyboard_voice',
    'king_bed',
    'kitesurfing',
    'label',
    'label_important',
    'label_important_outline',
    'label_off',
    'label_outline',
    'lan',
    'landscape',
    'landslide',
    'laptop_chromebook',
    'laptop_mac',
    'laptop_windows',
    'last_page',
    'launch',
    'layers_clear',
    'leaderboard',
    'leak_add',
    'leak_remove',
    'legend_toggle',
    'lens',
    'lens_blur',
    'library_add',
    'library_add_check',
    'library_books',
    'library_music',
    'light_mode',
    'lightbulb_circle',
    'line_axis',
    'line_style',
    'line_weight',
    'linear_scale',
    'link_off',
    'linked_camera',
    'liquor',
    'list',
    'list_alt',
    'live_tv',
    'living',
    'local_activity',
    'location_city',
    'location_disabled',
    'location_off',
    'location_on',
    'location_searching',
    'lock_clock',
    'lock_person',
    'lock_reset',
    'looks',
    'looks_3',
    'looks_4',
    'looks_5',
    'looks_6',
    'looks_one',
    'looks_two',
    'loop',
    'loupe',
    'low_priority',
    'lte_mobiledata',
    'lte_plus_mobiledata',
    'luggage',
    'lunch_dining',
    'lyrics',
    'macro_off',
    'mail',
    'mail_lock',
    'mail_outline',
    'male',
    'man',
    'man_2',
    'man_3',
    'man_4',
    'manage_accounts',
    'manage_history',
    'manage_search',
    'maps_home_work',
    'maps_ugc',
    'margin',
    'mark_as_unread',
    'mark_chat_read',
    'mark_chat_unread',
    'mark_email_read',
    'mark_email_unread',
    'mark_unread_chat_alt',
    'markunread',
    'markunread_mailbox',
    'masks',
    'maximize',
    'media_bluetooth_off',
    'media_bluetooth_on',
    'mediation',
    'medical_information',
    'medical_services',
    'medication',
    'medication_liquid',
    'meeting_room',
    'memory',
    'menu_book',
    'menu_open',
    'merge',
    'merge_type',
    'message',
    'mic_external_off',
    'mic_external_on',
    'mic_none',
    'mic_off',
    'microwave',
    'military_tech',
    'minimize',
    'minor_crash',
    'miscellaneous_services',
    'missed_video_call',
    'mms',
    'mobile_friendly',
    'mobile_off',
    'mobile_screen_share',
    'mobiledata_off',
    'mode',
    'mode_comment',
    'mode_edit',
    'mode_edit_outline',
    'mode_fan_off',
    'mode_night',
    'mode_of_travel',
    'mode_standby',
    'model_training',
    'monetization_on',
    'money',
    'money_off',
    'money_off_csred',
    'monitor',
    'monitor_heart',
    'monitor_weight',
    'monochrome_photos',
    'mood_bad',
    'moped',
    'more',
    'more_down',
    'more_time',
    'more_up',
    'mosque',
    'motion_photos_auto',
    'motion_photos_off',
    'motion_photos_on',
    'motion_photos_pause',
    'motion_photos_paused',
    'motorcycle',
    'mountain_flag',
    'move_down',
    'move_to_inbox',
    'move_up',
    'movie',
    'movie_creation',
    'movie_filter',
    'moving',
    'mp',
    'multiline_chart',
    'multiple_stop',
    'museum',
    'music_off',
    'music_video',
    'my_location',
    'nat',
    'nature',
    'nature_people',
    'navigate_before',
    'navigate_next',
    'nearby_error',
    'nearby_off',
    'nest_cam_wired_stand',
    'network_cell',
    'network_check',
    'network_locked',
    'network_ping',
    'network_wifi',
    'network_wifi_1_bar',
    'network_wifi_2_bar',
    'network_wifi_3_bar',
    'new_label',
    'new_releases',
    'newspaper',
    'next_plan',
    'next_week',
    'nfc',
    'night_shelter',
    'nightlife',
    'nightlight',
    'nightlight_round',
    'nights_stay',
    'no_accounts',
    'no_adult_content',
    'no_backpack',
    'no_crash',
    'no_encryption',
    'no_encryption_gmailerrorred',
    'no_luggage',
    'no_meals',
    'no_sim',
    'no_transfer',
    'noise_aware',
    'noise_control_off',
    'nordic_walking',
    'north',
    'north_east',
    'north_west',
    'not_accessible',
    'not_interested',
    'not_listed_location',
    'not_started',
    'note',
    'note_add',
    'note_alt',
    'notes',
    'notification_add',
    'notification_important',
    'notifications_active',
    'notifications_none',
    'notifications_off',
    'notifications_paused',
    'numbers',
    'offline_bolt',
    'offline_pin',
    'offline_share',
    'oil_barrel',
    'on_device_training',
    'ondemand_video',
    'online_prediction',
    'opacity',
    'open_in_browser',
    'open_in_full',
    'open_with',
    'other_houses',
    'outbound',
    'outbox',
    'outdoor_grill',
    'outgoing_mail',
    'outlet',
    'outlined_flag',
    'output',
    'padding',
    'pages',
    'pageview',
    'paid',
    'palette',
    'pan_tool',
    'pan_tool_alt',
    'panorama',
    'panorama_fish_eye',
    'panorama_horizontal',
    'panorama_horizontal_select',
    'panorama_photosphere',
    'panorama_photosphere_select',
    'panorama_vertical',
    'panorama_vertical_select',
    'panorama_wide_angle',
    'panorama_wide_angle_select',
    'paragliding',
    'park',
    'party_mode',
    'password',
    'pattern',
    'pause',
    'pause_circle',
    'pause_circle_filled',
    'pause_circle_outline',
    'pause_presentation',
    'payment',
    'payments',
    'pedal_bike',
    'pending',
    'pending_actions',
    'pentagon',
    'people_alt',
    'people_outline',
    'percent',
    'perm_camera_mic',
    'perm_contact_calendar',
    'perm_data_setting',
    'perm_device_information',
    'perm_identity',
    'perm_media',
    'perm_phone_msg',
    'perm_scan_wifi',
    'person_add',
    'person_add_alt',
    'person_add_alt_1',
    'person_add_disabled',
    'person_off',
    'person_outline',
    'person_pin',
    'person_pin_circle',
    'person_remove',
    'person_remove_alt_1',
    'person_search',
    'personal_injury',
    'personal_video',
    'pest_control',
    'pest_control_rodent',
    'pets',
    'phishing',
    'phone_bluetooth_speaker',
    'phone_callback',
    'phone_disabled',
    'phone_enabled',
    'phone_forwarded',
    'phone_in_talk',
    'phone_iphone',
    'phone_locked',
    'phone_missed',
    'phone_paused',
    'phonelink',
    'phonelink_erase',
    'phonelink_lock',
    'phonelink_off',
    'phonelink_ring',
    'phonelink_setup',
    'photo',
    'photo_album',
    'photo_camera_back',
    'photo_camera_front',
    'photo_filter',
    'photo_library',
    'photo_size_select_actual',
    'photo_size_select_large',
    'photo_size_select_small',
    'php',
    'piano',
    'piano_off',
    'picture_as_pdf',
    'picture_in_picture',
    'picture_in_picture_alt',
    'pie_chart',
    'pie_chart_outline',
    'pin',
    'pin_drop',
    'pin_end',
    'pin_invoke',
    'pinch',
    'pivot_table_chart',
    'pix',
    'plagiarism',
    'play_arrow',
    'play_circle',
    'play_circle_filled',
    'play_circle_outline',
    'play_disabled',
    'play_for_work',
    'play_lesson',
    'playlist_add',
    'playlist_add_check',
    'playlist_add_check_circle',
    'playlist_add_circle',
    'playlist_play',
    'playlist_remove',
    'plumbing',
    'plus_one',
    'podcasts',
    'point_of_sale',
    'policy',
    'poll',
    'polyline',
    'polymer',
    'portable_wifi_off',
    'portrait',
    'post_add',
    'power',
    'power_input',
    'power_off',
    'precision_manufacturing',
    'pregnant_woman',
    'present_to_all',
    'preview',
    'price_change',
    'price_check',
    'print',
    'print_disabled',
    'priority_high',
    'privacy_tip',
    'private_connectivity',
    'production_quantity_limits',
    'propane',
    'propane_tank',
    'psychology_alt',
    'public_off',
    'publish',
    'published_with_changes',
    'punch_clock',
    'push_pin',
    'qr_code',
    'qr_code_2',
    'qr_code_scanner',
    'query_builder',
    'query_stats',
    'question_answer',
    'question_mark',
    'queue',
    'queue_music',
    'queue_play_next',
    'quickreply',
    'quiz',
    'r_mobiledata',
    'radar',
    'radio',
    'radio_button_checked',
    'railway_alert',
    'ramen_dining',
    'ramp_left',
    'ramp_right',
    'rate_review',
    'raw_off',
    'raw_on',
    'read_more',
    'real_estate_agent',
    'receipt',
    'receipt_long',
    'recommend',
    'record_voice_over',
    'rectangle',
    'recycling',
    'redeem',
    'redo',
    'reduce_capacity',
    'remember_me',
    'remove_circle',
    'remove_circle_outline',
    'remove_done',
    'remove_from_queue',
    'remove_moderator',
    'remove_red_eye',
    'remove_road',
    'remove_shopping_cart',
    'reorder',
    'repartition',
    'repeat',
    'repeat_on',
    'repeat_one',
    'repeat_one_on',
    'replay',
    'replay_10',
    'replay_30',
    'replay_5',
    'replay_circle_filled',
    'reply',
    'reply_all',
    'report',
    'report_gmailerrorred',
    'report_off',
    'request_page',
    'request_quote',
    'reset_tv',
    'restart_alt',
    'restaurant_menu',
    'restore',
    'restore_from_trash',
    'restore_page',
    'reviews',
    'rice_bowl',
    'ring_volume',
    'rocket',
    'rocket_launch',
    'roller_shades',
    'roller_shades_closed',
    'roofing',
    'room',
    'room_preferences',
    'room_service',
    'rotate_90_degrees_ccw',
    'rotate_90_degrees_cw',
    'rotate_left',
    'rotate_right',
    'roundabout_left',
    'roundabout_right',
    'rounded_corner',
    'route',
    'rowing',
    'rss_feed',
    'rsvp',
    'rtt',
    'rule',
    'rule_folder',
    'run_circle',
    'running_with_errors',
    'rv_hookup',
    'safety_check',
    'safety_divider',
    'sailing',
    'sanitizer',
    'satellite_alt',
    'save',
    'save_alt',
    'save_as',
    'saved_search',
    'savings',
    'scale',
    'scanner',
    'scatter_plot',
    'schedule_send',
    'schema',
    'screenshot',
    'screenshot_monitor',
    'sd',
    'sd_card',
    'sd_card_alert',
    'sd_storage',
    'search_off',
    'security',
    'security_update',
    'security_update_good',
    'security_update_warning',
    'segment',
    'select_all',
    'sell',
    'send_and_archive',
    'send_time_extension',
    'send_to_mobile',
    'sensor_door',
    'sensor_occupied',
    'sensor_window',
    'sensors',
    'sensors_off',
    'sentiment_satisfied_alt',
    'set_meal',
    'settings_accessibility',
    'settings_applications',
    'settings_backup_restore',
    'settings_bluetooth',
    'settings_brightness',
    'settings_cell',
    'settings_ethernet',
    'settings_input_antenna',
    'settings_input_component',
    'settings_input_composite',
    'settings_input_hdmi',
    'settings_input_svideo',
    'settings_overscan',
    'settings_phone',
    'settings_power',
    'settings_remote',
    'settings_suggest',
    'settings_system_daydream',
    'settings_voice',
    'severe_cold',
    'shape_line',
    'shapes',
    'shortcut',
    'shop',
    'shop_2',
    'shop_two',
    'shopping_bag',
    'shopping_basket',
    'shopping_cart_checkout',
    'short_text',
    'show_chart',
    'shuffle',
    'shuffle_on',
    'shutter_speed',
    'sick',
    'sign_language',
    'signal_cellular_0_bar',
    'signal_cellular_4_bar',
    'signal_cellular_alt_1_bar',
    'signal_cellular_alt_2_bar',
    'signal_cellular_connected_no_internet_0_bar',
    'signal_cellular_connected_no_internet_4_bar',
    'signal_cellular_no_sim',
    'signal_cellular_nodata',
    'signal_cellular_null',
    'signal_cellular_off',
    'signal_wifi_0_bar',
    'signal_wifi_4_bar',
    'signal_wifi_4_bar_lock',
    'signal_wifi_bad',
    'signal_wifi_connected_no_internet_4',
    'signal_wifi_off',
    'signal_wifi_statusbar_4_bar',
    'signal_wifi_statusbar_connected_no_internet_4',
    'signal_wifi_statusbar_null',
    'signpost',
    'sim_card',
    'sim_card_alert',
    'sim_card_download',
    'single_bed',
    'sip',
    'skip_next',
    'skip_previous',
    'sledding',
    'slideshow',
    'slow_motion_video',
    'smart_button',
    'smart_display',
    'smart_screen',
    'smart_toy',
    'smartphone',
    'smoke_free',
    'smoking_rooms',
    'sms',
    'sms_failed',
    'snippet_folder',
    'snooze',
    'soap',
    'social_distance',
    'solar_power',
    'sort',
    'sort_by_alpha',
    'sos',
    'soup_kitchen',
    'source',
    'south_america',
    'south_east',
    'south_west',
    'space_bar',
    'space_dashboard',
    'spatial_audio',
    'spatial_audio_off',
    'spatial_tracking',
    'speaker',
    'speaker_notes',
    'speaker_notes_off',
    'speaker_phone',
    'speed',
    'spellcheck',
    'splitscreen',
    'spoke',
    'sports_bar',
    'square',
    'square_foot',
    'ssid_chart',
    'stacked_bar_chart',
    'stacked_line_chart',
    'stadia_controller',
    'stadium',
    'stairs',
    'star_border',
    'star_border_purple500',
    'star_half',
    'star_outline',
    'star_purple500',
    'star_rate',
    'stars',
    'start',
    'stay_current_landscape',
    'stay_current_portrait',
    'stay_primary_landscape',
    'stay_primary_portrait',
    'sticky_note_2',
    'stop',
    'stop_circle',
    'stop_screen_share',
    'storage',
    'store',
    'storefront',
    'storm',
    'straight',
    'straighten',
    'stream',
    'streetview',
    'strikethrough_s',
    'stroller',
    'style',
    'subdirectory_arrow_left',
    'subdirectory_arrow_right',
    'subject',
    'subscriptions',
    'subscripts',
    'subtitles',
    'subtitles_off',
    'summarize',
    'superscript',
    'supervised_user_circle',
    'supervisor_account',
    'support_agent',
    'swap_calls',
    'swap_horiz',
    'swap_horizontal_circle',
    'swap_vert',
    'swap_vertical_circle',
    'swipe',
    'swipe_down',
    'swipe_down_alt',
    'swipe_left',
    'swipe_left_alt',
    'swipe_right',
    'swipe_right_alt',
    'swipe_up',
    'swipe_up_alt',
    'swipe_vertical',
    'switch_access_shortcut',
    'switch_access_shortcut_add',
    'switch_account',
    'switch_camera',
    'switch_left',
    'switch_right',
    'switch_video',
    'synagogue',
    'system_security_update',
    'system_security_update_good',
    'system_security_update_warning',
    'system_update',
    'system_update_alt',
    'tab',
    'tab_unselected',
    'table_bar',
    'table_chart',
    'table_restaurant',
    'table_rows',
    'table_view',
    'tablet',
    'tag',
    'tag_faces',
    'takeout_dining',
    'task',
    'task_alt',
    'taxi_alert',
    'temple_buddhist',
    'temple_hindu',
    'terminal',
    'text_decrease',
    'text_fields',
    'text_format',
    'text_increase',
    'text_rotate_up',
    'text_rotate_vertical',
    'text_rotation_angledown',
    'text_rotation_angleup',
    'text_rotation_down',
    'text_rotation_none',
    'text_snippet',
    'textsms',
    'texture',
    'theater_comedy',
    'theaters',
    'thermostat',
    'thermostat_auto',
    'thumb_down_alt',
    'thumb_down_off_alt',
    'thumb_up_alt',
    'thumb_up_off_alt',
    'thumbs_up_down',
    'time_to_leave',
    'timelapse',
    'tips_and_updates',
    'tire_repair',
    'title',
    'toast',
    'toc',
    'today',
    'toggle_off',
    'token',
    'toll',
    'tonality',
    'topic',
    'tornado',
    'touch_app',
    'tour',
    'toys',
    'track_changes',
    'transcribe',
    'transfer_within_a_station',
    'transform',
    'transgender',
    'transit_enterexit',
    'translate',
    'travel_explore',
    'trending_down',
    'trending_flat',
    'trip_origin',
    'troubleshoot',
    'try',
    'tsunami',
    'tty',
    'tune',
    'tungsten',
    'turn_left',
    'turn_right',
    'turn_sharp_left',
    'turn_sharp_right',
    'turn_slight_left',
    'turn_slight_right',
    'turned_in',
    'turned_in_not',
    'tv',
    'tv_off',
    'two_wheeler',
    'type_specimen',
    'u_turn_left',
    'u_turn_right',
    'unfold_less',
    'unfold_more',
    'unpublished',
    'unsubscribe',
    'upcoming',
    'update',
    'update_disabled',
    'upgrade',
    'upload',
    'upload_file',
    'usb',
    'usb_off',
    'vaccines',
    'vape_free',
    'vaping_rooms',
    'verified',
    'vertical_align_bottom',
    'vertical_align_center',
    'vertical_align_top',
    'vertical_distribute',
    'vertical_shades',
    'vertical_shades_closed',
    'vertical_split',
    'vibration',
    'video_call',
    'video_camera_back',
    'video_camera_front',
    'video_chat',
    'video_file',
    'video_label',
    'video_library',
    'video_settings',
    'video_stable',
    'videocam_off',
    'view_agenda',
    'view_array',
    'view_carousel',
    'view_column',
    'view_comfy',
    'view_comfy_alt',
    'view_compact',
    'view_compact_alt',
    'view_cozy',
    'view_day',
    'view_headline',
    'view_in_ar',
    'view_kanban',
    'view_list',
    'view_module',
    'view_quilt',
    'view_sidebar',
    'view_stream',
    'view_timeline',
    'view_week',
    'vignette',
    'villa',
    'visibility',
    'visibility_off',
    'voice_chat',
    'voice_over_off',
    'voicemail',
    'volcano',
    'volume_down',
    'volume_mute',
    'volume_off',
    'volunteer_activism',
    'vpn_lock',
    'vrpano',
    'wallpaper',
    'warehouse',
    'warning_amber',
    'wash',
    'watch_later',
    'watch_off',
    'water',
    'water_damage',
    'waterfall_chart',
    'waves',
    'waving_hand',
    'wb_auto',
    'wb_cloudy',
    'wb_incandescent',
    'wb_iridescent',
    'wb_shade',
    'wb_twilight',
    'wc',
    'web',
    'web_asset',
    'web_asset_off',
    'web_stories',
    'webhook',
    'weekend',
    'west',
    'whatshot',
    'wheelchair_pickup',
    'where_to_vote',
    'widgets',
    'width_full',
    'width_normal',
    'width_wide',
    'wifi_1_bar',
    'wifi_2_bar',
    'wifi_calling',
    'wifi_calling_3',
    'wifi_channel',
    'wifi_find',
    'wifi_lock',
    'wifi_off',
    'wifi_password',
    'wifi_protected_setup',
    'wifi_tethering',
    'wifi_tethering_error',
    'wifi_tethering_off',
    'wind_power',
    'window',
    'wine_bar',
    'woman',
    'woman_2',
    'work_history',
    'work_off',
    'work_outline',
    'workspace_premium',
    'workspaces',
    'wrap_text',
    'wrong_location',
    'wysiwyg',
    'yard',
    'youtube_searched_for',
    'zoom_in_map',
    'zoom_out_map',
  ];
  // --- GEMINI API ---
  let ai: GoogleGenAI;
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } else {
    console.error('API_KEY is not set. Please check your environment variables.');
    // Handle the missing API key case, maybe show an error to the user
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

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
        },
      });

      currentBase64Image = response.generatedImages[0].image.imageBytes;
      generatedImage.src = `data:image/png;base64,${currentBase64Image}`;
      generatedImage.style.display = '';
      downloadBtn.disabled = false;
      convertToVideoBtn.disabled = false;
      updateCodeSnippetsTab();
      switchPreviewTab('image');
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
    regenerateBtn.disabled = true;
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
        model: 'veo-2.0-generate-001',
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
      regenerateBtn.disabled = false;
      // Keep download disabled as we don't have video download yet
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

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
        },
      });

      const base64Image = response.generatedImages[0].image.imageBytes;
      generatedImageMain.src = `data:image/png;base64,${base64Image}`;
      generatedImageMain.style.display = 'block';
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
    homeScreen.classList.remove('hidden');
    iconBuilderScreen.classList.add('hidden');
    imageBuilderScreen.classList.add('hidden');
  }

  function showIconBuilderScreen() {
    homeScreen.classList.add('hidden');
    iconBuilderScreen.classList.remove('hidden');
    imageBuilderScreen.classList.add('hidden');
  }

  function showImageBuilderScreen(promptFromHome: string | null = null) {
    homeScreen.classList.add('hidden');
    iconBuilderScreen.classList.add('hidden');
    imageBuilderScreen.classList.remove('hidden');

    imagePromptInput.value = promptFromHome || DEFAULT_IMAGE_PROMPT;
    imageNegativePromptInput.value = DEFAULT_IMAGE_NEGATIVE_PROMPT;

    generatedImageMain.src = '';
    generatedImageMain.style.display = 'none';
    imageErrorMessage.style.display = 'none';

    if (promptFromHome) {
      generateImage();
    }
  }


  function applyIconStyle(element: HTMLElement, style: IconStyle) {
    element.style.fontVariationSettings = `'FILL' ${style.fill}, 'wght' ${style.weight}, 'GRAD' ${style.grade}, 'opsz' ${style.opticalSize}`;
  }

  function createIconItem(iconName: string): HTMLDivElement {
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
    const icons = iconGrid.querySelectorAll<HTMLElement>(
      '.material-symbols-outlined, .material-symbols-rounded, .material-symbols-sharp',
    );
    icons.forEach((icon) => {
      // Update class name for family
      icon.className = `material-symbols-${currentStyle.family.toLowerCase()}`;
      // Update font variation settings
      applyIconStyle(icon, currentStyle);
    });

    // If an icon is selected, update the snippets
    if (selectedIconName) {
      updateCodeSnippetsTab();
    }
  }

  function loadIcons(startIndex: number, count: number) {
    const fragment = document.createDocumentFragment();
    const iconsToLoad = filteredIconNames.slice(startIndex, startIndex + count);
    iconsToLoad.forEach((iconName) => {
      const iconItem = createIconItem(iconName);
      fragment.appendChild(iconItem);
    });
    iconGrid.appendChild(fragment);
    currentIconIndex = startIndex + count;
  }

  function handleIconSelection(iconName: string) {
    if (selectedIconName === iconName) return;

    // Deselect previous icon
    const prevSelected = iconGrid.querySelector('.icon-item.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }

    // Select new icon
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
    // Reset video and tab state
    currentBase64Image = null;
    generatedVideo.src = '';
    switchPreviewTab('image');
    videoTabBtn.disabled = true;

    // Update prompt and snippets
    updateInspector3dTab();
    updateCodeSnippetsTab();

    // Set "Generate 3D" as the active tab
    const generateTab = document.querySelector('.tab-item[data-tab="generate"]');
    const customizeTabContent = document.getElementById('tab-content-customize');

    inspectorTabs.forEach((t) =>
      t.classList.toggle('active', t === generateTab),
    );
    tabContents.forEach((content) => {
      (content as HTMLElement).classList.toggle(
        'hidden',
        (content as HTMLElement).dataset.tabContent !== 'generate',
      );
    });

    // Start generation
    generate3dIcon();
  }

  function updateInspector3dTab() {
    if (!selectedIconName) return;
    promptInput.value = PROMPT_TEMPLATE_3D.replace(/\[SUBJECT\]/g, selectedIconName);
    negativePromptInput.value = PROMPT_TEMPLATE_3D_NEGATIVE;
  }

  function filterAndRenderIcons(query: string) {
    query = query.toLowerCase();
    filteredIconNames = ALL_ICON_NAMES.filter((name) => name.includes(query));

    // Reset grid and intersection observer
    iconGrid.innerHTML = '';
    currentIconIndex = 0;
    if (observer) {
      observer.disconnect();
    }

    // Load first batch and set up observer
    loadIcons(0, ICONS_PER_BATCH);
    if (filteredIconNames.length > ICONS_PER_BATCH) {
      if (!sentinel.parentNode) {
        iconGrid.parentNode?.appendChild(sentinel);
      }
      observer?.observe(sentinel);
    }
  }

  function switchPreviewTab(tab: 'image' | 'video') {
    const isImage = tab === 'image';
    imageTabBtn.classList.toggle('active', isImage);
    videoTabBtn.classList.toggle('active', !isImage);
    imageTabContent.classList.toggle('active', isImage);
    videoTabContent.classList.toggle('active', !isImage);
  }


  // --- CODE SNIPPET FUNCTIONS ---

  const handleCopyClick = (button: HTMLButtonElement, code: string) => {
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

    // HTML Snippet (Font URL + Icon Span)
    const fontUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+${family}:opsz,wght,FILL,GRAD@${opticalSize},${weight},${fill},${grade}&icon_names=${selectedIconName}`;
    const htmlSnippet =
      `<!-- 1. Add the font stylesheet to your HTML <head> -->\n` +
      `<link rel="stylesheet" href="${fontUrl}" />\n\n` +
      `<!-- 2. Use the icon in your HTML <body> -->\n` +
      `<span class="material-symbols-${familyLower}">${selectedIconName}</span>`;

    // CSS Snippet
    const cssSnippet =
      `.material-symbols-${familyLower} {\n` +
      `  font-variation-settings:\n` +
      `  'FILL' ${fill},\n` +
      `  'wght' ${weight},\n` +
      `  'GRAD' ${grade},\n` +
      `  'opsz' ${opticalSize}\n` +
      `}`;

    snippetHtmlCode.textContent = htmlSnippet;
    snippetCssCode.textContent = cssSnippet;
  }

  function update3dCodeSnippet() {
    if (generatedImage.src && selectedIconName && currentBase64Image) {
      const dataUri = `data:image/png;base64,${currentBase64Image}`;
      // Truncate for display in the <pre> tag
      const displayedUri = dataUri.substring(0, 60) + '...';
      const displaySnippet =
        `<!-- Use the generated image in your HTML -->\n` +
        `<img src="${displayedUri}"\n` +
        `     alt="A 3D model of ${selectedIconName}" />`;

      const fullSnippet =
        `<!-- Use the generated image in your HTML -->\n` +
        `<img src="${dataUri}"\n` +
        `     alt="A 3D model of ${selectedIconName}" />`;

      snippet3dCode.textContent = displaySnippet;
      snippet3dCode.dataset.fullCode = fullSnippet; // Store full version for copying
      snippet3dSection.classList.remove('hidden');
    } else {
      snippet3dSection.classList.add('hidden');
      delete snippet3dCode.dataset.fullCode;
      snippet3dCode.textContent = '';
    }
  }

  function updateAnimationCodeSnippets() {
    const animation = previewAnimationType.value;
    const repeat = previewAnimationRepeat.value;
    const duration = '1s'; // Let's keep it simple for now

    if (!animation) {
      snippetAnimSection.classList.add('hidden');
      return;
    }

    snippetAnimSection.classList.remove('hidden');

    let keyframes = '';
    // These keyframes are already defined in the main CSS, so we just show them as an example.
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

    snippetAnimKeyframesCode.textContent = keyframes;
    snippetAnimClassCode.textContent = classCss;
  }

  function updateAnimationPreview() {
    if (!selectedIconName) return;

    const iconSpan = document.createElement('span');
    iconSpan.className = `material-symbols-${currentStyle.family.toLowerCase()}`;
    iconSpan.textContent = selectedIconName;
    applyIconStyle(iconSpan, currentStyle);

    previewBoxAnimation.innerHTML = '';
    previewBoxAnimation.appendChild(iconSpan);
  }

  // --- CANVAS BACKGROUND ANIMATION ---
  function initCanvasAnimation() {
    const ctx = homeCanvas.getContext('2d');
    if (!ctx) return;

    let width = (homeCanvas.width = window.innerWidth);
    let height = (homeCanvas.height = window.innerHeight);
    let particles: Particle[] = [];
    const particleCount = 50;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

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

      draw(context: CanvasRenderingContext2D) {
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
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        p.update();
        p.draw(ctx!);
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
    // Set initial theme to dark
    document.body.dataset.theme = 'dark';

    // Initial icon load
    filterAndRenderIcons('');

    // Set initial screen
    showHomeScreen();

    // Start canvas animation
    initCanvasAnimation();


    // Infinite scroll observer
    observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentIconIndex < filteredIconNames.length
        ) {
          loadIcons(currentIconIndex, ICONS_PER_BATCH);
        }
      },
      { root: null, threshold: 0.1 },
    );
    observer.observe(sentinel);

    // --- Event Listeners ---
    // Home Screen Navigation
    navIconBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      showIconBuilderScreen();
    });
    navImageBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      showImageBuilderScreen();
    });
    navVideoBuilder.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Video Builder is coming soon!');
    });
    backToHomeBtn.addEventListener('click', showHomeScreen);
    imageBuilderBackBtn.addEventListener('click', showHomeScreen);

    const runFromHome = () => {
      showImageBuilderScreen(homePromptInput.value.trim() || null);
    }

    homeRunBtn.addEventListener('click', runFromHome);
    homePromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runFromHome();
      }
    });


    generateImageBtn.addEventListener('click', generateImage);


    iconGrid.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const iconItem = target.closest('.icon-item');
      if (iconItem) {
        handleIconSelection((iconItem as HTMLElement).dataset.iconName!);
      }
    });

    iconGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.classList.contains('icon-item')) {
          e.preventDefault();
          handleIconSelection(target.dataset.iconName!);
        }
      }
    });

    inspectorCloseBtn.addEventListener('click', () => {
      document.body.classList.remove('right-panel-active');
      selectedIconName = null;
      const prevSelected = iconGrid.querySelector('.icon-item.selected');
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
    });

    inspectorTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        inspectorTabs.forEach((t) =>
          t.classList.toggle('active', t === tab),
        );
        tabContents.forEach((content) => {
          (content as HTMLElement).classList.toggle(
            'hidden',
            (content as HTMLElement).dataset.tabContent !== tabName,
          );
        });
      });
    });

    // Style Controls
    fillToggle.addEventListener('change', (e) => {
      currentStyle.fill = (e.target as HTMLInputElement).checked ? 1 : 0;
      updateAllIconStyles();
    });
    weightSlider.addEventListener('input', (e) => {
      currentStyle.weight = parseInt((e.target as HTMLInputElement).value);
      updateAllIconStyles();
    });
    gradeSlider.addEventListener('input', (e) => {
      currentStyle.grade = parseInt((e.target as HTMLInputElement).value);
      updateAllIconStyles();
    });
    opticalSizeSlider.addEventListener('input', (e) => {
      currentStyle.opticalSize = parseInt((e.target as HTMLInputElement).value);
      updateAllIconStyles();
    });
    document
      .querySelectorAll<HTMLInputElement>('input[name="icon-family"]')
      .forEach((radio) => {
        radio.addEventListener('change', (e) => {
          currentStyle.family = (e.target as HTMLInputElement).value as
            | 'Outlined'
            | 'Rounded'
            | 'Sharp';
          updateAllIconStyles();
        });
      });

    searchInput.addEventListener('input', (e) => {
      filterAndRenderIcons((e.target as HTMLInputElement).value);
    });

    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        themeToggleBtns.forEach(b => {
          (b.querySelector('.material-symbols-outlined') as HTMLElement).textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
        });
      });
      // Set initial state for each button icon
      const currentTheme = document.body.dataset.theme;
      (btn.querySelector('.material-symbols-outlined') as HTMLElement).textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
    });


    regenerateBtn.addEventListener('click', generate3dIcon);
    convertToVideoBtn.addEventListener('click', generateVideoFromImage);

    downloadBtn.addEventListener('click', () => {
      if (!currentBase64Image || !selectedIconName) return;
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${currentBase64Image}`;
      link.download = `${selectedIconName}_3d.png`;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link);
    });

    // 3D Preview Tabs
    imageTabBtn.addEventListener('click', () => switchPreviewTab('image'));
    videoTabBtn.addEventListener('click', () => switchPreviewTab('video'));

    // Copy buttons
    copyHtmlBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget as HTMLButtonElement,
        snippetHtmlCode.textContent!,
      ),
    );
    copyCssBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget as HTMLButtonElement,
        snippetCssCode.textContent!,
      ),
    );
    copy3dBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget as HTMLButtonElement,
        snippet3dCode.dataset.fullCode || snippet3dCode.textContent!,
      ),
    );
    copyAnimKeyframesBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget as HTMLButtonElement,
        snippetAnimKeyframesCode.textContent!,
      ),
    );
    copyAnimClassBtn.addEventListener('click', (e) =>
      handleCopyClick(
        e.currentTarget as HTMLButtonElement,
        snippetAnimClassCode.textContent!,
      ),
    );

    // Animation controls in Code tab
    previewAnimationType.addEventListener('change', () => {
      updateAnimationCodeSnippets();
      updateAnimationPreview();
    });
    previewAnimationRepeat.addEventListener('change', updateAnimationCodeSnippets);

    playAnimationBtn.addEventListener('click', () => {
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

    play3dAnimationBtn.addEventListener('click', generateVideoFromImage);

    animationTypeSelect.addEventListener('change', () => {
      animationSpeedSelect.disabled = animationTypeSelect.value === 'none';
    });
  }

  // --- RUN ---
  init();

}