// ===========================================
// Simple State Graph Engine with Retry Logic
// ===========================================
// Lightweight workflow executor inspired by LangGraph
// Includes retry mechanisms for production reliability

import type { ArticleWorkflowState, NodeUpdate } from "./types";

// -------------------------------------------
// Node Function Type
// -------------------------------------------

export type NodeFunction = (
    state: ArticleWorkflowState
) => Promise<NodeUpdate>;

// -------------------------------------------
// Conditional Edge Function Type
// -------------------------------------------

export type ConditionalEdge = (state: ArticleWorkflowState) => string;

// -------------------------------------------
// Graph Definition
// -------------------------------------------

export interface WorkflowGraph {
    nodes: Map<string, NodeFunction>;
    edges: Map<string, string | ConditionalEdge>;
    entryPoint: string;
}

// -------------------------------------------
// Retry Configuration
// -------------------------------------------

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
};

// -------------------------------------------
// Retry Wrapper with Exponential Backoff
// -------------------------------------------

export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: string
): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_RETRY_CONFIG, ...config };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                console.error(`[Retry] ${context || "Operation"} failed after ${maxRetries + 1} attempts:`, lastError.message);
                throw lastError;
            }

            // Exponential backoff with jitter
            const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + Math.random() * 500, maxDelayMs);
            console.warn(`[Retry] ${context || "Operation"} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
            console.warn(`[Retry] Error: ${lastError.message}`);

            await new Promise(r => setTimeout(r, delay));
        }
    }

    throw lastError || new Error("Unreachable");
}

// -------------------------------------------
// State Reducer
// -------------------------------------------

function reduceState(
    currentState: ArticleWorkflowState,
    update: NodeUpdate,
    nodeName: string
): ArticleWorkflowState {
    return {
        ...currentState,
        ...update,
        nodeHistory: [...currentState.nodeHistory, nodeName],
    };
}

// -------------------------------------------
// Workflow Executor with Retries
// -------------------------------------------

export async function executeWorkflow(
    graph: WorkflowGraph,
    initialState: ArticleWorkflowState,
    retryConfig?: Partial<RetryConfig>
): Promise<ArticleWorkflowState> {
    let state = initialState;
    let currentNode = graph.entryPoint;

    const maxSteps = 20; // Safety limit to prevent infinite loops
    let stepCount = 0;

    console.log(`[Workflow] Starting execution from: ${currentNode}`);

    while (currentNode !== "END" && stepCount < maxSteps) {
        stepCount++;

        // Execute current node
        const nodeFunc = graph.nodes.get(currentNode);
        if (!nodeFunc) {
            throw new Error(`Node not found: ${currentNode}`);
        }

        console.log(`[Workflow] Executing node: ${currentNode} (step ${stepCount})`);

        try {
            // Execute node with retry wrapper
            const update = await withRetry(
                () => nodeFunc(state),
                retryConfig,
                `Node: ${currentNode}`
            );
            state = reduceState(state, update, currentNode);
        } catch (error) {
            console.error(`[Workflow] Error in node ${currentNode} after retries:`, error);
            throw error;
        }

        // Determine next node
        const edge = graph.edges.get(currentNode);
        if (!edge) {
            throw new Error(`No edge defined for node: ${currentNode}`);
        }

        if (typeof edge === "function") {
            // Conditional edge
            currentNode = edge(state);
            console.log(`[Workflow] Conditional routing to: ${currentNode}`);
        } else {
            // Static edge
            currentNode = edge;
            console.log(`[Workflow] Routing to: ${currentNode}`);
        }
    }

    if (stepCount >= maxSteps) {
        console.warn(`[Workflow] Max steps (${maxSteps}) reached, terminating`);
    }

    const duration = Date.now() - state.startTime;
    console.log(`[Workflow] ✅ Completed in ${duration}ms after ${stepCount} steps`);
    console.log(`[Workflow] Node history:`, state.nodeHistory);

    return state;
}

// -------------------------------------------
// Graph Builder
// -------------------------------------------

export class GraphBuilder {
    private nodes = new Map<string, NodeFunction>();
    private edges = new Map<string, string | ConditionalEdge>();
    private entryPoint = "";

    addNode(name: string, func: NodeFunction): this {
        this.nodes.set(name, func);
        return this;
    }

    addEdge(from: string, to: string | ConditionalEdge): this {
        this.edges.set(from, to);
        return this;
    }

    setEntryPoint(node: string): this {
        this.entryPoint = node;
        return this;
    }

    build(): WorkflowGraph {
        if (!this.entryPoint) {
            throw new Error("Entry point not set");
        }
        return {
            nodes: this.nodes,
            edges: this.edges,
            entryPoint: this.entryPoint,
        };
    }
}
