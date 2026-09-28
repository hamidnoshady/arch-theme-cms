<?php
/**
 * Plugin Name: Graphite Core
 * Description: Graphite content models and WordPress integrations.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.3
 * Text Domain: graphite-core
 */

defined('ABSPATH') || exit;

foreach (['ContentTypes', 'ProjectMeta', 'Settings', 'Blocks', 'Plugin'] as $class) {
    require_once __DIR__ . '/src/' . $class . '.php';
}

register_activation_hook(__FILE__, ['Graphite\\Core\\ContentTypes', 'activate']);
add_action('plugins_loaded', ['Graphite\\Core\\Plugin', 'boot']);
