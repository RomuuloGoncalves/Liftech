import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')

const block = (file: string, selector: string) => {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  return blocks
    .filter(([, selectors]) =>
      selectors
        .split(',')
        .some((s) => s.trim() === selector || selectors.replace(/\s+/g, ' ').trim() === selector.replace(/\s+/g, ' ').trim()),
    )
    .map(([, , body]) => body.replace(/\s+/g, ' ').trim())
    .join(' ')
}

describe('pages/DashboardPage.module.css (T18)', () => {
  const file = 'pages/DashboardPage.module.css'

  it('.title inherits h1 styles and does not define font-weight 700 or black color', () => {
    const b = block(file, '.title')
    expect(b).toContain('font-size: var(--fs-2xl);')
    expect(b).not.toContain('font-weight: 700')
    expect(b).not.toContain('--black-title')
  })

  it('.sectionTitle uses panel-title role with var(--text-h)', () => {
    const b = block(file, '.sectionTitle')
    expect(b).toContain('font-size: var(--fs-lg);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('color: var(--text-h);')
  })

  it('.cardNumber uses tabular numbers while keeping 700 data-display', () => {
    const b = block(file, '.cardNumber')
    expect(b).toContain('font-variant-numeric: tabular-nums;')
    expect(b).toContain('font-weight: 700;')
  })

  it('.errorMessage uses accessible error token var(--danger-text)', () => {
    const b = block(file, '.errorMessage')
    expect(b).toContain('color: var(--danger-text);')
    expect(b).not.toContain('var(--danger-solid)')
  })

  it('.retryButton uses button role with motion token and 600 weight', () => {
    const b = block(file, '.retryButton')
    expect(b).toContain('font-size: var(--fs-sm);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('transition: background-color var(--dur-fast) var(--ease-out);')
  })
})

describe('components/dashboard/MachineTable.module.css (T19)', () => {
  const file = 'components/dashboard/MachineTable.module.css'

  it('.createButton uses button-lg role with motion token', () => {
    const b = block(file, '.createButton')
    expect(b).toContain('font-size: var(--fs-md);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('height: 38px;')
    expect(b).toContain('transition: opacity var(--dur-fast) var(--ease-out);')
  })

  it('.searchInput uses fast ease-out motion and var(--text)', () => {
    const b = block(file, '.searchInput')
    expect(b).toContain('transition: border-color var(--dur-fast) var(--ease-out);')
    expect(b).toContain('color: var(--text);')
  })

  it('.td, .pageInfo and .pageNumber use tabular-nums', () => {
    expect(block(file, '.td')).toContain('font-variant-numeric: tabular-nums;')
    expect(block(file, '.td')).toContain('color: var(--text);')
    expect(block(file, '.pageInfo')).toContain('font-variant-numeric: tabular-nums;')
    expect(block(file, '.pageNumber')).toContain('font-variant-numeric: tabular-nums;')
    expect(block(file, '.pageNumber')).toContain('color: var(--text-h);')
  })

  it('buttons have fast ease-out transitions and no 0.15s remains', () => {
    expect(block(file, '.pageButton')).toContain(
      'transition: opacity var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);',
    )
    expect(block(file, '.nameButton')).toContain('transition: opacity var(--dur-fast) var(--ease-out);')
    expect(read(file)).not.toContain('0.15s')
    expect(read(file)).not.toContain('--black-title')
    expect(read(file)).not.toContain('--black-text')
  })
})

describe('components/dashboard/UsageHeatmap.module.css (T20)', () => {
  const file = 'components/dashboard/UsageHeatmap.module.css'

  it('.cell has no dead opacity transition', () => {
    const b = block(file, '.cell')
    expect(b).not.toContain('transition')
    expect(b).toContain('border-radius: var(--radius-sm);')
  })

  it('.hourHeader uses tabular numbers', () => {
    const b = block(file, '.hourHeader')
    expect(b).toContain('font-variant-numeric: tabular-nums;')
    expect(b).toContain('color: var(--text);')
  })

  it('drops all --black-title and --black-text tokens', () => {
    expect(read(file)).not.toContain('--black-title')
    expect(read(file)).not.toContain('--black-text')
  })
})

describe('pages/SolicitacoesPage.module.css (T21)', () => {
  const file = 'pages/SolicitacoesPage.module.css'

  it('.title inherits h1 font-weight and color', () => {
    const b = block(file, '.title')
    expect(b).toContain('font-size: var(--fs-2xl);')
    expect(b).not.toContain('font-weight')
    expect(b).not.toContain('color')
  })

  it('.emptyState uses page empty role with var(--fs-base)', () => {
    const b = block(file, '.emptyState')
    expect(b).toContain('font-size: var(--fs-base);')
  })

  it('.tab uses fast ease-out motion with transform', () => {
    const b = block(file, '.tab')
    expect(b).toContain('transition: color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);')
  })

  it('.errorState uses var(--danger-text)', () => {
    const b = block(file, '.errorState')
    expect(b).toContain('color: var(--danger-text);')
    expect(b).not.toContain('var(--danger-solid)')
  })

  it('.retryButton uses canonical var(--ease-out) without fallback', () => {
    const b = block(file, '.retryButton')
    expect(b).toContain('var(--dur-fast) var(--ease-out)')
    expect(read(file)).not.toContain('cubic-bezier')
  })
})

describe('pages/EquipePage.module.css (T22)', () => {
  const file = 'pages/EquipePage.module.css'

  it('.sectionTitle uses panel-title role with var(--text-h) and no letter-spacing: 0', () => {
    const b = block(file, '.sectionTitle')
    expect(b).toContain('font-size: var(--fs-lg);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('color: var(--text-h);')
    expect(b).not.toContain('letter-spacing: 0')
  })

  it('.section shell uses line token and var(--radius-lg)', () => {
    const b = block(file, '.section')
    expect(b).toContain('border: 1px solid var(--line);')
    expect(b).toContain('border-radius: var(--radius-lg);')
    expect(b).not.toContain('0.5px')
    expect(b).not.toContain('10px')
  })

  it('.emptyState uses 48px vertical padding', () => {
    const b = block(file, '.emptyState')
    expect(b).toContain('padding: 48px 0;')
  })

  it('.registerButton has fast ease-out transitions and hover/active states', () => {
    const b = block(file, '.registerButton')
    expect(b).toContain('transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);')
    expect(block(file, '.registerButton:hover')).toContain('opacity: 0.92;')
    expect(block(file, '.registerButton:active')).toContain('transform: scale(0.97);')
  })
})

describe('components/team/EmployeeCard.module.css (T23)', () => {
  const file = 'components/team/EmployeeCard.module.css'

  it('.denied uses var(--danger-text)', () => {
    const b = block(file, '.denied')
    expect(b).toContain('color: var(--danger-text);')
    expect(b).not.toContain('var(--red)')
  })

  it('.knob uses fast ease-out motion token without literal 150ms', () => {
    const b = block(file, '.knob')
    expect(b).toContain('transition: transform var(--dur-fast) var(--ease-out);')
    expect(read(file)).not.toContain('150ms')
  })
})

describe('components/team/TeamForm.module.css (T24)', () => {
  const file = 'components/team/TeamForm.module.css'

  it('.error uses error role with var(--fs-sm), 500 weight and var(--danger-text)', () => {
    const b = block(file, '.error')
    expect(b).toContain('font-size: var(--fs-sm);')
    expect(b).toContain('font-weight: 500;')
    expect(b).toContain('color: var(--danger-text);')
  })

  it('drops .input::placeholder so global ::placeholder rule takes effect', () => {
    expect(read(file)).not.toContain('::placeholder')
  })

  it('.leftIcon and .rightButton use var(--text)', () => {
    expect(block(file, '.leftIcon')).toContain('color: var(--text);')
    expect(block(file, '.rightButton')).toContain('color: var(--text);')
    expect(read(file)).not.toContain('--black-text')
  })
})

describe('components/accessRequests/AccessRequestCard.module.css (T25)', () => {
  const file = 'components/accessRequests/AccessRequestCard.module.css'

  it('buttons use var(--dur-fast) and canonical var(--ease-out) without fallback', () => {
    const b = block(file, '.acceptButton, .rejectButton')
    expect(b).toContain('transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);')
    expect(read(file)).not.toContain('var(--ease-out,')
    expect(read(file)).not.toContain('cubic-bezier')
  })
})
