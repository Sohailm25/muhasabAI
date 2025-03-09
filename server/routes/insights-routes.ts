import express, { Request, Response } from 'express';
import { generateInsights, PersonalizationContext } from '../lib/anthropic';

const router = express.Router();

/**
 * POST /api/insights
 * Generate insights from conversation history
 */
router.post('/insights', async (req: Request, res: Response) => {
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log("[EXPRESS INSIGHTS API] Insights API called");
    
    // Parse the request body
    const { conversation, personalizationContext } = req.body;
    
    if (!conversation) {
      console.error("[EXPRESS INSIGHTS API] Missing conversation content");
      return res.status(400).json({ 
        error: "Missing conversation content", 
        success: false 
      });
    }
    
    console.log("[EXPRESS INSIGHTS API] Conversation length:", conversation?.length || 0);
    console.log("[EXPRESS INSIGHTS API] Has personalization:", !!personalizationContext);
    
    try {
      // Generate insights with personalization if available
      console.log("[EXPRESS INSIGHTS API] Calling generateInsights function");
      
      const insights = await generateInsights(
        conversation,
        personalizationContext as PersonalizationContext
      );
      
      console.log("[EXPRESS INSIGHTS API] Insights generated successfully:", insights?.length || 0);
      
      // Return the insights
      return res.json({
        insights,
        success: true
      });
    } catch (error) {
      console.error("[EXPRESS INSIGHTS API] Error generating insights:", error);
      
      // Fallback insights in case of error
      const fallbackInsights = [
        "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
        "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
        "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
      ];
      
      // Return fallback insights with error details
      return res.json({
        insights: fallbackInsights,
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : String(error),
        success: false,
        fallback: true
      });
    }
  } catch (error) {
    console.error("[EXPRESS INSIGHTS API] Unhandled error:", error);
    
    return res.status(500).json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
});

/**
 * GET /api/insights/test
 * Test endpoint to verify API routing is working
 */
router.get('/insights/test', (req: Request, res: Response) => {
  console.log("[EXPRESS INSIGHTS TEST] Test insights API called");
  
  // Return a simple JSON response
  return res.json({
    message: "Express insights API test endpoint is working",
    success: true,
    timestamp: new Date().toISOString(),
    path: "/api/insights/test"
  });
});

/**
 * POST /api/generate/insights
 * Generate insights from conversation history (backward compatibility)
 */
router.post('/generate/insights', async (req: Request, res: Response) => {
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log("[EXPRESS GENERATE/INSIGHTS API] Insights API called (legacy endpoint)");
    
    // Parse the request body
    const { conversation, personalizationContext } = req.body;
    
    if (!conversation) {
      console.error("[EXPRESS GENERATE/INSIGHTS API] Missing conversation content");
      return res.status(400).json({ 
        error: "Missing conversation content", 
        success: false 
      });
    }
    
    console.log("[EXPRESS GENERATE/INSIGHTS API] Conversation length:", conversation?.length || 0);
    console.log("[EXPRESS GENERATE/INSIGHTS API] Has personalization:", !!personalizationContext);
    
    try {
      // Generate insights with personalization if available
      console.log("[EXPRESS GENERATE/INSIGHTS API] Calling generateInsights function");
      
      const insights = await generateInsights(
        conversation,
        personalizationContext as PersonalizationContext
      );
      
      console.log("[EXPRESS GENERATE/INSIGHTS API] Insights generated successfully:", insights?.length || 0);
      
      // Return the insights
      return res.json({
        insights,
        success: true
      });
    } catch (error) {
      console.error("[EXPRESS GENERATE/INSIGHTS API] Error generating insights:", error);
      
      // Fallback insights in case of error
      const fallbackInsights = [
        "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
        "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
        "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
      ];
      
      // Return fallback insights with error details
      return res.json({
        insights: fallbackInsights,
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : String(error),
        success: false,
        fallback: true
      });
    }
  } catch (error) {
    console.error("[EXPRESS GENERATE/INSIGHTS API] Unhandled error:", error);
    
    return res.status(500).json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
});

/**
 * GET /api/generate/insights/test
 * Test endpoint to verify API routing is working (backward compatibility)
 */
router.get('/generate/insights/test', (req: Request, res: Response) => {
  console.log("[EXPRESS GENERATE/INSIGHTS TEST] Test insights API called (legacy endpoint)");
  
  // Return a simple JSON response
  return res.json({
    message: "Express generate/insights API test endpoint is working",
    success: true,
    timestamp: new Date().toISOString(),
    path: "/api/generate/insights/test"
  });
});

export default router; 