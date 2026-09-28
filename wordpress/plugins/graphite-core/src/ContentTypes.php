<?php
namespace Graphite\Core;

final class ContentTypes {
    public static function register(): void {
        foreach (['project' => 'projects', 'education' => 'education'] as $type => $slug) {
            register_post_type($type, [
                'label' => ucfirst($type), 'public' => true, 'show_in_rest' => true,
                'has_archive' => $slug, 'rewrite' => ['slug' => $slug],
                'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields', 'autosave'],
            ]);
            register_taxonomy($type . '_category', [$type], [
                'label' => ucfirst($type) . ' categories', 'public' => true, 'hierarchical' => true,
                'show_in_rest' => true, 'rewrite' => ['slug' => $type . '-category'],
            ]);
        }
    }

    public static function activate(): void {
        self::register();
        flush_rewrite_rules();
    }
}
