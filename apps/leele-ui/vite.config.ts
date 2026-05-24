import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    nitro({
      preset: 'aws_amplify',
      awsAmplify: { runtime: 'nodejs24.x' },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
