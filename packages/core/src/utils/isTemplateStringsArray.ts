export default function isTemplateStringsArray(input: any): input is TemplateStringsArray {
  return Array.isArray(input) && 'raw' in input;
}
