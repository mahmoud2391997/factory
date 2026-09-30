'use client'

import { cloneElement, Fragment, isValidElement, type ReactNode } from 'react'

import { useLanguage } from './language-provider'
import { translateUiText } from './translations'

const TRANSLATABLE_PROPS = new Set([
  'alt',
  'aria-label',
  'description',
  'hint',
  'label',
  'openLabel',
  'placeholder',
  'title',
])

function localizeNode(node: ReactNode, language: ReturnType<typeof useLanguage>['language']): ReactNode {
  if (typeof node === 'string') return translateUiText(language, node)
  if (Array.isArray(node)) {
    return node.map((item, index) => (
      <Fragment key={isValidElement(item) && item.key != null ? String(item.key) : index}>
        {localizeNode(item, language)}
      </Fragment>
    ))
  }
  if (!isValidElement(node)) return node

  const props = node.props as Record<string, unknown>
  const translated: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      translated.children = localizeNode(value as ReactNode, language)
    } else if (TRANSLATABLE_PROPS.has(key) && typeof value === 'string') {
      translated[key] = translateUiText(language, value)
    } else if (key === 'columns' && Array.isArray(value)) {
      translated.columns = value.map((column) => typeof column === 'string' ? translateUiText(language, column) : column)
    }
  }
  return cloneElement(node, translated)
}

export function LocalizedContent({ children }: { children: ReactNode }) {
  const { language } = useLanguage()
  // Arabic is the source language: translateUiText is a no-op for it, so skip
  // the full tree clone/traversal entirely to avoid unnecessary render cost.
  if (language === 'ar') return <>{children}</>
  return localizeNode(children, language)
}
