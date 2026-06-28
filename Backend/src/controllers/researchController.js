import { graph } from '../agent/graph.js';
import { db } from '../db/index.js';
import { researchHistory } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function runResearch(req, res) {
  const { query } = req.body;
  const user = req.user;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const stream = await graph.stream({ query, progress: [] });
    let finalState = { query };

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const nodeData = chunk[nodeName];
      
      finalState = { ...finalState, ...nodeData };

      res.write(`data: ${JSON.stringify({ step: nodeName, data: nodeData })}\n\n`);
    }

    // Insert saved analysis record into Supabase PostgreSQL, returning the assigned ID
    const [result] = await db.insert(researchHistory).values({
      userId: user.id,
      ticker: finalState.ticker || 'UNKNOWN',
      companyName: finalState.companyName || query,
      verdict: finalState.verdict || 'INVEST',
      confidence: finalState.confidence || 80,
      targetRange: finalState.targetRange || 'N/A',
      summary: finalState.rationale || '',
      swot: finalState.swot || {},
      sentiment: finalState.sentiment || [],
      financials: finalState.financials || {},
    }).returning({ id: researchHistory.id });

    const savedId = result.id;

    res.write(`data: ${JSON.stringify({ step: 'complete', id: savedId, finalState })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Error during research execution stream:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Internal analysis stream failure' })}\n\n`);
    res.end();
  }
}

export async function getHistory(req, res) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const items = await db.select()
      .from(researchHistory)
      .where(eq(researchHistory.userId, user.id))
      .orderBy(researchHistory.id);

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed fetching research history' });
  }
}

export async function getHistoryItem(req, res) {
  const user = req.user;
  const itemId = parseInt(req.params.id);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid analysis ID' });
  }

  try {
    const records = await db.select()
      .from(researchHistory)
      .where(
        and(
          eq(researchHistory.id, itemId),
          eq(researchHistory.userId, user.id)
        )
      )
      .limit(1);

    if (records.length === 0) {
      return res.status(404).json({ error: 'Research record not found' });
    }

    return res.json(records[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed fetching history item' });
  }
}
