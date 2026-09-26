import logoSvg from '@/assets/graphite-logo';

export function GraphiteLogoMark({ animated = false }: { animated?: boolean }) {
  const html = logoSvg.replace(
    '<svg ',
    `<svg class="${animated ? 'logo--animated' : ''}" `,
  );
  return <div className="logo-svg" dangerouslySetInnerHTML={{ __html: html }} />;
}
