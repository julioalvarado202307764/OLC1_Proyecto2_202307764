%lex

%x COMMENT

digit           [0-9]
id_start        [A-Za-z_]
id_continue     [A-Za-z0-9_]

%%


/* =========================================================
   ESPACIOS Y SALTOS DE LÍNEA
   ========================================================= */

[ \t\f\v]+                  /* ignorar espacios y tabulaciones */
\r\n|\r|\n                  /* ignorar saltos de línea */


/* =========================================================
   COMENTARIOS
   ========================================================= */

/* Comentario de una línea */
"//"[^\r\n]*                /* ignorar */


/* Inicio de comentario multilínea */
"/*" {
    yy.inicioComentario = {
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    };

    this.begin("COMMENT");
}


/* Fin de comentario multilínea */
<COMMENT>"*/" {
    this.begin("INITIAL");
    yy.inicioComentario = null;
}


/* Saltos de línea dentro de comentario multilínea */
<COMMENT>\r\n|\r|\n         /* ignorar */


/* Cualquier otro carácter dentro del comentario */
<COMMENT>.                   /* ignorar */


/* EOF dentro de comentario multilínea */
<COMMENT><<EOF>> {
    if (!yy.erroresLexicos) {
        yy.erroresLexicos = [];
    }

    var inicio = yy.inicioComentario || {
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    };

    yy.erroresLexicos.push({
        tipo: "Léxico",
        descripcion: "Comentario multilínea sin cerrar",
        lexema: "/*",
        linea: inicio.linea,
        columna: inicio.columna
    });

    yy.inicioComentario = null;
    this.begin("INITIAL");

    return 1;
}


/* =========================================================
   CADENAS
   ========================================================= */

/*
   Cadena correctamente cerrada.

   Se reconocen los escapes requeridos por el enunciado:
   \"
   \\
   \n
   \t

   El regex permite conservar otros escapes sin inventar
   todavía un error que el PDF no define explícitamente.
*/
\"([^\"\\\r\n]|\\.)*\" {
    if (!yy.tokens) {
        yy.tokens = [];
    }

    var lexema = yytext;

    var valorProcesado = lexema
        .substring(1, lexema.length - 1)
        .replace(/\\(["\\nt])/g, function(coincidencia, escape) {
            switch (escape) {
                case "\"":
                    return "\"";

                case "\\":
                    return "\\";

                case "n":
                    return "\n";

                case "t":
                    return "\t";

                default:
                    return coincidencia;
            }
        });

    yy.tokens.push({
        lexema: lexema,
        tipo: "STRING_LITERAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1,
        valorProcesado: valorProcesado
    });

    return "STRING_LITERAL";
}


/*
   Cadena iniciada con " pero sin comillas de cierre antes
   del salto de línea o EOF.

   La regla consume la parte dañada y NO retorna un token,
   permitiendo al lexer continuar con la siguiente línea.
*/
\"([^\"\\\r\n]|\\.)*\\? {
    if (!yy.erroresLexicos) {
        yy.erroresLexicos = [];
    }

    yy.erroresLexicos.push({
        tipo: "Léxico",
        descripcion: "Cadena sin cerrar",
        lexema: yytext,
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });
}


/* =========================================================
   NÚMEROS
   ========================================================= */

/* Decimal: debe ir antes que el entero */
{digit}+"."{digit}+ {
    if (!yy.tokens) {
        yy.tokens = [];
    }

    yy.tokens.push({
        lexema: yytext,
        tipo: "DECIMAL_LITERAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "DECIMAL_LITERAL";
}


/* Entero */
{digit}+ {
    if (!yy.tokens) {
        yy.tokens = [];
    }

    yy.tokens.push({
        lexema: yytext,
        tipo: "INTEGER_LITERAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "INTEGER_LITERAL";
}


/* =========================================================
   IDENTIFICADORES Y PALABRAS RESERVADAS
   ========================================================= */

{id_start}{id_continue}* {
    if (!yy.tokens) {
        yy.tokens = [];
    }

    var tipo;

    switch (yytext) {
        /* Tipos y recursos */
        case "int":
            tipo = "INT";
            break;

        case "float":
            tipo = "FLOAT";
            break;

        case "string":
            tipo = "STRING";
            break;

        case "bool":
            tipo = "BOOL";
            break;

        case "server":
            tipo = "SERVER";
            break;

        case "service":
            tipo = "SERVICE";
            break;

        case "database":
            tipo = "DATABASE";
            break;


        /* Control */
        case "if":
            tipo = "IF";
            break;

        case "else":
            tipo = "ELSE";
            break;

        case "while":
            tipo = "WHILE";
            break;

        case "for":
            tipo = "FOR";
            break;

        case "break":
            tipo = "BREAK";
            break;

        case "continue":
            tipo = "CONTINUE";
            break;

        case "return":
            tipo = "RETURN";
            break;


        /* Declaraciones */
        case "function":
            tipo = "FUNCTION";
            break;

        case "task":
            tipo = "TASK";
            break;

        case "main":
            tipo = "MAIN";
            break;


        /* Ejecución */
        case "run":
            tipo = "RUN";
            break;


        /* Literales booleanos */
        case "true":
            tipo = "TRUE";
            break;

        case "false":
            tipo = "FALSE";
            break;


        /* Identificador normal */
        default:
            tipo = "IDENTIFIER";
            break;
    }

    yy.tokens.push({
        lexema: yytext,
        tipo: tipo,
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return tipo;
}


/* =========================================================
   OPERADORES
   ========================================================= */

/* Primero los operadores de dos caracteres */

"==" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "EQUAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "EQUAL";
}


"!=" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "NOT_EQUAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "NOT_EQUAL";
}


">=" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "GREATER_EQUAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "GREATER_EQUAL";
}


"<=" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "LESS_EQUAL",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "LESS_EQUAL";
}


"&&" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "AND",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "AND";
}


"||" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "OR",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "OR";
}


/* Operadores de un carácter */

"=" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "ASSIGN",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "ASSIGN";
}


"+" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "PLUS",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "PLUS";
}


"-" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "MINUS",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "MINUS";
}


"*" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "MULTIPLY",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "MULTIPLY";
}


"/" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "DIVIDE",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "DIVIDE";
}


"%" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "MODULO",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "MODULO";
}


">" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "GREATER",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "GREATER";
}


"<" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "LESS",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "LESS";
}


"!" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "NOT",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "NOT";
}


/* =========================================================
   DELIMITADORES
   ========================================================= */

"(" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "LPAREN",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "LPAREN";
}


")" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "RPAREN",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "RPAREN";
}


"{" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "LBRACE",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "LBRACE";
}


"}" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "RBRACE",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "RBRACE";
}


"[" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "LBRACKET",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "LBRACKET";
}


"]" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "RBRACKET",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "RBRACKET";
}


";" {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "SEMICOLON",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "SEMICOLON";
}


"," {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "COMMA",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "COMMA";
}


"." {
    if (!yy.tokens) yy.tokens = [];

    yy.tokens.push({
        lexema: yytext,
        tipo: "DOT",
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });

    return "DOT";
}


/* =========================================================
   FIN DE ARCHIVO
   ========================================================= */

<<EOF>> {
    return 1;
}


/* =========================================================
   ERROR LÉXICO: CARÁCTER DESCONOCIDO
   ========================================================= */

/*
   IMPORTANTE:
   Esta regla consume exactamente un carácter.

   NO retorna token y NO detiene el lexer.
   Después de registrar el error, Jison continúa buscando
   el siguiente token válido.
*/
. {
    if (!yy.erroresLexicos) {
        yy.erroresLexicos = [];
    }

    yy.erroresLexicos.push({
        tipo: "Léxico",
        descripcion: "Carácter no reconocido",
        lexema: yytext,
        linea: yylloc.first_line,
        columna: yylloc.first_column + 1
    });
}


/lex


/* =========================================================
   GRAMÁTICA TEMPORAL
   ========================================================= */

%start inicio

%%


/* =========================================================
   INICIO TEMPORAL DE LA FASE 2
   =========================================================

   Por ahora el parser acepta únicamente UNA expresión.

   Esto es intencional:
   todavía NO estamos implementando el programa completo.
   ========================================================= */

inicio
    : program
        {
            return $1;
        }
    ;

/* =========================================================
   PROGRAMA COMPLETO
   ========================================================= */

program
    : global_declaration_list main_declaration
        {
            $$ = {
                type: "Program",
                declarations: $1,
                main: $2
            };
        }
    ;


global_declaration_list
    : /* vacío */
        {
            $$ = [];
        }

    | global_declaration_list global_declaration
        {
            $1.push($2);
            $$ = $1;
        }
    ;


global_declaration
    : primitive_global_variable_declaration
        {
            $$ = $1;
        }

    | SERVER resource_global_tail
        {
            if ($2.kind === "resource") {
                $$ = {
                    type: "ResourceDeclaration",
                    resourceType: "server",
                    name: $2.name,
                    properties: $2.properties
                };
            } else {
                $$ = {
                    type: "VariableDeclaration",
                    variableType: {
                        name: "server",
                        isArray: $2.isArray
                    },
                    name: $2.name,
                    initializer: $2.initializer
                };
            }
        }

    | SERVICE resource_global_tail
        {
            if ($2.kind === "resource") {
                $$ = {
                    type: "ResourceDeclaration",
                    resourceType: "service",
                    name: $2.name,
                    properties: $2.properties
                };
            } else {
                $$ = {
                    type: "VariableDeclaration",
                    variableType: {
                        name: "service",
                        isArray: $2.isArray
                    },
                    name: $2.name,
                    initializer: $2.initializer
                };
            }
        }

    | DATABASE resource_global_tail
        {
            if ($2.kind === "resource") {
                $$ = {
                    type: "ResourceDeclaration",
                    resourceType: "database",
                    name: $2.name,
                    properties: $2.properties
                };
            } else {
                $$ = {
                    type: "VariableDeclaration",
                    variableType: {
                        name: "database",
                        isArray: $2.isArray
                    },
                    name: $2.name,
                    initializer: $2.initializer
                };
            }
        }

    | function_declaration
        {
            $$ = $1;
        }

    | task_declaration
        {
            $$ = $1;
        }
    ;

/* =========================================================
   VARIABLES GLOBALES PRIMITIVAS
   ========================================================= */

primitive_global_variable_declaration
    : primitive_type_specifier IDENTIFIER ASSIGN expression SEMICOLON
        {
            $$ = {
                type: "VariableDeclaration",
                variableType: $1,
                name: $2,
                initializer: $4
            };
        }
    ;


primitive_type_specifier
    : primitive_base_type
        {
            $$ = {
                name: $1,
                isArray: false
            };
        }

    | primitive_base_type LBRACKET RBRACKET
        {
            $$ = {
                name: $1,
                isArray: true
            };
        }
    ;


primitive_base_type
    : INT
        {
            $$ = "int";
        }

    | FLOAT
        {
            $$ = "float";
        }

    | STRING
        {
            $$ = "string";
        }

    | BOOL
        {
            $$ = "bool";
        }
    ;
/* =========================================================
   RECURSOS
   ========================================================= */
/* =========================================================
   RECURSOS O VARIABLES DE TIPO RECURSO A NIVEL GLOBAL
   ========================================================= */

resource_global_tail
    : IDENTIFIER LBRACE resource_property_list RBRACE
        {
            $$ = {
                kind: "resource",
                name: $1,
                properties: $3
            };
        }

    | IDENTIFIER ASSIGN expression SEMICOLON
        {
            $$ = {
                kind: "variable",
                name: $1,
                isArray: false,
                initializer: $3
            };
        }

    | LBRACKET RBRACKET IDENTIFIER ASSIGN expression SEMICOLON
        {
            $$ = {
                kind: "variable",
                name: $3,
                isArray: true,
                initializer: $5
            };
        }
    ;

resource_property_list
    : /* vacío */
        {
            $$ = [];
        }

    | resource_property_list resource_property
        {
            $1.push($2);
            $$ = $1;
        }
    ;


resource_property
    : IDENTIFIER ASSIGN expression SEMICOLON
        {
            $$ = {
                type: "ResourceProperty",
                name: $1,
                value: $3
            };
        }
    ;

/* =========================================================
   FUNCIONES
   ========================================================= */

function_declaration
    : FUNCTION IDENTIFIER
      LPAREN parameter_list_optional RPAREN
      type_specifier
      block
        {
            $$ = {
                type: "FunctionDeclaration",
                name: $2,
                parameters: $4,
                returnType: $6,
                body: $7
            };
        }
    ;


parameter_list_optional
    : /* vacío */
        {
            $$ = [];
        }

    | parameter_list
        {
            $$ = $1;
        }
    ;


parameter_list
    : parameter
        {
            $$ = [$1];
        }

    | parameter_list COMMA parameter
        {
            $1.push($3);
            $$ = $1;
        }
    ;


parameter
    : type_specifier IDENTIFIER
        {
            $$ = {
                type: "Parameter",
                parameterType: $1,
                name: $2
            };
        }
    ;

/* =========================================================
   TASK
   ========================================================= */

task_declaration
    : TASK IDENTIFIER block
        {
            $$ = {
                type: "TaskDeclaration",
                name: $2,
                body: $3
            };
        }
    ;


/* =========================================================
   MAIN
   ========================================================= */

main_declaration
    : MAIN block
        {
            $$ = {
                type: "MainDeclaration",
                body: $2
            };
        }
    ;
/* =========================================================
   TIPOS
   ========================================================= */

type_specifier
    : base_type
        {
            $$ = {
                name: $1,
                isArray: false
            };
        }

    | base_type LBRACKET RBRACKET
        {
            $$ = {
                name: $1,
                isArray: true
            };
        }
    ;


base_type
    : INT
        {
            $$ = "int";
        }

    | FLOAT
        {
            $$ = "float";
        }

    | STRING
        {
            $$ = "string";
        }

    | BOOL
        {
            $$ = "bool";
        }

    | SERVER
        {
            $$ = "server";
        }

    | SERVICE
        {
            $$ = "service";
        }

    | DATABASE
        {
            $$ = "database";
        }
    ;

/* =========================================================
   BLOQUES
   ========================================================= */

block
    : LBRACE statement_list RBRACE
        {
            $$ = {
                type: "Block",
                statements: $2
            };
        }
    ;


statement_list
    : /* vacío */
        {
            $$ = [];
        }

    | statement_list statement
        {
            if ($2 !== null) {
                $1.push($2);
            }

            $$ = $1;
        }
    ;

/* =========================================================
   INSTRUCCIONES BÁSICAS
   ========================================================= */

statement
    : variable_declaration
        {
            $$ = $1;
        }

    | simple_statement
        {
            $$ = $1;
        }

    | if_statement
        {
            $$ = $1;
        }

    | while_statement
        {
            $$ = $1;
        }

    | for_statement
        {
            $$ = $1;
        }

    | break_statement
        {
            $$ = $1;
        }

    | continue_statement
        {
            $$ = $1;
        }

    | return_statement
        {
            $$ = $1;
        }

    | run_statement
        {
            $$ = $1;
        }
    | error SEMICOLON
        {
            $$ = null;
        }
    ;

/* =========================================================
   RUN
   ========================================================= */

run_statement
    : RUN IDENTIFIER SEMICOLON
        {
            $$ = {
                type: "RunInstruction",
                taskName: $2
            };
        }
    ;
/* =========================================================
   IF / ELSE
   ========================================================= */

if_statement
    : IF LPAREN expression RPAREN block
        {
            $$ = {
                type: "IfInstruction",
                condition: $3,
                thenBranch: $5,
                elseBranch: null
            };
        }

    | IF LPAREN expression RPAREN block ELSE block
        {
            $$ = {
                type: "IfInstruction",
                condition: $3,
                thenBranch: $5,
                elseBranch: $7
            };
        }

    | IF LPAREN expression RPAREN block ELSE if_statement
        {
            $$ = {
                type: "IfInstruction",
                condition: $3,
                thenBranch: $5,
                elseBranch: $7
            };
        }
    ;

/* =========================================================
   WHILE
   ========================================================= */

while_statement
    : WHILE LPAREN expression RPAREN block
        {
            $$ = {
                type: "WhileInstruction",
                condition: $3,
                body: $5
            };
        }
    ;

/* =========================================================
   ASIGNACIONES Y EXPRESIONES COMO INSTRUCCIÓN
   ========================================================= */

simple_statement
    : expression SEMICOLON
        {
            if ($1.type !== "CallExpression") {
                if (yy.registrarErrorSintacticoManual) {
                    yy.registrarErrorSintacticoManual(
                        "Solo una llamada puede utilizarse como expresión independiente.",
                        @1
                    );
                }

                $$ = null;
            } else {
                $$ = {
                    type: "ExpressionStatement",
                    expression: $1
                };
            }
        }

    | assignment_core SEMICOLON
        {
            $$ = $1;
        }
    ;


assignment_core
    : expression ASSIGN expression
        {
            if (
                $1.type !== "IdentifierExpression" &&
                $1.type !== "PropertyAccessExpression" &&
                $1.type !== "IndexExpression"
            ) {
                if (yy.registrarErrorSintacticoManual) {
                    yy.registrarErrorSintacticoManual(
                        "Objetivo de asignación sintácticamente inválido.",
                        @1
                    );
                }

                $$ = null;
            } else {
                $$ = {
                    type: "Assignment",
                    target: $1,
                    value: $3
                };
            }
        }
    ;

/* =========================================================
   FOR
   ========================================================= */

for_statement
    : FOR LPAREN
      variable_declaration_core SEMICOLON
      expression SEMICOLON
      assignment_core
      RPAREN block
        {
            $$ = {
                type: "ForInstruction",
                initializer: $3,
                condition: $5,
                update: $7,
                body: $9
            };
        }
    ;

/* =========================================================
   BREAK / CONTINUE
   ========================================================= */

break_statement
    : BREAK SEMICOLON
        {
            $$ = {
                type: "BreakInstruction"
            };
        }
    ;


continue_statement
    : CONTINUE SEMICOLON
        {
            $$ = {
                type: "ContinueInstruction"
            };
        }
    ;

/* =========================================================
   RETURN
   ========================================================= */

return_statement
    : RETURN expression SEMICOLON
        {
            $$ = {
                type: "ReturnInstruction",
                value: $2
            };
        }
    ;

/* =========================================================
   DECLARACIÓN DE VARIABLES
   ========================================================= */

variable_declaration
    : variable_declaration_core SEMICOLON
        {
            $$ = $1;
        }
    ;


variable_declaration_core
    : type_specifier IDENTIFIER ASSIGN expression
        {
            $$ = {
                type: "VariableDeclaration",
                variableType: $1,
                name: $2,
                initializer: $4
            };
        }
    ;


/* =========================================================
   EXPRESIONES
   ========================================================= */

expression
    : logical_or
        {
            $$ = $1;
        }
    ;


/* ---------------------------------------------------------
   ||
   Menor precedencia
   --------------------------------------------------------- */

logical_or
    : logical_and
        {
            $$ = $1;
        }

    | logical_or OR logical_and
        {
            $$ = {
                type: "BinaryExpression",
                operator: "||",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   &&
   --------------------------------------------------------- */

logical_and
    : equality
        {
            $$ = $1;
        }

    | logical_and AND equality
        {
            $$ = {
                type: "BinaryExpression",
                operator: "&&",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   == !=
   --------------------------------------------------------- */

equality
    : comparison
        {
            $$ = $1;
        }

    | equality EQUAL comparison
        {
            $$ = {
                type: "BinaryExpression",
                operator: "==",
                left: $1,
                right: $3
            };
        }

    | equality NOT_EQUAL comparison
        {
            $$ = {
                type: "BinaryExpression",
                operator: "!=",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   < <= > >=
   --------------------------------------------------------- */

comparison
    : term
        {
            $$ = $1;
        }

    | comparison LESS term
        {
            $$ = {
                type: "BinaryExpression",
                operator: "<",
                left: $1,
                right: $3
            };
        }

    | comparison LESS_EQUAL term
        {
            $$ = {
                type: "BinaryExpression",
                operator: "<=",
                left: $1,
                right: $3
            };
        }

    | comparison GREATER term
        {
            $$ = {
                type: "BinaryExpression",
                operator: ">",
                left: $1,
                right: $3
            };
        }

    | comparison GREATER_EQUAL term
        {
            $$ = {
                type: "BinaryExpression",
                operator: ">=",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   + -
   --------------------------------------------------------- */

term
    : factor
        {
            $$ = $1;
        }

    | term PLUS factor
        {
            $$ = {
                type: "BinaryExpression",
                operator: "+",
                left: $1,
                right: $3
            };
        }

    | term MINUS factor
        {
            $$ = {
                type: "BinaryExpression",
                operator: "-",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   * / %
   --------------------------------------------------------- */

factor
    : unary
        {
            $$ = $1;
        }

    | factor MULTIPLY unary
        {
            $$ = {
                type: "BinaryExpression",
                operator: "*",
                left: $1,
                right: $3
            };
        }

    | factor DIVIDE unary
        {
            $$ = {
                type: "BinaryExpression",
                operator: "/",
                left: $1,
                right: $3
            };
        }

    | factor MODULO unary
        {
            $$ = {
                type: "BinaryExpression",
                operator: "%",
                left: $1,
                right: $3
            };
        }
    ;


/* ---------------------------------------------------------
   ! y - unario

   La recursión a la derecha permite expresiones como:

   !!activo
   --numero
   !-x
   --------------------------------------------------------- */

unary
    : NOT unary
        {
            $$ = {
                type: "UnaryExpression",
                operator: "!",
                operand: $2
            };
        }

    | MINUS unary
        {
            $$ = {
                type: "UnaryExpression",
                operator: "-",
                operand: $2
            };
        }

    | postfix
        {
            $$ = $1;
        }
    ;


/* =========================================================
   POSTFIX

   Permite encadenar:

   funcion(...)
   objeto.propiedad
   arreglo[indice]

   Incluso combinaciones:

   foo(a)[0].status
   ========================================================= */

postfix
    : primary
        {
            $$ = $1;
        }

    | postfix LPAREN argument_list_optional RPAREN
        {
            $$ = {
                type: "CallExpression",
                callee: $1,
                arguments: $3
            };
        }

    | postfix DOT IDENTIFIER
        {
            $$ = {
                type: "PropertyAccessExpression",
                object: $1,
                property: $3
            };
        }

    | postfix LBRACKET expression RBRACKET
        {
            $$ = {
                type: "IndexExpression",
                object: $1,
                index: $3
            };
        }
    ;


/* =========================================================
   PRIMARIAS
   ========================================================= */

primary
    : INTEGER_LITERAL
        {
            $$ = {
                type: "LiteralExpression",
                literalType: "int",
                value: Number($1),
                raw: $1
            };
        }

    | DECIMAL_LITERAL
        {
            $$ = {
                type: "LiteralExpression",
                literalType: "float",
                value: Number($1),
                raw: $1
            };
        }

    | STRING_LITERAL
        {
            var raw = $1;

            var valor = raw
                .substring(1, raw.length - 1)
                .replace(/\\(["\\nt])/g, function(coincidencia, escape) {
                    switch (escape) {
                        case "\"":
                            return "\"";

                        case "\\":
                            return "\\";

                        case "n":
                            return "\n";

                        case "t":
                            return "\t";

                        default:
                            return coincidencia;
                    }
                });

            $$ = {
                type: "LiteralExpression",
                literalType: "string",
                value: valor,
                raw: raw
            };
        }

    | TRUE
        {
            $$ = {
                type: "LiteralExpression",
                literalType: "bool",
                value: true,
                raw: $1
            };
        }

    | FALSE
        {
            $$ = {
                type: "LiteralExpression",
                literalType: "bool",
                value: false,
                raw: $1
            };
        }

    | IDENTIFIER
        {
            $$ = {
                type: "IdentifierExpression",
                name: $1
            };
        }

    | LPAREN expression RPAREN
        {
            $$ = $2;
        }

    | LBRACKET argument_list RBRACKET
        {
            $$ = {
                type: "ArrayExpression",
                elements: $2
            };
        }
    ;


/* =========================================================
   LISTAS DE EXPRESIONES

   Se reutilizan temporalmente para:
   - argumentos de llamadas
   - elementos de arreglos
   ========================================================= */

argument_list_optional
    : /* vacío */
        {
            $$ = [];
        }

    | argument_list
        {
            $$ = $1;
        }
    ;


argument_list
    : expression
        {
            $$ = [$1];
        }

    | argument_list COMMA expression
        {
            $1.push($3);
            $$ = $1;
        }
    ;