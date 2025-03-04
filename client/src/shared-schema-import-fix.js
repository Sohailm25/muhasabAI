// This script should be added to the HTML head to fix @shared/schema imports
(function() {
  console.log("Setting up @shared/schema import fixer");
  
  // Check if importmap is supported
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('importmap')) {
    console.log("Browser supports import maps, setting up override");
    
    // Create an import map to redirect @shared/schema to our client types
    const importMap = {
      imports: {
        "@shared/schema": "/src/shims/shared-schema.js"
      }
    };
    
    // Create a script element for the import map
    const script = document.createElement('script');
    script.type = 'importmap';
    script.textContent = JSON.stringify(importMap);
    
    // Insert at the top of head
    document.head.insertBefore(script, document.head.firstChild);
    console.log("Import map added for @shared/schema");
  } else {
    console.warn("Browser does not support import maps, cannot fix @shared/schema imports");
  }
})(); 