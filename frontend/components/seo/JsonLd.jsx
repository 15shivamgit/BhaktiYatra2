/**
 * Structured data for search engines. `<` is escaped so content can never close the script tag.
 * @param {{ data: object }} props
 */
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
