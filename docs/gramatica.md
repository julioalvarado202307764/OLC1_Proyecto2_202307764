# Gramática de AutoInfra

## 1. Alcance 

Este documento describe la gramática **realmente soportada por la versión implementada de AutoInfra**.

La fuente principal es:

```text
Backend/analizador/analizador.jison
```

El archivo:

```text
Backend/analizador/analizador.js
```

es un parser generado por Jison a partir de `analizador.jison`; permanece versionado en el repositorio, pero no es la fuente utilizada para definir esta documentación.

La gramática documentada aquí cubre únicamente análisis léxico, análisis sintáctico, construcción estructural del AST y recuperación de errores léxicos/sintácticos. **No define ni implica** análisis semántico, Interpreter, tabla de símbolos, ejecución o simulación de infraestructura, estado final de infraestructura ni bitácora.

---

## 2. Componente léxico

### 2.1 Macros léxicas

La especificación Jison define las siguientes macros:

```text
digit       = [0-9]
id_start    = [A-Za-z_]
id_continue = [A-Za-z0-9_]
```

Por tanto, un identificador comienza con una letra o `_` y puede continuar con letras, dígitos o `_`.

### 2.2 Espacios y saltos de línea

Se ignoran:

```text
[ \t\f\v]+
\r\n | \r | \n
```

No producen tokens.

### 2.3 Comentarios

#### Comentario de una línea

```text
// comentario hasta el salto de línea
```

Regla léxica:

```text
"//"[^\r\n]*
```

Se ignora completamente.

#### Comentario multilínea

```text
/* comentario */
```

El lexer utiliza el estado exclusivo `COMMENT`:

```text
%x COMMENT
```

Al leer `/*`, guarda la línea y columna iniciales y cambia al estado `COMMENT`. Dentro del comentario se ignoran saltos de línea y cualquier otro carácter hasta encontrar `*/`.

Si se alcanza EOF antes de `*/`, se registra un error léxico:

```text
tipo:        Léxico
descripcion: Comentario multilínea sin cerrar
lexema:      /*
linea:       línea donde inició el comentario
columna:     columna donde inició el comentario
```

Después se vuelve al estado `INITIAL` y finaliza la entrada.

### 2.4 Cadenas

Una cadena correctamente cerrada sigue la regla:

```text
\"([^\"\\\r\n]|\\.)*\"
```

Se reconocen y procesan explícitamente estos escapes:

| Secuencia | Valor procesado |
|---|---|
| `\"` | comilla doble |
| `\\` | barra invertida |
| `\n` | salto de línea |
| `\t` | tabulación |

La expresión regular permite que otros escapes de la forma `\x` permanezcan en la cadena; la implementación no genera un error léxico adicional por ellos.

Una cadena iniciada con `"` pero sin cierre antes del salto de línea o EOF coincide con la regla de recuperación:

```text
\"([^\"\\\r\n]|\\.)*\\?
```

Se registra:

```text
tipo:        Léxico
descripcion: Cadena sin cerrar
lexema:      texto consumido
linea:       línea inicial
columna:     columna inicial
```

La regla no devuelve un token, permitiendo que el lexer continúe cuando sea posible.

### 2.5 Literales numéricos

Los decimales se reconocen antes que los enteros.

```text
DECIMAL_LITERAL := [0-9]+ "." [0-9]+
INTEGER_LITERAL := [0-9]+
```

Formas como `.5` o `5.` no corresponden a `DECIMAL_LITERAL` en la gramática actual.

### 2.6 Identificadores y palabras reservadas

Regla general:

```text
IDENTIFIER := [A-Za-z_][A-Za-z0-9_]*
```

Después de reconocer esa forma, el lexer compara el lexema de forma exacta para determinar si es palabra reservada. La distinción es sensible a mayúsculas y minúsculas.

Palabras reservadas implementadas:

| Lexema | Token | Categoría léxica |
|---|---|---|
| `int` | `INT` | tipo |
| `float` | `FLOAT` | tipo |
| `string` | `STRING` | tipo |
| `bool` | `BOOL` | tipo |
| `server` | `SERVER` | tipo/recurso |
| `service` | `SERVICE` | tipo/recurso |
| `database` | `DATABASE` | tipo/recurso |
| `if` | `IF` | control |
| `else` | `ELSE` | control |
| `while` | `WHILE` | control |
| `for` | `FOR` | control |
| `break` | `BREAK` | control |
| `continue` | `CONTINUE` | control |
| `return` | `RETURN` | control |
| `function` | `FUNCTION` | declaración |
| `task` | `TASK` | declaración |
| `main` | `MAIN` | declaración |
| `run` | `RUN` | instrucción sintáctica |
| `true` | `TRUE` | literal booleano |
| `false` | `FALSE` | literal booleano |

Cualquier lexema con forma de identificador que no coincida exactamente con una palabra reservada produce `IDENTIFIER`.

### 2.7 Operadores

Los operadores de dos caracteres aparecen antes que los de un carácter en el lexer.

| Lexema | Token |
|---|---|
| `==` | `EQUAL` |
| `!=` | `NOT_EQUAL` |
| `>=` | `GREATER_EQUAL` |
| `<=` | `LESS_EQUAL` |
| `&&` | `AND` |
| `||` | `OR` |
| `=` | `ASSIGN` |
| `+` | `PLUS` |
| `-` | `MINUS` |
| `*` | `MULTIPLY` |
| `/` | `DIVIDE` |
| `%` | `MODULO` |
| `>` | `GREATER` |
| `<` | `LESS` |
| `!` | `NOT` |

### 2.8 Delimitadores

| Lexema | Token |
|---|---|
| `(` | `LPAREN` |
| `)` | `RPAREN` |
| `{` | `LBRACE` |
| `}` | `RBRACE` |
| `[` | `LBRACKET` |
| `]` | `RBRACKET` |
| `;` | `SEMICOLON` |
| `,` | `COMMA` |
| `.` | `DOT` |

### 2.9 Fin de archivo

La regla de Jison para EOF devuelve el marcador interno de fin de entrada:

```text
<<EOF>>
```

No se reporta como token de usuario.

### 2.10 Recuperación ante carácter desconocido

La última regla léxica consume exactamente un carácter no reconocido:

```text
.
```

Registra:

```text
tipo:        Léxico
descripcion: Carácter no reconocido
lexema:      carácter consumido
linea:       línea del carácter
columna:     columna del carácter
```

No retorna token y no detiene el lexer; el análisis continúa con la entrada restante.

### 2.11 Información registrada por los tokens

Cada token reconocido guarda:

```text
lexema
tipo
linea
columna
```

Las cadenas también guardan `valorProcesado`. Las columnas expuestas por el analizador se manejan en base 1.

---

## 3. Tokens terminales de la gramática

El conjunto de terminales producido por las reglas léxicas es:

```text
INT FLOAT STRING BOOL SERVER SERVICE DATABASE
IF ELSE WHILE FOR BREAK CONTINUE RETURN
FUNCTION TASK MAIN RUN TRUE FALSE
IDENTIFIER INTEGER_LITERAL DECIMAL_LITERAL STRING_LITERAL
ASSIGN PLUS MINUS MULTIPLY DIVIDE MODULO
EQUAL NOT_EQUAL GREATER LESS GREATER_EQUAL LESS_EQUAL
AND OR NOT
LPAREN RPAREN LBRACE RBRACE LBRACKET RBRACKET
SEMICOLON COMMA DOT
```

El símbolo especial `error` usado más adelante es el mecanismo de recuperación de Jison; no es un token producido por el lexer.

---

## 4. Símbolo inicial

La gramática declara:

```text
%start inicio
```

La entrada válida comienza en `inicio` y debe reducir a `program`.

---

## 5. Notación utilizada en este documento

En las producciones siguientes:

- `::=` separa un no terminal de sus alternativas.
- `|` separa alternativas.
- `ε` representa una producción vacía.
- Los nombres en mayúsculas son terminales del lexer.
- Los nombres en minúsculas son no terminales.
- `error` es el símbolo especial de recuperación de Jison.

Las producciones mantienen la estructura de `Backend/analizador/analizador.jison`. Las acciones JavaScript que construyen nodos del AST se explican cuando afectan qué sintaxis es realmente aceptada.

---

## 6. Gramática sintáctica completa

### 6.1 Inicio y programa

```bnf
inicio
    ::= program

program
    ::= global_declaration_list main_declaration
```

Consecuencias sintácticas de esta producción:

- las declaraciones globales aparecen antes de `main`;
- `main` es obligatorio;
- la gramática construye un único `main_declaration` al final del programa.

### 6.2 Lista de declaraciones globales

```bnf
global_declaration_list
    ::= ε
    | global_declaration_list global_declaration
    | global_declaration_list error global_declaration
```

La tercera alternativa es una producción explícita de recuperación sintáctica y permite continuar al encontrar una declaración global posterior.

### 6.3 Declaraciones globales

```bnf
global_declaration
    ::= primitive_global_variable_declaration
    | SERVER resource_global_tail
    | SERVICE resource_global_tail
    | DATABASE resource_global_tail
    | function_declaration
    | task_declaration
    | error SEMICOLON
    | error RBRACE
```

`SERVER`, `SERVICE` y `DATABASE` comparten `resource_global_tail`. Según la forma de ese no terminal, la construcción representa una declaración de recurso o una variable global cuyo tipo es un recurso.

Las alternativas con `error` son puntos de sincronización sintáctica.

### 6.4 Variables globales primitivas

```bnf
primitive_global_variable_declaration
    ::= primitive_type_specifier IDENTIFIER ASSIGN expression SEMICOLON

primitive_type_specifier
    ::= primitive_base_type
    | primitive_base_type LBRACKET RBRACKET

primitive_base_type
    ::= INT
    | FLOAT
    | STRING
    | BOOL
```

Las variables globales primitivas requieren inicializador.

Ejemplos de formas sintácticas admitidas:

```text
int x = 10;
string[] packages = ["docker", "git"];
```

### 6.5 Recursos y variables globales de tipo recurso

```bnf
resource_global_tail
    ::= IDENTIFIER LBRACE resource_property_list RBRACE
    | IDENTIFIER ASSIGN expression SEMICOLON
    | LBRACKET RBRACKET IDENTIFIER ASSIGN expression SEMICOLON
```

Como `resource_global_tail` aparece después de `SERVER`, `SERVICE` o `DATABASE`, admite las siguientes formas generales:

```text
server nombre { ... }
service nombre { ... }
database nombre { ... }

server variable = expresión;
service variable = expresión;
database variable = expresión;

server[] variable = expresión;
service[] variable = expresión;
database[] variable = expresión;
```

La gramática solo reconoce la estructura sintáctica de las propiedades; no valida nombres de propiedades, tipos, restricciones de dominio ni relaciones entre recursos.

### 6.6 Propiedades de recursos

```bnf
resource_property_list
    ::= ε
    | resource_property_list resource_property

resource_property
    ::= IDENTIFIER ASSIGN expression SEMICOLON
    | error SEMICOLON
```

La lista puede estar vacía.

La segunda alternativa de `resource_property` recupera errores sincronizando en `;`.

### 6.7 Funciones

```bnf
function_declaration
    ::= FUNCTION IDENTIFIER
        LPAREN parameter_list_optional RPAREN
        type_specifier
        block

parameter_list_optional
    ::= ε
    | parameter_list

parameter_list
    ::= parameter
    | parameter_list COMMA parameter

parameter
    ::= type_specifier IDENTIFIER
```

Forma general:

```text
function nombre(tipo parametro, ...) tipoRetorno {
    ...
}
```

La gramática requiere un `type_specifier` de retorno; no existe un token o producción `void`.

### 6.8 Tasks

```bnf
task_declaration
    ::= TASK IDENTIFIER block
```

Forma:

```text
task nombre {
    ...
}
```

La producción no admite parámetros para `task`.

### 6.9 Main

```bnf
main_declaration
    ::= MAIN block
```

Forma:

```text
main {
    ...
}
```

### 6.10 Tipos

```bnf
type_specifier
    ::= base_type
    | base_type LBRACKET RBRACKET

base_type
    ::= INT
    | FLOAT
    | STRING
    | BOOL
    | SERVER
    | SERVICE
    | DATABASE
```

Los tipos sintácticos disponibles son:

```text
int
float
string
bool
server
service
database
```

Cada uno puede escribirse también en forma de arreglo con `[]` cuando la producción usa `type_specifier`.

### 6.11 Bloques

```bnf
block
    ::= LBRACE statement_list RBRACE
    | LBRACE statement_list error RBRACE

statement_list
    ::= ε
    | statement_list statement
```

Un bloque puede estar vacío.

La segunda alternativa de `block` es una regla de recuperación que permite sincronizar antes del `}` sin convertir ese cierre en una instrucción separada.

### 6.12 Instrucciones

```bnf
statement
    ::= variable_declaration
    | simple_statement
    | if_statement
    | while_statement
    | for_statement
    | break_statement
    | continue_statement
    | return_statement
    | run_statement
    | error SEMICOLON
```

La última alternativa recupera un error de instrucción sincronizando en `;`.

### 6.13 Run

```bnf
run_statement
    ::= RUN IDENTIFIER SEMICOLON
```

Forma:

```text
run nombre;
```

Esta es únicamente una construcción sintáctica en esta versión; la gramática no implementa semántica de tareas ni ejecución.

### 6.14 If / else / else if

```bnf
if_statement
    ::= IF LPAREN expression RPAREN block
    | IF LPAREN expression RPAREN block ELSE block
    | IF LPAREN expression RPAREN block ELSE if_statement
```

La tercera alternativa permite cadenas `else if` mediante otro `if_statement` como rama `else`.

### 6.15 While

```bnf
while_statement
    ::= WHILE LPAREN expression RPAREN block
```

### 6.16 Instrucciones simples

```bnf
simple_statement
    ::= expression SEMICOLON
    | assignment_core SEMICOLON
```

Existe una restricción sintáctica adicional implementada en la acción de la primera producción:

> `expression SEMICOLON` solo se conserva como instrucción si la expresión construida es un `CallExpression`.

Si no es una llamada, se registra manualmente el error sintáctico:

```text
Solo una llamada puede utilizarse como expresión independiente.
```

Por ello son formas sintácticamente válidas como statements:

```text
print("hola");
foo();
obj.metodo();
```

pero una expresión aislada como:

```text
1 + 2;
```

se registra como error sintáctico por la acción del parser.

### 6.17 Asignación

```bnf
assignment_core
    ::= expression ASSIGN expression
```

La acción asociada impone una restricción estructural al lado izquierdo. Solo puede ser un nodo de uno de estos tipos:

```text
IdentifierExpression
PropertyAccessExpression
IndexExpression
```

Si el lado izquierdo tiene otra forma, se registra:

```text
Objetivo de asignación sintácticamente inválido.
```

Por tanto, las formas estructurales admitidas son equivalentes a:

```text
identificador = expresión
objeto.propiedad = expresión
arreglo[indice] = expresión
```

Esta verificación es estructural/sintáctica; no valida existencia, mutabilidad, tipo ni otras condiciones semánticas.

### 6.18 For

```bnf
for_statement
    ::= FOR LPAREN
        variable_declaration_core SEMICOLON
        expression SEMICOLON
        assignment_core
        RPAREN block
```

Forma general implementada:

```text
for (tipo id = expresión; expresión; asignación) {
    ...
}
```

Las tres secciones son obligatorias en la producción actual. No existen alternativas para inicializador, condición o actualización vacíos.

### 6.19 Break y continue

```bnf
break_statement
    ::= BREAK SEMICOLON

continue_statement
    ::= CONTINUE SEMICOLON
```

La gramática reconoce estas instrucciones donde aparezca un `statement`. Esta versión no realiza una validación semántica sobre si están dentro de un ciclo.

### 6.20 Return

```bnf
return_statement
    ::= RETURN expression SEMICOLON
```

La expresión es obligatoria. La gramática actual no contiene una producción para:

```text
return;
```

Tampoco realiza validación semántica sobre contexto de función o compatibilidad del valor retornado.

### 6.21 Declaraciones de variables locales

```bnf
variable_declaration
    ::= variable_declaration_core SEMICOLON

variable_declaration_core
    ::= type_specifier IDENTIFIER ASSIGN expression
```

El inicializador es obligatorio.

Como `type_specifier` incluye todos los `base_type`, las declaraciones locales admiten tipos primitivos, tipos de recurso y sus formas de arreglo.

### 6.22 Expresiones: nivel superior

```bnf
expression
    ::= logical_or
```

La precedencia se obtiene por la jerarquía de no terminales que sigue.

### 6.23 OR lógico

```bnf
logical_or
    ::= logical_and
    | logical_or OR logical_and
```

Operador:

```text
||
```

### 6.24 AND lógico

```bnf
logical_and
    ::= equality
    | logical_and AND equality
```

Operador:

```text
&&
```

### 6.25 Igualdad y desigualdad

```bnf
equality
    ::= comparison
    | equality EQUAL comparison
    | equality NOT_EQUAL comparison
```

Operadores:

```text
==
!=
```

### 6.26 Comparación

```bnf
comparison
    ::= term
    | comparison LESS term
    | comparison LESS_EQUAL term
    | comparison GREATER term
    | comparison GREATER_EQUAL term
```

Operadores:

```text
<
<=
>
>=
```

### 6.27 Suma y resta

```bnf
term
    ::= factor
    | term PLUS factor
    | term MINUS factor
```

Operadores:

```text
+
-
```

### 6.28 Multiplicación, división y módulo

```bnf
factor
    ::= unary
    | factor MULTIPLY unary
    | factor DIVIDE unary
    | factor MODULO unary
```

Operadores:

```text
*
/
%
```

### 6.29 Operadores unarios

```bnf
unary
    ::= NOT unary
    | MINUS unary
    | postfix
```

Operadores:

```text
!
-
```

La recursión a la derecha admite encadenamientos como:

```text
!!activo
--numero
!-x
```

### 6.30 Expresiones postfix

```bnf
postfix
    ::= primary
    | postfix LPAREN argument_list_optional RPAREN
    | postfix DOT IDENTIFIER
    | postfix LBRACKET expression RBRACKET
```

Estas producciones permiten:

```text
llamadas
acceso a propiedades
acceso por índice
```

y también encadenamientos estructurales como:

```text
foo(a)[0].status
```

La gramática no restringe sintácticamente el `callee` de una llamada a un identificador simple: cualquier `postfix` previo puede continuar con `(...)`.

### 6.31 Expresiones primarias

```bnf
primary
    ::= INTEGER_LITERAL
    | DECIMAL_LITERAL
    | STRING_LITERAL
    | TRUE
    | FALSE
    | IDENTIFIER
    | LPAREN expression RPAREN
    | LBRACKET argument_list RBRACKET
```

Estas alternativas construyen, respectivamente:

- literal entero;
- literal decimal;
- literal string;
- literal booleano `true`;
- literal booleano `false`;
- expresión identificador;
- expresión agrupada;
- literal de arreglo.

La producción de arreglo utiliza `argument_list`, no `argument_list_optional`. Por tanto, la gramática actual exige al menos un elemento:

```text
[1]                 válido
["a", "b"]         válido
[]                  no admitido por esta producción
```

### 6.32 Listas de argumentos y elementos

```bnf
argument_list_optional
    ::= ε
    | argument_list

argument_list
    ::= expression
    | argument_list COMMA expression
```

Las llamadas utilizan `argument_list_optional`, por lo que pueden no tener argumentos:

```text
foo()
```

Los literales de arreglo utilizan directamente `argument_list`, por lo que no pueden estar vacíos en la gramática actual.

---

## 7. Precedencia y asociatividad

`analizador.jison` no declara precedencia mediante directivas `%left`, `%right` o `%nonassoc`. La precedencia está codificada por la jerarquía de no terminales.

De menor a mayor precedencia:

| Nivel | Construcción | Operadores / formas | Asociatividad estructural |
|---:|---|---|---|
| 1 | `logical_or` | `||` | izquierda |
| 2 | `logical_and` | `&&` | izquierda |
| 3 | `equality` | `==`, `!=` | izquierda |
| 4 | `comparison` | `<`, `<=`, `>`, `>=` | izquierda |
| 5 | `term` | `+`, `-` | izquierda |
| 6 | `factor` | `*`, `/`, `%` | izquierda |
| 7 | `unary` | `!`, `-` unario | derecha |
| 8 | `postfix` | llamada `()`, propiedad `.`, índice `[]` | encadenamiento por recursión izquierda |
| 9 | `primary` | literales, identificador, agrupación, arreglo | atómica |

Los paréntesis de `primary` permiten agrupar expresiones y alterar el agrupamiento derivado de esta jerarquía.

La tabla describe únicamente precedencia/asociatividad sintáctica. No documenta evaluación, corto circuito ni tipos de operandos porque esas funciones no forman parte del alcance implementado.

---

## 8. Recuperación sintáctica implementada

La gramática contiene las siguientes producciones explícitas con el símbolo especial `error` de Jison:

```bnf
global_declaration_list
    ::= global_declaration_list error global_declaration

global_declaration
    ::= error SEMICOLON
    | error RBRACE

resource_property
    ::= error SEMICOLON

block
    ::= LBRACE statement_list error RBRACE

statement
    ::= error SEMICOLON
```

Los principales puntos de sincronización usados por estas producciones son:

```text
;
}
una declaración global válida posterior
```

Además de esas producciones, `Backend/analizador/parser.ts` instala un `parseError` personalizado. Cuando Jison marca el error como recuperable, el error sintáctico se registra y el parser puede continuar. Un error sintáctico conserva:

```text
tipo
descripcion
lexema
linea
columna
```

El wrapper también reconoce específicamente el aborto de recuperación de Jison:

```text
Parsing halted while starting to recover from another error.
```

Ese caso solo se trata como parte del análisis normal cuando ya existe al menos un error sintáctico registrado. No se inventa un error adicional por esa excepción.

---

## 9. Restricciones sintácticas implementadas mediante acciones del parser

Hay dos verificaciones que no aparecen como un no terminal más específico, pero sí forman parte del comportamiento sintáctico real porque están implementadas en las acciones de `analizador.jison`.

### 9.1 Expresión independiente

La producción:

```bnf
simple_statement
    ::= expression SEMICOLON
```

solo produce un `ExpressionStatement` cuando `expression` es un `CallExpression`.

En otro caso se registra:

```text
Solo una llamada puede utilizarse como expresión independiente.
```

### 9.2 Objetivo de asignación

La producción:

```bnf
assignment_core
    ::= expression ASSIGN expression
```

solo produce un nodo `Assignment` si la expresión izquierda tiene una de estas estructuras:

```text
IdentifierExpression
PropertyAccessExpression
IndexExpression
```

En otro caso se registra:

```text
Objetivo de asignación sintácticamente inválido.
```

Estas verificaciones no comprueban declaraciones, tipos, propiedades existentes o mutabilidad; esas validaciones no forman parte de esta versión.

---

## 10. Resumen estructural de la sintaxis soportada

La gramática implementada reconoce estructuralmente:

```text
Programa
├── declaraciones globales (0..n)
│   ├── variables primitivas
│   ├── variables de tipo recurso
│   ├── recursos server/service/database
│   ├── functions
│   └── tasks
└── main obligatorio

Bloques
└── statements (0..n)
    ├── declaración de variable
    ├── asignación
    ├── llamada como statement
    ├── if / else / else if
    ├── while
    ├── for
    ├── break
    ├── continue
    ├── return expresión
    └── run identificador

Expresiones
├── literales int/float/string/bool
├── identificadores
├── agrupación
├── arreglos no vacíos
├── operadores binarios
├── operadores unarios
├── llamadas
├── acceso a propiedades
└── acceso por índice
```

---

## 11. Elementos expresamente fuera de esta gramática/documentación

Aunque algunos lexemas tengan nombres relacionados con automatización de infraestructura, esta versión documenta únicamente reconocimiento léxico/sintáctico y construcción estructural del AST.

No se documentan como implementados:

```text
análisis semántico
tabla de símbolos
validación de declaraciones o ámbitos
validación de tipos
validación de firmas o parámetros
validación contextual de break/continue/return
validación de propiedades o restricciones de recursos
Interpreter / motor de ejecución
evaluación de expresiones
ejecución de instrucciones
simulación de infraestructura
estado final de infraestructura
bitácora
errores semánticos
errores de infraestructura
```

Por ejemplo, `run`, `start(...)`, `deploy(...)` o `scale(...)` pueden ser reconocidos por las producciones correspondientes a `run_statement` o llamadas, pero este documento no les atribuye efectos de ejecución.

---

## 12. Correspondencia con el AST

Las acciones de la gramática construyen un AST propio con nodos estructurales como:

```text
Program
VariableDeclaration
ResourceDeclaration
ResourceProperty
FunctionDeclaration
TaskDeclaration
MainDeclaration
Parameter
Block
Assignment
ExpressionStatement
IfInstruction
WhileInstruction
ForInstruction
BreakInstruction
ContinueInstruction
ReturnInstruction
RunInstruction
LiteralExpression
IdentifierExpression
BinaryExpression
UnaryExpression
CallExpression
PropertyAccessExpression
IndexExpression
ArrayExpression
```

La existencia de estos nodos describe la estructura sintáctica del programa; no implica métodos de ejecución o evaluación.

---

## 13. Fuente de regeneración

La gramática fuente se mantiene en:

```text
Backend/analizador/analizador.jison
```

El parser generado y versionado se obtiene mediante el script del Backend:

```bash
npm run parse
```

que genera:

```text
Backend/analizador/analizador.js
```

`analizador.js` debe considerarse un artefacto generado por Jison y no la fuente manual de esta gramática.
