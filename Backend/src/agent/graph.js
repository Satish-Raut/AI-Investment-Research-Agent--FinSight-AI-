import { StateGraph, START, END } from '@langchain/langgraph';
import { graphState } from './state.js';
import {
  resolveTickerNode,
  fetchFinancialsNode,
  scoreSentimentNode,
  compileSWOTNode,
  writeMemoNode,
} from './nodes.js';

const workflow = new StateGraph({
  channels: graphState,
})
  .addNode('resolveTicker', resolveTickerNode)
  .addNode('fetchFinancials', fetchFinancialsNode)
  .addNode('scoreSentiment', scoreSentimentNode)
  .addNode('compileSWOT', compileSWOTNode)
  .addNode('writeMemo', writeMemoNode)
  
  .addEdge(START, 'resolveTicker')
  .addEdge('resolveTicker', 'fetchFinancials')
  .addEdge('fetchFinancials', 'scoreSentiment')
  .addEdge('scoreSentiment', 'compileSWOT')
  .addEdge('compileSWOT', 'writeMemo')
  .addEdge('writeMemo', END);

export const graph = workflow.compile();
