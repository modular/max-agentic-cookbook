// Auto-generated navigation from recipe registry
// This file is derived - edit registry.ts to change structure

import { buildNavigation } from '../recipes/registry'

// Build navigation with auto-numbering (1: Title, 2: Title, etc.)
const navigation = buildNavigation()

// Export in legacy format for backwards compatibility
const chapters = {
    sections: navigation.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
            number: item.number,
            title: item.title,
            tags: item.tags,
            slug: item.slug,
        })),
    })),
}

export default chapters
