#!/usr/bin/env node

/**
 * Copy recipe source code files to public/ directory
 * Supports watch mode for development
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chokidar from 'chokidar'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RECIPES_DIR = path.resolve(__dirname, '../src/recipes')
const PUBLIC_CODE_DIR = path.resolve(__dirname, '../public/code')

/**
 * Extract recipe name from file path
 * Example: /path/to/src/recipes/image-captioning/ui.tsx -> image-captioning
 */
function getRecipeName(filePath) {
  const relativePath = path.relative(RECIPES_DIR, filePath)
  const parts = relativePath.split(path.sep)
  return parts[0]
}

/**
 * Copy a single recipe file to public/code/
 */
async function copyRecipeFile(sourcePath) {
  try {
    const recipeName = getRecipeName(sourcePath)
    const filename = path.basename(sourcePath)

    // Create destination directory
    const destDir = path.join(PUBLIC_CODE_DIR, recipeName)
    await fs.mkdir(destDir, { recursive: true })

    // Copy file
    const destPath = path.join(destDir, filename)
    await fs.copyFile(sourcePath, destPath)

    console.log(`✓ Copied ${recipeName}/${filename}`)
  } catch (error) {
    console.error(`✗ Error copying ${sourcePath}:`, error.message)
  }
}

/**
 * Copy all recipe ui.tsx files
 */
async function copyAllRecipeFiles() {
  try {
    // Find all ui.tsx files in recipes/
    const recipes = await fs.readdir(RECIPES_DIR, { withFileTypes: true })

    for (const entry of recipes) {
      if (!entry.isDirectory()) continue

      const uiPath = path.join(RECIPES_DIR, entry.name, 'ui.tsx')

      // Check if ui.tsx exists
      try {
        await fs.access(uiPath)
        await copyRecipeFile(uiPath)
      } catch {
        // ui.tsx doesn't exist for this recipe, skip
      }
    }

    console.log('✓ Recipe code copy complete')
  } catch (error) {
    console.error('✗ Error copying recipe files:', error.message)
    process.exit(1)
  }
}

/**
 * Watch recipe files and copy on change
 */
function watchRecipeFiles() {
  console.log('👀 Watching for recipe code changes...')

  const watcher = chokidar.watch(path.join(RECIPES_DIR, '*/ui.tsx'), {
    persistent: true,
    ignoreInitial: false,
  })

  watcher
    .on('add', (filePath) => copyRecipeFile(filePath))
    .on('change', (filePath) => copyRecipeFile(filePath))
    .on('error', (error) => console.error('Watcher error:', error))
}

// Main execution
const args = process.argv.slice(2)
const watchMode = args.includes('--watch') || args.includes('-w')

if (watchMode) {
  watchRecipeFiles()
} else {
  copyAllRecipeFiles()
}
