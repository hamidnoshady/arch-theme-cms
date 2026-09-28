<?php
defined('ABSPATH') || exit;
add_action('wp_enqueue_scripts', static function (): void {
    wp_enqueue_style('graphite-foundation', get_theme_file_uri('assets/graphite.css'), [], '0.1.0');
});
