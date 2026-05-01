import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ensure @testing-library/react cleans up the DOM after every test.
// This is required because vitest does not expose afterEach as a global by default,
// so @testing-library/react cannot auto-register cleanup on its own.
afterEach(cleanup)
