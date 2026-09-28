<?php
namespace Graphite\Core;

final class Blocks {
    public static function register(): void {
        register_block_type(dirname(__DIR__) . '/blocks/home-stage', ['render_callback' => [self::class, 'home']]);
        register_block_type(dirname(__DIR__) . '/blocks/project-grid', ['render_callback' => [self::class, 'grid']]);
        register_block_type(dirname(__DIR__) . '/blocks/project-facts', ['render_callback' => [self::class, 'facts']]);
        register_block_type(dirname(__DIR__) . '/blocks/language-switch', ['render_callback' => [self::class, 'language']]);
    }
    public static function home(): string {
        $settings = wp_parse_args(get_option('graphite_settings', []), Settings::defaults());
        $name = get_bloginfo('name');
        $description = get_bloginfo('description');
        $duration = absint($settings['intro_duration']);
        $animated = !empty($settings['intro_animation']) ? ' graphite-home--animated' : '';
        return sprintf(
            '<section class="graphite-home%s" style="--graphite-intro-duration:%dms"><div class="graphite-home__mark" aria-hidden="true"><span></span><span></span><span></span></div><p class="graphite-home__eyebrow">%s</p><h1>%s</h1><p class="graphite-home__description">%s</p><a class="graphite-home__cue" href="#content">%s</a></section>',
            esc_attr($animated), $duration, esc_html__('Architecture office', 'graphite-core'), esc_html($name), esc_html($description), esc_html__('Explore', 'graphite-core')
        );
    }
    public static function grid(array $attributes = []): string {
        $settings = wp_parse_args(get_option('graphite_settings', []), Settings::defaults());
        $count = min(100, max(1, absint($attributes['perPage'] ?? $settings['projects_per_page'])));
        $posts = get_posts(['post_type' => 'project', 'post_status' => 'publish', 'numberposts' => $count, 'orderby' => $settings['project_order']]);
        if (!$posts) return '<p class="graphite-empty">' . esc_html__('No projects yet.', 'graphite-core') . '</p>';
        $items = array_map(static fn ($post): string => sprintf('<li><a href="%s">%s</a></li>', esc_url(get_permalink($post)), esc_html(get_the_title($post))), $posts);
        return '<ul class="graphite-project-grid">' . implode('', $items) . '</ul>';
    }
    public static function facts(): string {
        $facts = get_post_meta(get_the_ID(), 'graphite_facts', true);
        if (!is_array($facts) || !$facts) return '';
        $items = array_map(static fn ($fact): string => sprintf('<div><dt>%s</dt><dd>%s</dd></div>', esc_html($fact['label'] ?? ''), esc_html($fact['value'] ?? '')), $facts);
        return '<dl class="graphite-project-facts">' . implode('', $items) . '</dl>';
    }
    public static function language(): string { return ''; }
}
