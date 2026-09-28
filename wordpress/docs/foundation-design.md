# Graphite WordPress foundation design

## Scope

Build a native WordPress implementation beside the existing Next.js/eShobe theme. All new production code lives below `wordpress/`; the existing application is read-only.

This first phase establishes an independently installable block theme and `graphite-core` plugin. It deliberately does not migrate live eShobe content or replace any Next.js route, API, deployment, or navigation.

## Boundaries

`graphite-core` owns durable WordPress data and editing behaviour: the `project` and `education` CPTs, their taxonomies, registered post meta, REST schemas, permissions, Gutenberg editor controls, Graphite settings, and future migration entry points.

The `graphite` theme owns presentation only: `theme.json`, templates, template parts, patterns, front-end assets, and WordPress blocks. The theme never creates content types or stores business data.

The existing eShobe site remains a read-only external source for a later import-only migration. WordPress never writes to it.

## Data model

- `project`: title, editor, excerpt, thumbnail, revisions, custom fields, autosave, REST; permalink `/projects/{slug}`.
- `project_category`: hierarchical, REST-enabled taxonomy.
- `education`: title, editor, excerpt, thumbnail, revisions, author, date, REST; permalink `/education/{slug}`.
- `education_category`: hierarchical, REST-enabled taxonomy.
- Registered project metadata: `graphite_location`, `graphite_year`, `graphite_area`, `graphite_collaborators`, `graphite_client`, `graphite_status`, `graphite_facts`, and `graphite_related_projects`.

All metadata is sanitized, has explicit REST schemas, and uses capability checks. Relationship values are stored as validated project IDs.

## Theme and editor

The theme carries Graphite tokens in `theme.json`, preserving separate UI and brand font concepts, Persian-default RTL, English LTR, and existing responsive/reduced-motion intent. Native blocks and patterns cover ordinary content; custom blocks are limited to Graphite-specific behaviour:

- `graphite/home-stage`
- `graphite/project-grid`
- `graphite/project-facts`
- `graphite/language-switch`
- `graphite/education-grid` only if sharing a grid would otherwise obscure the editor contract.

The initial theme supplies editable `/projects` and `/education` Pages with dynamic grids. One WordPress Navigation source feeds header, mobile navigation, and the home stage.

## Settings and local environment

`Appearance > Graphite Settings` contains only Graphite-specific settings: intro animation/duration, section numbers, map style, project ordering, and project page size. Global colour, type, and spacing remain in `theme.json`.

The WordPress development environment stays inside `wordpress/` and is isolated from the root Next.js Docker build. Prefer `@wordpress/env` unless audit proves its required services cannot support the test suite.

## Verification and phase exit

Foundation must provide plugin/theme activation checks; unit coverage for CPTs, taxonomy, metadata, REST, permission and sanitization; and RTL/LTR smoke coverage. The root app remains unmodified, with Git diff confirming only `wordpress/**` additions.

Later phases add the complete visitor experience, forms, multilingual adapters, read-only idempotent eShobe migration, release packages, CI, and E2E/accessibility validation.
