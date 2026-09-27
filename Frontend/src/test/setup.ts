import '@testing-library/jest-dom/vitest'
import i18n from '../config/i18n'
import { beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('pt-BR')
})
