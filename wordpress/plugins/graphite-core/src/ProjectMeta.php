<?php
namespace Graphite\Core;

final class ProjectMeta {
    private const FIELDS = [
        'graphite_location', 'graphite_year', 'graphite_area', 'graphite_collaborators', 'graphite_client', 'graphite_status',
    ];

    public static function register(): void {
        foreach (self::FIELDS as $key) {
            register_post_meta('project', $key, self::schema('string', [self::class, 'text']));
        }
        register_post_meta('project', 'graphite_facts', self::schema('array', [self::class, 'facts']));
        register_post_meta('project', 'graphite_related_projects', self::schema('array', [self::class, 'related']));
    }

    private static function schema(string $type, callable $sanitize): array {
        return [
            'single' => true, 'type' => $type, 'show_in_rest' => ['schema' => ['type' => $type]],
            'sanitize_callback' => $sanitize,
            'auth_callback' => static fn (bool $allowed, string $metaKey, int $objectId): bool => current_user_can('edit_post', $objectId),
            'revisions_enabled' => true,
        ];
    }

    public static function text(mixed $value): string { return is_scalar($value) ? sanitize_text_field((string) $value) : ''; }
    public static function facts(mixed $value): array {
        if (!is_array($value)) return [];
        return array_values(array_filter(array_map(static function ($fact): ?array {
            if (!is_array($fact)) return null;
            $label = sanitize_text_field((string) ($fact['label'] ?? ''));
            $value = sanitize_text_field((string) ($fact['value'] ?? ''));
            return $label !== '' && $value !== '' ? compact('label', 'value') : null;
        }, $value)));
    }
    public static function related(mixed $value): array {
        if (!is_array($value)) return [];
        return array_values(array_filter(array_unique(array_map('absint', $value)), static fn (int $id): bool => $id > 0 && get_post_type($id) === 'project'));
    }
    public static function editor_assets(): void {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== 'project') return;
        wp_enqueue_script('graphite-core-project-sidebar', plugins_url('../assets/project-sidebar.js', __FILE__), ['wp-components', 'wp-data', 'wp-element', 'wp-plugins', 'wp-edit-post'], '0.1.0', true);
    }
}
