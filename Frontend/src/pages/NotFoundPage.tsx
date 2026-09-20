import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '6rem', margin: '0', color: '#e53e3e' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginTop: '2rem' }}>Página Não Encontrada</h2>
      <p style={{ color: '#718096', margin: '2rem' }}>
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        to="/"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3182ce',
          color: '#ffffff',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Voltar para o início
      </Link>
    </div>
  )
}

export default NotFoundPage
