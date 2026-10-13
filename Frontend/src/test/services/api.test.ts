import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../services/api'
import { authService } from '../../services/authService'

const failWith = (status: number) => {
  api.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, {
        status,
        statusText: '',
        data: {},
        headers: {},
        config,
      })
    )
}

const at = (path: string) => window.history.pushState({}, '', path)

describe('api 401 handling', () => {
  const logout = vi.spyOn(authService, 'logout')

  beforeEach(() => {
    logout.mockClear()
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', '{}')
    at('/')
  })

  afterEach(() => {
    at('/')
  })

  it('a 401 on a regular request clears the session and goes to /login', async () => {
    failWith(401)

    await expect(api.get('/machines')).rejects.toBeInstanceOf(AxiosError)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(window.location.pathname).toBe('/login')
  })

  it('a 401 announces the navigation with a popstate event after pushing /login', async () => {
    failWith(401)
    const paths: string[] = []
    const onPopState = () => paths.push(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    await expect(api.get('/machines')).rejects.toBeInstanceOf(AxiosError)
    window.removeEventListener('popstate', onPopState)

    expect(paths).toEqual(['/login'])
  })

  it('a 401 on the login request keeps the session and the route', async () => {
    failWith(401)

    await expect(api.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError)

    expect(logout).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBe('tok')
    expect(window.location.pathname).toBe('/')
  })

  it.each(['/login', '/login/colaborador', '/solicitar-acesso'])(
    'a 401 while on %s does not navigate',
    async (path) => {
      at(path)
      failWith(401)

      await expect(api.get('/machines')).rejects.toBeInstanceOf(AxiosError)

      expect(logout).not.toHaveBeenCalled()
      expect(window.location.pathname).toBe(path)
    }
  )

  it('rejects with the very same error', async () => {
    failWith(401)

    const error = await api.get('/machines').catch((e: unknown) => e)

    expect((error as AxiosError).response?.status).toBe(401)
    expect((error as AxiosError).config?.url).toBe('/machines')
  })

  it.each([403, 409, 500])('a %i does not end the session', async (status) => {
    failWith(status)

    const error = await api.get('/machines').catch((e: unknown) => e)

    expect((error as AxiosError).response?.status).toBe(status)
    expect(logout).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBe('tok')
    expect(window.location.pathname).toBe('/')
  })
})
