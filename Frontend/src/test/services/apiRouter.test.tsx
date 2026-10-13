import { render, screen } from '@testing-library/react'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import api from '../../services/api'

afterEach(() => window.history.pushState({}, '', '/'))

it('a 401 moves a mounted BrowserRouter to /login', async () => {
  api.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, {
        status: 401,
        statusText: '',
        data: {},
        headers: {},
        config,
      })
    )
  window.history.pushState({}, '', '/')
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </BrowserRouter>
  )
  expect(screen.getByText('home')).toBeInTheDocument()

  await api.get('/machines').catch(() => {})

  expect(await screen.findByText('login page')).toBeInTheDocument()
})
