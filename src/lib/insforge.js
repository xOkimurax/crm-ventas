import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  url: import.meta.env.VITE_INSFORGE_URL,
  key: import.meta.env.VITE_INSFORGE_KEY,
})

export default insforge
