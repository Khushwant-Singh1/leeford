# Subcategory Management System

This document outlines the complete subcategory management functionality implemented in the Leeford e-commerce admin panel.

## Features Implemented

### 1. Database Structure
- **Categories Table**: Supports hierarchical structure with `parentId` field
- **Main Categories**: Categories with `parentId = null`
- **Subcategories**: Categories with a valid `parentId` pointing to a main category

### 2. API Endpoints

#### Categories API (`/api/categories`)
- `GET`: Fetches all categories including subcategories
- `POST`: Creates new categories (main or subcategories)
- `PATCH /:id`: Updates existing categories
- `DELETE /:id`: Deletes categories

#### Subcategories API (`/api/subcategories`)
- `GET`: Fetches all subcategories (optionally filtered by parentId)
- `POST`: Creates new subcategories with validation
- `PATCH /:id`: Updates existing subcategories
- `DELETE /:id`: Deletes subcategories with product validation

### 3. Admin Components

#### Categories List (`categories-list.tsx`)
- **Hierarchical Display**: Shows main categories with expandable subcategories
- **Inline Editing**: Click to edit category/subcategory names
- **Add Subcategories**: Dedicated form for adding subcategories to main categories
- **Expand/Collapse**: Toggle visibility of subcategories
- **Product Count**: Shows product count for each category/subcategory
- **Actions**: Edit and delete functionality for both levels

#### Product Forms
- **Add Product Form**: Supports category and subcategory selection
- **Edit Product Form**: Maintains category/subcategory relationships
- **Visual Selection**: Radio-button style selection with visual feedback
- **Hierarchical Display**: Shows subcategories indented under main categories

#### Category Browser (`category-browser.tsx`)
- **Browse Interface**: User-friendly category navigation
- **Product Counts**: Shows number of products in each category/subcategory
- **Selection State**: Visual feedback for selected categories

### 4. Type Definitions

#### Enhanced Types
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentId?: string; // For subcategories
  parent?: Category; // Parent category reference
  subcategories?: Category[]; // Child subcategories
  products?: Product[];
  _count?: { products: number };
}

interface Product {
  // ... other fields
  categoryId?: string;
  subcategoryId?: string;
  category_id?: string; // For backward compatibility
  subcategory_id?: string; // For backward compatibility
}
```

## Usage Guide

### Creating Categories
1. **Main Category**: Leave parent field empty or select "Main Category"
2. **Subcategory**: Select a main category as parent

### Managing Subcategories
1. **View**: Click expand button (▶) next to main categories
2. **Add**: Click "Add Subcategory" button on any main category
3. **Edit**: Click edit icon next to subcategory name
4. **Delete**: Click delete icon (validates no products are assigned)

### Assigning Products
1. **Category Only**: Select a main category (no subcategory)
2. **Subcategory**: Select both main category and subcategory
3. **Validation**: System ensures proper category relationships

### Product Display Logic
- If product has `subcategoryId`, use subcategory for organization
- If only `categoryId`, use main category
- Frontend can filter by either level

## API Response Examples

### Categories with Subcategories
```json
[
  {
    "id": "cat-1",
    "name": "Clothing",
    "parentId": null,
    "subcategories": [
      {
        "id": "subcat-1",
        "name": "Women's Clothing",
        "parentId": "cat-1",
        "_count": { "products": 15 }
      }
    ],
    "_count": { "products": 45 }
  }
]
```

### Product with Subcategory
```json
{
  "id": "prod-1",
  "title": "Summer Dress",
  "categoryId": "subcat-1", // Points to subcategory
  "category": {
    "id": "subcat-1",
    "name": "Women's Clothing",
    "parent": {
      "id": "cat-1",
      "name": "Clothing"
    }
  }
}
```

## Validation Rules

### Category Creation
- Main categories cannot have subcategories as parents
- Subcategories must have valid main category parents
- Names must be unique within the same level

### Category Deletion
- Cannot delete categories with assigned products
- Deleting main categories also deletes subcategories (cascade)
- System prompts for confirmation

### Product Assignment
- Products can be assigned to main categories or subcategories
- If assigned to subcategory, main category is automatically inferred
- Validation ensures category relationships are maintained

## File Structure

```
src/
├── app/api/
│   ├── categories/
│   │   ├── route.ts              # Main categories CRUD
│   │   └── [id]/route.ts         # Individual category operations
│   └── subcategories/
│       ├── route.ts              # Subcategories list and creation
│       └── [id]/route.ts         # Individual subcategory operations
├── components/admin/
│   ├── categories-list.tsx       # Category management interface
│   ├── category-browser.tsx      # Category browsing component
│   ├── add-product-form.tsx      # Product creation with category selection
│   └── edit-product-form.tsx     # Product editing with category selection
├── lib/api/
│   ├── categories.ts             # Category API client
│   └── subcategories.ts          # Subcategory API client
└── types/
    └── product-types.ts          # Type definitions
```

## Benefits

1. **Organized Product Catalog**: Better product organization and discovery
2. **Scalable Structure**: Easy to add new categories and subcategories
3. **User-Friendly**: Intuitive admin interface for management
4. **Flexible**: Supports both flat and hierarchical categorization
5. **Validated**: Ensures data integrity with proper validation
6. **Performant**: Efficient queries with proper indexing

This implementation provides a complete, production-ready subcategory management system that integrates seamlessly with the existing product management workflow.
