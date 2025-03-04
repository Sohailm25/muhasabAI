// Vite plugin to handle shared schema imports
export default function sharedSchemaShim() {
  return {
    name: 'shared-schema-shim',
    resolveId(id) {
      // Check if the import is for @shared/schema and return our shim path
      if (id === '@shared/schema') {
        return 'virtual:shared-schema';
      }
      
      return null;
    },
    load(id) {
      // When loading the virtual module, redirect to our shim
      if (id === 'virtual:shared-schema') {
        return `
          export * from '/src/shims/shared-schema';
        `;
      }
      
      return null;
    }
  };
} 