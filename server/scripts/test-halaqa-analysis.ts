import { generateHalaqaWirdSuggestions } from '../lib/anthropic';

async function main() {
  console.log('Testing Halaqa Analysis and Wird Suggestion Generation');
  
  // Test data
  const halaqaEntry = {
    title: 'The Importance of Remembrance',
    topic: 'Dhikr and Spiritual Connection',
    keyReflection: 'The sheikh emphasized how consistent dhikr (remembrance of Allah) helps maintain a spiritual connection throughout our daily lives. He explained that even small moments of remembrance can transform ordinary activities into acts of worship.',
    impact: 'I realized that I often get caught up in the busyness of life and forget to maintain that spiritual connection. I want to incorporate more consistent remembrance practices throughout my day to strengthen my relationship with Allah.'
  };
  
  try {
    console.log('Generating Wird suggestions...');
    const suggestions = await generateHalaqaWirdSuggestions(halaqaEntry);
    
    console.log('\n🎉 Successfully generated Wird suggestions:');
    console.log(JSON.stringify(suggestions, null, 2));
    
    console.log(`\nGenerated ${suggestions.length} suggestions`);
  } catch (error) {
    console.error('❌ Error testing Halaqa Analysis:', error);
  }
}

main().catch(console.error); 