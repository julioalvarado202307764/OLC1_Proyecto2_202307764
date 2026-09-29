export type AutoInfraBaseType =
    | "int"
    | "float"
    | "string"
    | "bool"
    | "server"
    | "service"
    | "database";

export interface AutoInfraType {
    name: AutoInfraBaseType;
    isArray: boolean;
}


/* =========================================================
   PROGRAMA
   ========================================================= */

export interface ProgramNode {
    type: "Program";
    declarations: GlobalDeclarationNode[];
    main: MainDeclarationNode;
}

export type GlobalDeclarationNode =
    | VariableDeclarationNode
    | ResourceDeclarationNode
    | FunctionDeclarationNode
    | TaskDeclarationNode;


/* =========================================================
   EXPRESIONES
   ========================================================= */

export type ExpressionNode =
    | LiteralExpressionNode
    | IdentifierExpressionNode
    | BinaryExpressionNode
    | UnaryExpressionNode
    | CallExpressionNode
    | PropertyAccessExpressionNode
    | IndexExpressionNode
    | ArrayExpressionNode;

export interface LiteralExpressionNode {
    type: "LiteralExpression";
    literalType: "int" | "float" | "string" | "bool";
    value: number | string | boolean;
    raw: string;
}

export interface IdentifierExpressionNode {
    type: "IdentifierExpression";
    name: string;
}

export interface BinaryExpressionNode {
    type: "BinaryExpression";
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}

export interface UnaryExpressionNode {
    type: "UnaryExpression";
    operator: string;
    operand: ExpressionNode;
}

export interface CallExpressionNode {
    type: "CallExpression";
    callee: ExpressionNode;
    arguments: ExpressionNode[];
}

export interface PropertyAccessExpressionNode {
    type: "PropertyAccessExpression";
    object: ExpressionNode;
    property: string;
}

export interface IndexExpressionNode {
    type: "IndexExpression";
    object: ExpressionNode;
    index: ExpressionNode;
}

export interface ArrayExpressionNode {
    type: "ArrayExpression";
    elements: ExpressionNode[];
}


/* =========================================================
   BLOQUES E INSTRUCCIONES
   ========================================================= */

export interface BlockNode {
    type: "Block";
    statements: StatementNode[];
}

export type StatementNode =
    | VariableDeclarationNode
    | AssignmentNode
    | ExpressionStatementNode
    | IfInstructionNode
    | WhileInstructionNode
    | ForInstructionNode
    | BreakInstructionNode
    | ContinueInstructionNode
    | ReturnInstructionNode
    | RunInstructionNode
    | BlockNode;

export interface VariableDeclarationNode {
    type: "VariableDeclaration";
    variableType: AutoInfraType;
    name: string;
    initializer: ExpressionNode | null;
}

export interface AssignmentNode {
    type: "Assignment";
    target: ExpressionNode;
    value: ExpressionNode;
}

export interface ExpressionStatementNode {
    type: "ExpressionStatement";
    expression: ExpressionNode;
}

export interface IfInstructionNode {
    type: "IfInstruction";
    condition: ExpressionNode;
    thenBranch: BlockNode;
    elseBranch: BlockNode | IfInstructionNode | null;
}

export interface WhileInstructionNode {
    type: "WhileInstruction";
    condition: ExpressionNode;
    body: BlockNode;
}

export type ForInitializerNode =
    | VariableDeclarationNode
    | AssignmentNode
    | ExpressionStatementNode
    | null;

export type ForUpdateNode =
    | AssignmentNode
    | ExpressionStatementNode
    | null;

export interface ForInstructionNode {
    type: "ForInstruction";
    initializer: ForInitializerNode;
    condition: ExpressionNode | null;
    update: ForUpdateNode;
    body: BlockNode;
}

export interface BreakInstructionNode {
    type: "BreakInstruction";
}

export interface ContinueInstructionNode {
    type: "ContinueInstruction";
}

export interface ReturnInstructionNode {
    type: "ReturnInstruction";
    value: ExpressionNode | null;
}

export interface RunInstructionNode {
    type: "RunInstruction";
    taskName: string;
}


/* =========================================================
   FUNCIONES
   ========================================================= */

export interface ParameterNode {
    type: "Parameter";
    parameterType: AutoInfraType;
    name: string;
}

export interface FunctionDeclarationNode {
    type: "FunctionDeclaration";
    name: string;
    parameters: ParameterNode[];
    returnType: AutoInfraType;
    body: BlockNode;
}


/* =========================================================
   TASK
   ========================================================= */

export interface TaskDeclarationNode {
    type: "TaskDeclaration";
    name: string;
    body: BlockNode;
}


/* =========================================================
   RECURSOS
   ========================================================= */

export type ResourceType =
    | "server"
    | "service"
    | "database";

export interface ResourcePropertyNode {
    type: "ResourceProperty";
    name: string;
    value: ExpressionNode;
}

export interface ResourceDeclarationNode {
    type: "ResourceDeclaration";
    resourceType: ResourceType;
    name: string;
    properties: ResourcePropertyNode[];
}


/* =========================================================
   MAIN
   ========================================================= */

export interface MainDeclarationNode {
    type: "MainDeclaration";
    body: BlockNode;
}