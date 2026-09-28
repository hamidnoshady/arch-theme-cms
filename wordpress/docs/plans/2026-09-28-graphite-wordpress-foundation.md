# Graphite WordPress Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an independently installable Graphite WordPress block theme and Graphite Core plugin without modifying the existing Next.js/eShobe application.

**Architecture:** The plugin owns persistent data, permissions, REST metadata, settings, and dynamic block rendering. The block theme owns tokens, templates, parts, and patterns. Docker Compose is contained under `wordpress/`, so the current root Dockerfile and application stay untouched.

**Tech Stack:** WordPress 6.x, PHP 8.3, MariaDB, Docker Compose, native Gutenberg APIs, browser JavaScript using WordPress-provided `wp.*` globals.

**Spec:** `wordpress/docs/foundation-design.md`

## Global Constraints

- Create and modify only `wordpress/**` during this phase.
- Do not alter the existing Next.js/eShobe source, manifest, Dockerfile, APIs, routes, CI, fonts, or navigation.
- Use native WordPress APIs before adding dependencies; do not add a visitor React bundle.
- Keep eShobe read-only; this phase contains no source-side integration or synchronization.
- Enforce capability checks and sanitization for every saved setting and REST-exposed metadata field.
- Support Persian RTL and English LTR; honour `prefers-reduced-motion` in user-facing block CSS.

## Review Focus

- A Contributor must not be able to update Graphite settings or another author's protected project metadata.
- REST updates with an invalid relationship ID, an array in a scalar field, or a malformed facts value must be rejected or sanitized without data loss.
- Activating the theme before the plugin must render a usable page and must not fatal.
- Activating the plugin with no Graphite pages must not create duplicate pages on repeated activation.
- Persian labels and block layout must remain readable under RTL and at 200% browser zoom.

---

## File Structure

- `wordpress/docker-compose.yml`: isolated WordPress and MariaDB development services.
- `wordpress/plugins/graphite-core/graphite-core.php`: plugin entry point and activation hook.
- `wordpress/plugins/graphite-core/src/Plugin.php`: one registration coordinator.
- `wordpress/plugins/graphite-core/src/ContentTypes.php`: CPTs, taxonomies, rewrite rules, and seeded landing pages.
- `wordpress/plugins/graphite-core/src/ProjectMeta.php`: metadata schemas, authorization, sanitization, and editor registration.
- `wordpress/plugins/graphite-core/src/Settings.php`: Graphite-only settings page and validation.
- `wordpress/plugins/graphite-core/src/Blocks.php`: dynamic grid/facts block registration and render callbacks.
- `wordpress/plugins/graphite-core/blocks/*/block.json`: native block contracts and editor scripts.
- `wordpress/theme/graphite/theme.json`: Graphite tokens, typography, palette, layout, and block defaults.
- `wordpress/theme/graphite/functions.php`: theme setup and asset registration only.
- `wordpress/theme/graphite/templates/*.html`, `parts/*.html`, `patterns/*.php`: block-theme presentation.
- `wordpress/tests/smoke.sh`: repeatable container-based activation, REST, permission, and RTL smoke checks.
- `wordpress/docs/{architecture,content-model,theme-development,graphite-core,testing}.md`: operator documentation for this phase.

### Task 1: Isolated WordPress runtime and installable shells

**Files:**
- Create: `wordpress/docker-compose.yml`
- Create: `wordpress/.env.example`
- Create: `wordpress/plugins/graphite-core/graphite-core.php`
- Create: `wordpress/plugins/graphite-core/src/Plugin.php`
- Create: `wordpress/theme/graphite/style.css`
- Create: `wordpress/theme/graphite/functions.php`
- Create: `wordpress/README.md`
- Test: `wordpress/tests/smoke.sh`

**Interfaces:**
- Produces `Graphite\\Core\\Plugin::boot(): void`, called on `plugins_loaded`.
- Produces compose services `wordpress` and `db`; later tasks use `docker compose -f wordpress/docker-compose.yml exec -T wordpress`.

- [ ] **Step 1: Write failing activation assertions**

```sh
wp plugin activate graphite-core
wp theme activate graphite
test "$(wp plugin status graphite-core --field=status)" = active
test "$(wp theme status graphite --field=status)" = active
```

- [ ] **Step 2: Run the smoke script to verify it fails**

Run: `bash wordpress/tests/smoke.sh activation`

Expected: FAIL because the compose file, plugin, and theme do not exist.

- [ ] **Step 3: Create the smallest installable runtime and shells**

```php
// wordpress/plugins/graphite-core/graphite-core.php
<?php
/**
 * Plugin Name: Graphite Core
 * Text Domain: graphite-core
 */
defined('ABSPATH') || exit;
require __DIR__ . '/src/Plugin.php';
add_action('plugins_loaded', [Graphite\Core\Plugin::class, 'boot']);
```

```css
/* wordpress/theme/graphite/style.css */
/*
Theme Name: Graphite
Text Domain: graphite
Requires at least: 6.6
Requires PHP: 8.3
*/
```

- [ ] **Step 4: Run activation smoke checks**

Run: `bash wordpress/tests/smoke.sh activation`

Expected: PASS with both Graphite components active.

- [ ] **Step 5: Commit**

```bash
git add wordpress
git commit -m "feat(wordpress): add isolated Graphite runtime"
```

### Task 2: Content types, taxonomy, and safe project metadata

**Files:**
- Create: `wordpress/plugins/graphite-core/src/ContentTypes.php`
- Create: `wordpress/plugins/graphite-core/src/ProjectMeta.php`
- Modify: `wordpress/plugins/graphite-core/src/Plugin.php`
- Test: `wordpress/tests/smoke.sh`

**Interfaces:**
- Consumes `Plugin::boot()`.
- Produces `ContentTypes::register(): void` and `ProjectMeta::register(): void`.
- Produces REST keys `graphite_location`, `graphite_year`, `graphite_area`, `graphite_collaborators`, `graphite_client`, `graphite_status`, `graphite_facts`, and `graphite_related_projects` on `project`.

- [ ] **Step 1: Add failing REST and registration assertions**

```sh
test "$(wp post-type get project --field=name)" = project
test "$(wp taxonomy get project_category --field=hierarchical)" = 1
wp post meta update "$project_id" graphite_year 2025
test "$(wp post meta get "$project_id" graphite_year)" = 2025
```

- [ ] **Step 2: Run the content smoke group to verify it fails**

Run: `bash wordpress/tests/smoke.sh content`

Expected: FAIL because the post types and metadata are unregistered.

- [ ] **Step 3: Register the two content models and metadata using WordPress APIs**

```php
register_post_type('project', [
  'public' => true, 'show_in_rest' => true,
  'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields', 'autosave'],
  'rewrite' => ['slug' => 'projects'],
]);
register_taxonomy('project_category', ['project'], [
  'hierarchical' => true, 'show_in_rest' => true, 'rewrite' => ['slug' => 'project-category'],
]);
register_post_meta('project', 'graphite_year', [
  'single' => true, 'type' => 'string', 'show_in_rest' => true,
  'sanitize_callback' => 'sanitize_text_field',
  'auth_callback' => static fn () => current_user_can('edit_posts'),
]);
```

Implement the same explicit schema pattern for every required field. Store `graphite_facts` and `graphite_related_projects` as JSON-encoded strings with strict array validation; reject related IDs that are not `project` posts.

- [ ] **Step 4: Run the content and invalid-input smoke groups**

Run: `bash wordpress/tests/smoke.sh content && bash wordpress/tests/smoke.sh invalid-meta`

Expected: PASS; malformed scalar, facts, and relationship inputs are rejected or sanitized.

- [ ] **Step 5: Commit**

```bash
git add wordpress/plugins/graphite-core wordpress/tests/smoke.sh
git commit -m "feat(wordpress): add Graphite content models"
```

### Task 3: Graphite settings and Gutenberg project sidebar

**Files:**
- Create: `wordpress/plugins/graphite-core/src/Settings.php`
- Create: `wordpress/plugins/graphite-core/assets/project-sidebar.js`
- Modify: `wordpress/plugins/graphite-core/src/Plugin.php`
- Modify: `wordpress/plugins/graphite-core/src/ProjectMeta.php`
- Test: `wordpress/tests/smoke.sh`

**Interfaces:**
- Consumes registered project metadata from Task 2.
- Produces option `graphite_settings` with keys `intro_animation`, `intro_duration`, `show_section_numbers`, `map_style`, `project_order`, and `projects_per_page`.
- Produces `graphite-core-project-sidebar` editor asset that reads/writes registered project meta.

- [ ] **Step 1: Add failing settings authorization assertions**

```sh
wp option get graphite_settings --format=json
wp eval 'wp_set_current_user(0); var_export(current_user_can("manage_options"));' | grep -qx false
```

- [ ] **Step 2: Run the settings smoke group to verify it fails**

Run: `bash wordpress/tests/smoke.sh settings`

Expected: FAIL because Graphite settings are absent.

- [ ] **Step 3: Register one settings option and the sidebar asset**

```php
register_setting('graphite_settings', 'graphite_settings', [
  'type' => 'array',
  'sanitize_callback' => [Settings::class, 'sanitize'],
  'default' => ['intro_animation' => true, 'intro_duration' => 7000, 'show_section_numbers' => true, 'map_style' => 'minimal', 'project_order' => 'date', 'projects_per_page' => 12],
]);
add_options_page('Graphite Settings', 'Graphite Settings', 'manage_options', 'graphite-settings', [Settings::class, 'render']);
```

The sanitizer clamps duration to `0..20000`, page size to `1..100`, and allows only `minimal|osm` and `date|title|menu_order`.

- [ ] **Step 4: Run settings and editor asset smoke checks**

Run: `bash wordpress/tests/smoke.sh settings && bash wordpress/tests/smoke.sh editor-assets`

Expected: PASS; settings require `manage_options`, and the sidebar asset is registered only for the project editor.

- [ ] **Step 5: Commit**

```bash
git add wordpress/plugins/graphite-core wordpress/tests/smoke.sh
git commit -m "feat(wordpress): add Graphite editor settings"
```

### Task 4: Block theme, native navigation, and accessible foundations

**Files:**
- Create: `wordpress/theme/graphite/theme.json`
- Create: `wordpress/theme/graphite/templates/index.html`
- Create: `wordpress/theme/graphite/templates/single-project.html`
- Create: `wordpress/theme/graphite/templates/single-education.html`
- Create: `wordpress/theme/graphite/parts/header.html`
- Create: `wordpress/theme/graphite/parts/footer.html`
- Create: `wordpress/theme/graphite/patterns/projects-intro.php`
- Create: `wordpress/theme/graphite/assets/graphite.css`
- Modify: `wordpress/theme/graphite/functions.php`
- Test: `wordpress/tests/smoke.sh`

**Interfaces:**
- Consumes WordPress Navigation block output; no separate menu source is created.
- Produces theme style handles `graphite-foundation` and templates for both entry types.

- [ ] **Step 1: Add failing theme output checks**

```sh
wp theme activate graphite
wp eval 'echo wp_get_theme("graphite")->get("Name");' | grep -qx Graphite
curl -fsS http://localhost:8080/ | grep -q 'wp-block-navigation'
```

- [ ] **Step 2: Run theme smoke checks to verify they fail**

Run: `bash wordpress/tests/smoke.sh theme`

Expected: FAIL because the block theme has no templates or `theme.json`.

- [ ] **Step 3: Implement the smallest block theme**

```json
{
  "version": 3,
  "settings": {
    "appearanceTools": true,
    "color": { "palette": [{"slug":"ink","name":"Ink","color":"#171717"},{"slug":"paper","name":"Paper","color":"#f7f3ea"}] },
    "typography": { "fontFamilies": [{"slug":"ui","name":"UI","fontFamily":"system-ui, sans-serif"},{"slug":"brand","name":"Brand","fontFamily":"Vazirmatn, system-ui, sans-serif"}] }
  }
}
```

Use `wp:navigation` in `parts/header.html`; do not add a custom menu model. CSS must use logical properties (`margin-inline`, `padding-inline`) and include a reduced-motion rule.

- [ ] **Step 4: Run theme, RTL, and zoom smoke checks**

Run: `bash wordpress/tests/smoke.sh theme && bash wordpress/tests/smoke.sh rtl`

Expected: PASS; the theme activates with or without the plugin and includes RTL logical styles.

- [ ] **Step 5: Commit**

```bash
git add wordpress/theme/graphite wordpress/tests/smoke.sh
git commit -m "feat(wordpress): add Graphite block theme foundation"
```

### Task 5: Dynamic project and facts blocks

**Files:**
- Create: `wordpress/plugins/graphite-core/src/Blocks.php`
- Create: `wordpress/plugins/graphite-core/blocks/project-grid/block.json`
- Create: `wordpress/plugins/graphite-core/blocks/project-grid/render.php`
- Create: `wordpress/plugins/graphite-core/blocks/project-facts/block.json`
- Create: `wordpress/plugins/graphite-core/blocks/project-facts/render.php`
- Create: `wordpress/plugins/graphite-core/blocks/language-switch/block.json`
- Modify: `wordpress/plugins/graphite-core/src/Plugin.php`
- Test: `wordpress/tests/smoke.sh`

**Interfaces:**
- Consumes `graphite_settings` and the `project` model from Tasks 2–3.
- Produces server-rendered `graphite/project-grid` and `graphite/project-facts`; missing multilingual plugins leave `graphite/language-switch` inert rather than fatal.

- [ ] **Step 1: Add failing rendering assertions**

```sh
wp post create --post_type=project --post_title='Test project' --post_status=publish --porcelain > /tmp/project-id
wp eval 'echo do_blocks("<!-- wp:graphite/project-grid /-->");' | grep -q 'Test project'
```

- [ ] **Step 2: Run the blocks smoke group to verify it fails**

Run: `bash wordpress/tests/smoke.sh blocks`

Expected: FAIL because Graphite blocks are unregistered.

- [ ] **Step 3: Register dynamic blocks and render escaped HTML**

```php
register_block_type(__DIR__ . '/../blocks/project-grid', [
  'render_callback' => [Blocks::class, 'render_project_grid'],
]);
```

Query only published `project` posts, cap `perPage` at 100, and use `esc_url`, `esc_html`, and `wp_kses_post` at output boundaries. Facts output only non-empty labels and values from validated `graphite_facts`.

- [ ] **Step 4: Run blocks and security smoke checks**

Run: `bash wordpress/tests/smoke.sh blocks && bash wordpress/tests/smoke.sh permissions`

Expected: PASS; rendered content contains published projects only and escaped fields.

- [ ] **Step 5: Commit**

```bash
git add wordpress/plugins/graphite-core wordpress/tests/smoke.sh
git commit -m "feat(wordpress): add Graphite project blocks"
```

### Task 6: Documentation, release safety, and final verification

**Files:**
- Create: `wordpress/docs/architecture.md`
- Create: `wordpress/docs/content-model.md`
- Create: `wordpress/docs/graphite-core.md`
- Create: `wordpress/docs/theme-development.md`
- Create: `wordpress/docs/testing.md`
- Modify: `wordpress/README.md`
- Modify: `wordpress/tests/smoke.sh`

**Interfaces:**
- Documents the activation order, environment commands, plugin/theme ownership, and the explicit absence of eShobe writes.

- [ ] **Step 1: Add a failing repository-scope assertion**

```sh
git diff --name-only HEAD~1..HEAD | grep -v '^wordpress/' && exit 1 || exit 0
```

- [ ] **Step 2: Run the scope check to verify documentation is incomplete**

Run: `bash wordpress/tests/smoke.sh docs`

Expected: FAIL until all documented operator commands and ownership boundaries exist.

- [ ] **Step 3: Document exact commands and safety rules**

Document `docker compose -f wordpress/docker-compose.yml up -d`, plugin/theme activation, smoke groups, data ownership, CPT URLs, metadata schemas, and the rule that WordPress never modifies eShobe.

- [ ] **Step 4: Run all foundation checks and original baseline checks**

Run: `bash wordpress/tests/smoke.sh all && node node_modules/typescript/bin/tsc --noEmit && node node_modules/vitest/vitest.mjs run`

Expected: all WordPress smoke groups pass; original TypeScript passes; existing Vitest suite remains 59 passing tests.

- [ ] **Step 5: Verify diff scope and commit**

```bash
git diff --check HEAD~1
git diff --name-only HEAD~1 | grep -v '^wordpress/' && exit 1 || true
git add wordpress
git commit -m "docs(wordpress): document Graphite foundation"
```

## Self-Review

- Spec coverage: plugin/theme separation, CPTs, taxonomies, project metadata, settings, native navigation, RTL/LTR foundations, local environment, and phase verification map to Tasks 1–6. Full home stage, forms, multilingual adapters, migration, packages, CI, and E2E accessibility are deliberately deferred to later approved phases.
- Placeholder scan: no deferred implementation is represented as a task in this plan; deferred product scope is explicitly outside the phase boundary.
- Type consistency: all task registrations flow through `Plugin::boot()`, metadata uses the `project` object type, and dynamic render callbacks are owned by `Blocks`.
- Review focus coverage: Task 2 covers invalid metadata, Task 3 covers settings authorization, Task 4 covers plugin-absent theme/RTL, Task 5 covers published-only rendering, and Task 6 covers repository scope.
