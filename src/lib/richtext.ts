import type { LexicalNode, RichTextData } from './types'

export function nodeText(node: LexicalNode | null | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'linebreak') return '\n'
  return (node.children ?? []).map(nodeText).join('')
}

export function richTextToPlain(data: RichTextData | null | undefined): string {
  return (data?.root?.children ?? []).map(nodeText).join('\n').trim()
}
