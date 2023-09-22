import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { UtilsProvider } from './cmix/contexts/utils-context'
import { AuthenticationProvider } from './cmix/contexts/authentication-context'
import { ProxxyProvider } from './cmix/contexts/proxxy-context'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UtilsProvider>
      <AuthenticationProvider>
        <ProxxyProvider>
          <App />
        </ProxxyProvider>
      </AuthenticationProvider>
    </UtilsProvider>
  </React.StrictMode>,
)
