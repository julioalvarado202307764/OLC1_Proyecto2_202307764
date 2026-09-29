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
    : expression
        {
            return $1;
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

    | LBRACKET argument_list_optional RBRACKET
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