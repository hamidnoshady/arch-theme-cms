<?php
namespace Graphite\Core;

final class Plugin {
    public static function boot(): void {
        add_action('init', [ContentTypes::class, 'register']);
        add_action('init', [ProjectMeta::class, 'register']);
        add_action('init', [Blocks::class, 'register']);
        add_action('admin_menu', [Settings::class, 'menu']);
        add_action('admin_init', [Settings::class, 'register']);
        add_action('enqueue_block_editor_assets', [ProjectMeta::class, 'editor_assets']);
        if (defined('WP_CLI') && WP_CLI) Migration\Importer::register();
    }
}
