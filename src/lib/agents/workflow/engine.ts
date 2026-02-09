// ===========================================
// Simple State Graph Engine
// ===========================================
// Lightweight workflow executor inspired by LangGraph

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
// Workflow Executor
// -------------------------------------------

export async function executeWorkflow(
    graph: WorkflowGraph,
    initialState: ArticleWorkflowState
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
            const update = await nodeFunc(state);
            state = reduceState(state, update, currentNode);
        } catch (error) {
            console.error(`[Workflow] Error in node ${currentNode}:`, error);
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
    console.log(`[Workflow] Completed in ${duration}ms after ${stepCount} steps`);
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
