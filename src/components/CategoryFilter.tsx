'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Category = 'all' | 'news' | 'actionable';

interface CategoryFilterProps {
    onCategoryChange: (category: Category) => void;
    activeCategory: Category;
}

export function CategoryFilter({ onCategoryChange, activeCategory }: CategoryFilterProps) {
    return (
        <div className="flex items-center gap-3 mb-8">
            <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                onClick={() => onCategoryChange('all')}
                className="font-semibold"
            >
                All
            </Button>
            <Button
                variant={activeCategory === 'news' ? 'default' : 'outline'}
                onClick={() => onCategoryChange('news')}
                className="font-semibold"
            >
                News
            </Button>
            <Button
                variant={activeCategory === 'actionable' ? 'default' : 'outline'}
                onClick={() => onCategoryChange('actionable')}
                className="font-semibold"
            >
                Learning
            </Button>
        </div>
    );
}
