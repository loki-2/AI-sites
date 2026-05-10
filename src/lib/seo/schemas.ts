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
