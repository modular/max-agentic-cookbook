// Auto-generated navigation from recipeMetadata
// This file is derived - edit recipeMetadata.ts to change structure

import { buildNavigation } from './recipeMetadata'

// Build navigation with auto-numbering (1: Title, 2: Title, etc.)
const navigation = buildNavigation()

// Export in legacy format for backwards compatibility
const chapters = {
    sections: navigation.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
            title: item.displayTitle, // "1: Introduction", "2: Multi-Turn Chat"
            slug: item.slug,
        })),
    })),
}

export default chapters
