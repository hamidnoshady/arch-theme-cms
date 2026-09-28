<?php
namespace Graphite\Core;

final class Settings {
    public static function defaults(): array { return ['intro_animation' => true, 'intro_duration' => 7000, 'show_section_numbers' => true, 'map_style' => 'minimal', 'project_order' => 'date', 'projects_per_page' => 12]; }
    public static function register(): void { register_setting('graphite_settings', 'graphite_settings', ['type' => 'array', 'sanitize_callback' => [self::class, 'sanitize'], 'default' => self::defaults()]); }
    public static function sanitize(mixed $input): array {
        $input = is_array($input) ? $input : []; $out = self::defaults();
        $out['intro_animation'] = !empty($input['intro_animation']); $out['show_section_numbers'] = !empty($input['show_section_numbers']);
        $out['intro_duration'] = min(20000, max(0, absint($input['intro_duration'] ?? $out['intro_duration'])));
        $out['projects_per_page'] = min(100, max(1, absint($input['projects_per_page'] ?? $out['projects_per_page'])));
        $out['map_style'] = in_array($input['map_style'] ?? '', ['minimal', 'osm'], true) ? $input['map_style'] : $out['map_style'];
        $out['project_order'] = in_array($input['project_order'] ?? '', ['date', 'title', 'menu_order'], true) ? $input['project_order'] : $out['project_order'];
        return $out;
    }
    public static function menu(): void { add_theme_page('Graphite Settings', 'Graphite Settings', 'manage_options', 'graphite-settings', [self::class, 'render']); }
    public static function render(): void { if (!current_user_can('manage_options')) return; $s = wp_parse_args(get_option('graphite_settings', []), self::defaults()); ?>
        <div class="wrap"><h1>Graphite Settings</h1><form method="post" action="options.php"><?php settings_fields('graphite_settings'); ?>
        <p><label>Intro duration <input type="number" min="0" max="20000" name="graphite_settings[intro_duration]" value="<?php echo esc_attr($s['intro_duration']); ?>"></label></p>
        <p><label><input type="checkbox" name="graphite_settings[intro_animation]" value="1" <?php checked($s['intro_animation']); ?>> Intro animation</label></p>
        <p><label><input type="checkbox" name="graphite_settings[show_section_numbers]" value="1" <?php checked($s['show_section_numbers']); ?>> Show section numbers</label></p>
        <?php submit_button(); ?></form></div><?php }
}
