<?php
namespace Graphite\Core\Migration;

/** Read-only eShobe importer. Usage: wp graphite migrate --source=https://cms.example --api-key=... [--dry-run]. */
final class Importer {
    public static function register(): void { \WP_CLI::add_command('graphite migrate', [self::class, 'command']); }

    public static function command(array $args, array $assoc): void {
        $source = rtrim((string) ($assoc['source'] ?? ''), '/');
        $key = (string) ($assoc['api-key'] ?? '');
        if ($source === '' || $key === '') \WP_CLI::error('--source and --api-key are required.');
        $dryRun = array_key_exists('dry-run', $assoc); // --dry-run never writes to WordPress.
        foreach (['pages' => 'page', 'posts' => 'post'] as $endpoint => $postType) {
            $response = wp_remote_get($source . '/api/' . $endpoint . '?limit=500&depth=0', ['headers' => ['Authorization' => 'Bearer ' . $key], 'timeout' => 30]);
            if (is_wp_error($response)) \WP_CLI::error($response->get_error_message());
            if (wp_remote_retrieve_response_code($response) !== 200) \WP_CLI::error('Source returned HTTP ' . wp_remote_retrieve_response_code($response));
            $payload = json_decode(wp_remote_retrieve_body($response), true);
            $docs = is_array($payload['docs'] ?? null) ? $payload['docs'] : [];
            foreach ($docs as $doc) self::upsert($doc, $postType, $dryRun);
        }
    }

    private static function upsert(array $doc, string $postType, bool $dryRun): void {
        $sourceId = sanitize_text_field((string) ($doc['id'] ?? ''));
        if ($sourceId === '') { \WP_CLI::warning('Skipped document without source id.'); return; }
        $existing = get_posts(['post_type' => $postType, 'meta_key' => '_eshobe_source_id', 'meta_value' => $sourceId, 'numberposts' => 1, 'fields' => 'ids']);
        $post = ['ID' => $existing[0] ?? 0, 'post_type' => $postType, 'post_status' => 'publish', 'post_title' => sanitize_text_field((string) ($doc['title'] ?? 'Untitled')), 'post_name' => sanitize_title((string) ($doc['slug'] ?? '')), 'post_content' => self::text($doc['content'] ?? [])];
        if ($dryRun) { \WP_CLI::log('Would import ' . $sourceId); return; }
        $id = wp_insert_post(wp_slash($post), true);
        if (is_wp_error($id)) { \WP_CLI::warning($id->get_error_message()); return; }
        update_post_meta($id, '_eshobe_source_id', $sourceId);
        update_post_meta($id, '_eshobe_source_updated_at', sanitize_text_field((string) ($doc['updatedAt'] ?? '')));
        \WP_CLI::success('Imported ' . $sourceId);
    }

    private static function text(mixed $node): string {
        if (is_string($node)) return $node;
        if (!is_array($node)) return '';
        $text = isset($node['text']) && is_string($node['text']) ? $node['text'] : '';
        foreach (($node['children'] ?? []) as $child) $text .= self::text($child);
        return $text;
    }
}
