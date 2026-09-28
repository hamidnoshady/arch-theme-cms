param([ValidateSet('all', 'activation', 'content', 'settings', 'theme', 'blocks', 'migration', 'docs')][string]$Group = 'all')

$root = Split-Path -Parent $PSScriptRoot
$required = @(
  'docker-compose.yml',
  'plugins/graphite-core/graphite-core.php',
  'plugins/graphite-core/src/Plugin.php',
  'theme/graphite/style.css',
  'theme/graphite/functions.php'
)

foreach ($file in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $root $file))) { throw "Missing $file" }
}

if ($Group -in @('all', 'content')) {
  $content = Get-Content -Raw (Join-Path $root 'plugins/graphite-core/src/ContentTypes.php')
  foreach ($name in 'project', 'education') {
    if ($content -notmatch "'$name'") { throw "Missing content model $name" }
  }
  if ($content -notmatch "\$type \. '_category'") { throw 'Missing hierarchical category registration pattern' }
  $meta = Get-Content -Raw (Join-Path $root 'plugins/graphite-core/src/ProjectMeta.php')
  if (-not $meta.Contains("current_user_can('edit_post', `$objectId)")) { throw 'Project metadata must authorize the specific post' }
}

if ($Group -in @('all', 'settings')) {
  $settings = Get-Content -Raw (Join-Path $root 'plugins/graphite-core/src/Settings.php')
  if ($settings -notmatch 'manage_options') { throw 'Settings must require manage_options' }
}

if ($Group -in @('all', 'theme')) {
  $theme = Get-Content -Raw (Join-Path $root 'theme/graphite/theme.json')
  $css = Get-Content -Raw (Join-Path $root 'theme/graphite/assets/graphite.css')
  if ($theme -notmatch 'Vazirmatn' -or $css -notmatch 'prefers-reduced-motion') { throw 'Theme lacks RTL or reduced-motion foundations' }
}

if ($Group -in @('all', 'blocks')) {
  foreach ($block in 'home-stage', 'project-grid', 'project-facts', 'language-switch') {
    if (-not (Test-Path -LiteralPath (Join-Path $root "plugins/graphite-core/blocks/$block/block.json"))) { throw "Missing block $block" }
  }
  $frontPage = Get-Content -Raw (Join-Path $root 'theme/graphite/templates/front-page.html')
  if ($frontPage -notmatch 'graphite/home-stage') { throw 'Fresh installs must render the Graphite home stage' }
}

if ($Group -in @('all', 'migration')) {
  $migrationPath = Join-Path $root 'plugins/graphite-core/src/Migration/Importer.php'
  if (-not (Test-Path -LiteralPath $migrationPath)) { throw 'Missing migration importer' }
  $migration = Get-Content -Raw $migrationPath
  foreach ($token in '_eshobe_source_id', '--dry-run', 'wp_remote_get', 'WP_CLI') {
    if (-not $migration.Contains($token)) { throw "Migration importer must support $token" }
  }
}

Write-Output "WordPress $Group smoke checks passed"
