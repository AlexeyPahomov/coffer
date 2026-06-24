import { RouterProvider } from 'react-router-dom'

import { AppBootstrapProvider } from './providers/AppBootstrapProvider'
import { QueryProvider } from './providers/QueryProvider'
import { router } from './router/router'

export default function App() {
  return (
    <QueryProvider>
      <AppBootstrapProvider>
        <RouterProvider router={router} />
      </AppBootstrapProvider>
    </QueryProvider>
  )
}
