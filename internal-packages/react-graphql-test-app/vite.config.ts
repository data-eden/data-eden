import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import graphql from '@rollup/plugin-graphql';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), graphql()],
});
