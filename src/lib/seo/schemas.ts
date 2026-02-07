// ===========================================
// SEO Schema Generators
// ===========================================
// Utilities for generating JSON-LD schema markup

export interface OrganizationSchemaProps {
    name: string;
    description: string;
    url: string;
    logo?: string;
    sameAs?: string[];
}

export function generateOrganizationSchema(
    props: OrganizationSchemaProps
): object {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: props.name,
        description: props.description,
        url: props.url,
        ...(props.logo && { logo: props.logo }),
        ...(props.sameAs && { sameAs: props.sameAs }),
    };
}

export interface ArticleSchemaProps {
    headline: string;
    description: string;
    datePublished: string;
    dateModified?: string;
    author?: {
        name: string;
        url?: string;
    };
    image?: string;
    url: string;
    publisher: {
        name: string;
        logo?: string;
    };
}

export function generateArticleSchema(props: ArticleSchemaProps): object {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        description: props.description,
        datePublished: props.datePublished,
        dateModified: props.dateModified || props.datePublished,
        author: props.author
            ? {
                "@type": "Person",
                name: props.author.name,
                ...(props.author.url && { url: props.author.url }),
            }
            : {
                "@type": "Organization",
                name: props.publisher.name,
            },
        publisher: {
            "@type": "Organization",
            name: props.publisher.name,
            ...(props.publisher.logo && {
                logo: {
                    "@type": "ImageObject",
                    url: props.publisher.logo,
                },
            }),
        },
        ...(props.image && { image: props.image }),
        url: props.url,
    };
}

export interface BreadcrumbItem {
    name: string;
    url?: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            ...(item.url && { item: item.url }),
        })),
    };
}
