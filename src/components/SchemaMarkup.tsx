// ===========================================
// Schema Markup Component
// ===========================================
// Renders JSON-LD structured data for SEO

interface SchemaMarkupProps {
    schema: object | object[];
}

export function SchemaMarkup({ schema }: SchemaMarkupProps) {
    const schemaArray = Array.isArray(schema) ? schema : [schema];

    return (
        <>
            {schemaArray.map((schemaItem, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schemaItem),
                    }}
                />
            ))}
        </>
    );
}
